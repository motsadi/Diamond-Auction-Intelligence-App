"""
FastAPI application for Diamond Auction Intelligence backend.
"""

import os
import uuid
import io
from typing import Optional, Dict, Any, List
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
from datetime import datetime

from ml.train import train_models, predict_and_recommend
from ml.predict import batch_predict, get_preview_rows
from ml.optimize import random_search_optimize, compute_surface
from ml.explain import get_global_feature_importance, compute_shap_values
from lib.storage import (
    generate_signed_upload_url,
    read_csv_from_gcs,
    write_csv_to_gcs,
)
from lib.instantdb import create_dataset, create_prediction

# Configuration
GCS_BUCKET = os.getenv("GCS_BUCKET_NAME")
INSTANTDB_API_KEY = os.getenv("INSTANTDB_API_KEY")
STATIC_DATASET_ID = "synthetic-auction"

# Model cache (in production, use Redis or similar)
_model_cache: dict = {}
# In-memory storage for prediction results (for static dataset demo)
_prediction_results: dict = {}

app = FastAPI(title="Diamond Auction Intelligence API", version="1.0.0")

# CORS configuration
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
]

vercel_url = os.getenv("VERCEL_URL")
if vercel_url:
    origins.append(f"https://{vercel_url}")


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Auth dependency (simplified - in production, verify JWT from InstantDB)
async def verify_auth(authorization: Optional[str] = Header(None)):
    """Verify authentication token."""
    if not authorization:
        raise HTTPException(status_code=401, detail="Missing authorization header")
    # In production, decode and verify JWT token from InstantDB
    # For now, we'll accept any token (implement proper JWT verification)
    token = authorization.replace("Bearer ", "")
    return token


# Request/Response models
class SignedUploadRequest(BaseModel):
    filename: str
    contentType: str = "text/csv"


class SignedUploadResponse(BaseModel):
    uploadUrl: str
    bucket: str
    objectKey: str
    datasetId: str


class RegisterDatasetRequest(BaseModel):
    datasetId: str
    name: str
    gcsBucket: str
    gcsObject: str


class RegisterDatasetResponse(BaseModel):
    success: bool
    datasetId: str
    rowCount: int
    columns: list


class PredictRequest(BaseModel):
    datasetId: str
    modelName: str
    gcsObject: Optional[str] = None
    horizon: Optional[int] = None


class PredictResponse(BaseModel):
    success: bool
    predictionId: str
    metrics: Optional[dict] = None
    previewRows: Optional[list] = None
    outputGcsObject: Optional[str] = None
    outputCsvData: Optional[str] = None  # Base64 encoded CSV for static dataset


class SinglePredictRequest(BaseModel):
    datasetId: str
    modelName: str
    carat: float
    color: str
    clarity: str
    viewings: int
    price_index: float


class SinglePredictResponse(BaseModel):
    success: bool
    pred_price: float
    pred_sale_proba: float
    recommended_reserve: float


class OptimizeRequest(BaseModel):
    datasetId: str
    modelName: str
    objective: str  # "max_price", "max_prob", "target"
    n_samples: int = 1000
    min_prob: float = 0.0
    target_price: Optional[float] = None
    target_prob: Optional[float] = None
    fixed_color: Optional[str] = None
    fixed_clarity: Optional[str] = None


class OptimizeResponse(BaseModel):
    success: bool
    result: Optional[Dict[str, Any]] = None
    message: Optional[str] = None


class SurfaceRequest(BaseModel):
    datasetId: str
    modelName: str
    var_x: str
    var_y: str
    metric: str = "Final Price"  # "Final Price", "Sale Probability", "Expected Revenue"
    n_points: int = 25
    fixed_color: Optional[str] = None
    fixed_clarity: Optional[str] = None


class SurfaceResponse(BaseModel):
    success: bool
    x_grid: List[List[float]]
    y_grid: List[List[float]]
    z_values: List[List[float]]


class ShapRequest(BaseModel):
    datasetId: str
    modelName: str


class ShapResponse(BaseModel):
    success: bool
    price_importance: Dict[str, float]
    sale_importance: Dict[str, float]


# Routes
@app.get("/health")
async def health():
    """Health check endpoint."""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


@app.post("/datasets/signed-upload", response_model=SignedUploadResponse)
async def get_signed_upload_url(
    request: SignedUploadRequest,
    token: str = Depends(verify_auth),
):
    """
    Generate a signed URL for uploading a dataset CSV to GCS.
    
    The client will use this URL to upload the file directly to GCS,
    bypassing the API server.
    """
    if not GCS_BUCKET:
        raise HTTPException(status_code=500, detail="GCS_BUCKET_NAME not configured")

    # Generate unique dataset ID and object key
    dataset_id = str(uuid.uuid4())
    user_id = "user_placeholder"  # Extract from token in production
    object_key = f"datasets/{user_id}/{dataset_id}/{request.filename}"

    try:
        upload_url = generate_signed_upload_url(
            bucket_name=GCS_BUCKET,
            object_name=object_key,
            content_type=request.contentType,
        )
        return SignedUploadResponse(
            uploadUrl=upload_url,
            bucket=GCS_BUCKET,
            objectKey=object_key,
            datasetId=dataset_id,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate signed URL: {str(e)}")


@app.post("/datasets/register", response_model=RegisterDatasetResponse)
async def register_dataset(
    request: RegisterDatasetRequest,
    token: str = Depends(verify_auth),
):
    """
    Register a dataset after it has been uploaded to GCS.

    This endpoint validates the CSV schema and stores metadata in InstantDB.
    """
    if not GCS_BUCKET:
        raise HTTPException(status_code=500, detail="GCS_BUCKET_NAME not configured")

    try:
        # 1) Read CSV from GCS to validate
        csv_bytes = read_csv_from_gcs(request.gcsBucket, request.gcsObject)
        df = pd.read_csv(io.BytesIO(csv_bytes))

        # 2) Validate required columns
        required_cols = ["carat", "color", "clarity", "viewings", "price_index"]
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            raise HTTPException(
                status_code=400,
                detail=f"Missing required columns: {', '.join(missing_cols)}",
            )

        # 3) Store metadata in InstantDB (OPTIONAL for now)
        try:
            user_id = "user_placeholder"
            create_dataset(
                dataset_id=request.datasetId,
                owner_id=user_id,
                name=request.name,
                gcs_bucket=request.gcsBucket,
                gcs_object=request.gcsObject,
                row_count=len(df),
                columns=list(df.columns),
            )
        except Exception as e:
            print(f"[WARN] InstantDB create_dataset failed (ignored): {e}")

        # 4) Return success response
        return RegisterDatasetResponse(
            success=True,
            datasetId=request.datasetId,
            rowCount=len(df),
            columns=list(df.columns),
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to register dataset: {str(e)}")


def load_static_dataset() -> pd.DataFrame:
    """Load the static synthetic auction dataset."""
    static_file = os.path.join(os.path.dirname(__file__), "synthetic_auction_data.csv")
    if not os.path.exists(static_file):
        # Try alternative locations
        alt_paths = [
            os.path.join(os.path.dirname(os.path.dirname(__file__)), "streamlit-demo", "synthetic_auction_data.csv"),
            os.path.join(os.path.dirname(os.path.dirname(__file__)), "web", "public", "data", "synthetic_auction_data.csv"),
        ]
        for path in alt_paths:
            if os.path.exists(path):
                static_file = path
                break
        else:
            raise HTTPException(status_code=500, detail="Static dataset file not found")
    return pd.read_csv(static_file)


@app.post("/predict", response_model=PredictResponse)
async def predict(
    request: PredictRequest,
    token: str = Depends(verify_auth),
):
    """
    Run predictions on a dataset.
    
    This endpoint:
    1. Loads the dataset (from GCS or static file)
    2. Trains models (or uses cached models)
    3. Generates predictions
    4. Stores results in GCS and metadata in InstantDB
    """
    try:
        # Handle static dataset
        if request.datasetId == STATIC_DATASET_ID:
            df = load_static_dataset()
            use_gcs = False
        else:
            # Load from GCS
            if not GCS_BUCKET:
                raise HTTPException(status_code=500, detail="GCS_BUCKET_NAME not configured")
            if not request.gcsObject:
                raise HTTPException(
                    status_code=400,
                    detail="gcsObject is required for non-static datasets.",
                )
            dataset_gcs_object = request.gcsObject
            print(f"[DEBUG] Loading dataset from bucket={GCS_BUCKET} object={dataset_gcs_object}")
            csv_bytes = read_csv_from_gcs(GCS_BUCKET, dataset_gcs_object)
            df = pd.read_csv(io.BytesIO(csv_bytes))
            use_gcs = True

        # Check if we have target columns for training
        has_targets = "final_price" in df.columns and "sold" in df.columns

        # Train models (or use cache)
        cache_key = f"{request.datasetId}_{request.modelName}"
        if cache_key not in _model_cache:
            if not has_targets:
                raise HTTPException(
                    status_code=400,
                    detail="Dataset missing target columns (final_price, sold) for training",
                )
            result = train_models(df, model_name=request.modelName)
            _model_cache[cache_key] = result["models"]
            metrics = result["metrics"]
        else:
            metrics = None  # Would compute from test set if available

        # Generate predictions
        models = _model_cache[cache_key]
        df_pred = batch_predict(df, models["price_model"], models["sale_model"])

        prediction_id = str(uuid.uuid4())
        output_csv = df_pred.to_csv(index=False).encode("utf-8")
        output_object = None
        output_csv_data = None

        if use_gcs and GCS_BUCKET:
            # Save predictions to GCS
            output_object = f"predictions/{prediction_id}/results.csv"
            write_csv_to_gcs(GCS_BUCKET, output_object, output_csv)
            
            # Store prediction metadata in InstantDB
            user_id = "user_placeholder"  # Extract from token in production
            try:
                create_prediction(
                    prediction_id=prediction_id,
                    owner_id=user_id,
                    dataset_id=request.datasetId,
                    model_name=request.modelName,
                    metrics=metrics,
                    horizon=request.horizon,
                    output_gcs_object=output_object,
                    preview_rows=get_preview_rows(df_pred, n_rows=10),
                )
            except Exception as e:
                print(f"[WARN] InstantDB create_prediction failed (ignored): {e}")
        else:
            # Store in memory for static dataset
            import base64
            output_csv_data = base64.b64encode(output_csv).decode("utf-8")
            _prediction_results[prediction_id] = {
                "csv_data": output_csv_data,
            }

        # Get preview rows
        preview_rows = get_preview_rows(df_pred, n_rows=10)

        return PredictResponse(
            success=True,
            predictionId=prediction_id,
            metrics=metrics,
            previewRows=preview_rows,
            outputGcsObject=output_object,
            outputCsvData=output_csv_data,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


@app.post("/predict-single", response_model=SinglePredictResponse)
async def predict_single(
    request: SinglePredictRequest,
    token: str = Depends(verify_auth),
):
    """
    Predict price and sale probability for a single lot and recommend reserve price.
    
    This endpoint matches the Streamlit demo's single-lot prediction functionality.
    """
    try:
        # Load dataset to train models (or use cached models)
        if request.datasetId == STATIC_DATASET_ID:
            df = load_static_dataset()
        else:
            raise HTTPException(
                status_code=400,
                detail="Single-lot prediction currently only supported for static dataset",
            )

        # Train models (or use cache)
        cache_key = f"{request.datasetId}_{request.modelName}"
        if cache_key not in _model_cache:
            result = train_models(df, model_name=request.modelName)
            _model_cache[cache_key] = result["models"]

        models = _model_cache[cache_key]

        # Prepare input DataFrame
        input_df = pd.DataFrame({
            "carat": [request.carat],
            "color": [request.color],
            "clarity": [request.clarity],
            "viewings": [request.viewings],
            "price_index": [request.price_index],
        })

        # Get prediction and recommendation
        result = predict_and_recommend(
            models["price_model"],
            models["sale_model"],
            input_df,
        )

        return SinglePredictResponse(
            success=True,
            pred_price=result["pred_price"],
            pred_sale_proba=result["pred_sale_proba"],
            recommended_reserve=result["recommended_reserve"],
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Single prediction failed: {str(e)}")


@app.get("/predictions/{prediction_id}/download")
async def download_prediction(
    prediction_id: str,
    token: str = Depends(verify_auth),
):
    """
    Download prediction results as CSV.
    
    For static dataset predictions, returns the CSV data directly.
    For GCS predictions, generates a signed download URL.
    """
    from fastapi.responses import Response
    
    # Check if prediction is in memory (static dataset)
    if prediction_id in _prediction_results:
        import base64
        csv_data = base64.b64decode(_prediction_results[prediction_id]["csv_data"])
        return Response(
            content=csv_data,
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="predictions_{prediction_id}.csv"'},
        )
    
    # Otherwise, read from GCS and return as blob
    if not GCS_BUCKET:
        raise HTTPException(status_code=500, detail="GCS_BUCKET_NAME not configured")
    
    # In production, query InstantDB to get outputGcsObject for this prediction_id
    # For now, we'll try the standard path pattern
    output_object = f"predictions/{prediction_id}/results.csv"
    
    try:
        csv_bytes = read_csv_from_gcs(GCS_BUCKET, output_object)
        return Response(
            content=csv_bytes,
            media_type="text/csv",
            headers={"Content-Disposition": f'attachment; filename="predictions_{prediction_id}.csv"'},
        )
    except Exception as e:
        raise HTTPException(
            status_code=404,
            detail=f"Prediction not found: {str(e)}",
        )


@app.post("/optimize", response_model=OptimizeResponse)
async def optimize(
    request: OptimizeRequest,
    token: str = Depends(verify_auth),
):
    """
    Perform goal seeking/optimization to find optimal conditions.
    
    Supports three objectives:
    - max_price: Maximize predicted final price (with optional min_prob constraint)
    - max_prob: Maximize predicted sale probability
    - target: Match target price and sale probability
    """
    try:
        # Load dataset
        if request.datasetId == STATIC_DATASET_ID:
            df = load_static_dataset()
        else:
            raise HTTPException(
                status_code=400,
                detail="Optimization currently only supported for static dataset",
            )

        # Get or train models
        cache_key = f"{request.datasetId}_{request.modelName}"
        if cache_key not in _model_cache:
            result = train_models(df, model_name=request.modelName)
            _model_cache[cache_key] = result["models"]

        models = _model_cache[cache_key]

        # Run optimization
        result = random_search_optimize(
            df,
            models["price_model"],
            models["sale_model"],
            objective=request.objective,
            n_samples=request.n_samples,
            min_prob=request.min_prob,
            target_price=request.target_price,
            target_prob=request.target_prob,
            fixed_color=request.fixed_color,
            fixed_clarity=request.fixed_clarity,
        )

        if result:
            return OptimizeResponse(success=True, result=result)
        else:
            return OptimizeResponse(
                success=False,
                message="No feasible solution found that meets the constraints.",
            )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Optimization failed: {str(e)}")


@app.post("/surface", response_model=SurfaceResponse)
async def surface(
    request: SurfaceRequest,
    token: str = Depends(verify_auth),
):
    """
    Compute 3D solution surface for two variables.
    
    Returns grid data suitable for Plotly 3D surface plotting.
    """
    try:
        # Load dataset
        if request.datasetId == STATIC_DATASET_ID:
            df = load_static_dataset()
        else:
            raise HTTPException(
                status_code=400,
                detail="Surface computation currently only supported for static dataset",
            )

        # Get or train models
        cache_key = f"{request.datasetId}_{request.modelName}"
        if cache_key not in _model_cache:
            result = train_models(df, model_name=request.modelName)
            _model_cache[cache_key] = result["models"]

        models = _model_cache[cache_key]

        # Compute surface
        X_grid, Y_grid, Z = compute_surface(
            df,
            models["price_model"],
            models["sale_model"],
            var_x=request.var_x,
            var_y=request.var_y,
            metric=request.metric,
            n_points=request.n_points,
            fixed_color=request.fixed_color,
            fixed_clarity=request.fixed_clarity,
        )

        # Convert numpy arrays to lists for JSON serialization
        return SurfaceResponse(
            success=True,
            x_grid=X_grid.tolist(),
            y_grid=Y_grid.tolist(),
            z_values=Z.tolist(),
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Surface computation failed: {str(e)}")


@app.post("/shap", response_model=ShapResponse)
async def shap_explain(
    request: ShapRequest,
    token: str = Depends(verify_auth),
):
    """
    Compute SHAP feature importance for model explainability.
    """
    try:
        # Load dataset
        if request.datasetId == STATIC_DATASET_ID:
            df = load_static_dataset()
        else:
            raise HTTPException(
                status_code=400,
                detail="SHAP explainability currently only supported for static dataset",
            )

        # Get or train models
        cache_key = f"{request.datasetId}_{request.modelName}"
        if cache_key not in _model_cache:
            result = train_models(df, model_name=request.modelName)
            _model_cache[cache_key] = result["models"]

        models = _model_cache[cache_key]

        # Prepare training data
        feature_cols = ["carat", "color", "clarity", "viewings", "price_index"]
        X_train = df[feature_cols]

        # Get SHAP feature importance
        importance = get_global_feature_importance(
            models["price_model"],
            models["sale_model"],
            X_train,
        )

        return ShapResponse(
            success=True,
            price_importance=importance["price_importance"],
            sale_importance=importance["sale_importance"],
        )
    except ImportError as e:
        raise HTTPException(
            status_code=500,
            detail=f"SHAP library not available: {str(e)}. Install with: pip install shap",
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"SHAP computation failed: {str(e)}")


@app.post("/backtest")
async def backtest(
    request: PredictRequest,
    token: str = Depends(verify_auth),
):
    """
    Run backtest on a dataset with ground truth.
    
    Returns metrics comparing predictions to actual values.
    """
    # Similar to /predict but computes metrics against ground truth
    # Implementation similar to predict endpoint
    return {"message": "Backtest endpoint - implementation similar to /predict"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

