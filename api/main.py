"""
FastAPI application for Diamond Auction Intelligence backend.
"""

import os
import uuid
import io
from typing import Optional
from fastapi import FastAPI, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
from datetime import datetime

from ml.train import train_models
from ml.predict import batch_predict, get_preview_rows
from lib.storage import (
    generate_signed_upload_url,
    read_csv_from_gcs,
    write_csv_to_gcs,
)
from lib.instantdb import create_dataset, create_prediction

# Configuration
GCS_BUCKET = os.getenv("GCS_BUCKET_NAME")
INSTANTDB_API_KEY = os.getenv("INSTANTDB_API_KEY")

# Model cache (in production, use Redis or similar)
_model_cache: dict = {}

app = FastAPI(title="Diamond Auction Intelligence API", version="1.0.0")

# CORS configuration
origins = [
    "http://localhost:3000",
    "http://localhost:3001",
    os.getenv("VERCEL_URL", ""),  # Add your Vercel domain
]

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


@app.post("/predict", response_model=PredictResponse)
async def predict(
    request: PredictRequest,
    token: str = Depends(verify_auth),
):
    """
    Run predictions on a dataset.
    
    This endpoint:
    1. Loads the dataset from GCS
    2. Trains models (or uses cached models)
    3. Generates predictions
    4. Stores results in GCS and metadata in InstantDB
    """
    if not GCS_BUCKET:
        raise HTTPException(status_code=500, detail="GCS_BUCKET_NAME not configured")

    try:
        # Get dataset metadata from InstantDB (simplified - in production, query InstantDB)
        # For now, we'll assume we know the GCS path
        # In production: query InstantDB to get gcsBucket and gcsObject for datasetId
        
        # Load dataset from GCS
        # This is a placeholder - in production, fetch from InstantDB first

        if not request.gcsObject:
            raise HTTPException(
                status_code=400,
                detail="gcsObject is required. Pass objectKey returned by /datasets/signed-upload.",
            )

        dataset_gcs_object = request.gcsObject
        print(f"[DEBUG] Loading dataset from bucket={GCS_BUCKET} object={dataset_gcs_object}")

        csv_bytes = read_csv_from_gcs(GCS_BUCKET, dataset_gcs_object)

        df = pd.read_csv(io.BytesIO(csv_bytes))

        # Check if we have target columns for training
        has_targets = "final_price" in df.columns and "sold" in df.columns

        # Train models (or use cache)
        cache_key = f"{request.datasetId}_{request.modelName}"
        if cache_key not in _model_cache or not has_targets:
            if not has_targets:
                raise HTTPException(
                    status_code=400,
                    detail="Dataset missing target columns (final_price, sold) for training",
                )
            result = train_models(df, model_name=request.modelName)
            _model_cache[cache_key] = result["models"]
            metrics = result["metrics"]
        else:
            models = _model_cache[cache_key]
            metrics = None  # Would compute from test set if available

        # Generate predictions
        models = _model_cache[cache_key]
        df_pred = batch_predict(df, models["price_model"], models["sale_model"])

        # Save predictions to GCS
        prediction_id = str(uuid.uuid4())
        output_object = f"predictions/{prediction_id}/results.csv"
        output_csv = df_pred.to_csv(index=False).encode("utf-8")
        write_csv_to_gcs(GCS_BUCKET, output_object, output_csv)

        # Get preview rows
        preview_rows = get_preview_rows(df_pred, n_rows=10)

        # Store prediction metadata in InstantDB
        user_id = "user_placeholder"  # Extract from token in production
        create_prediction(
            prediction_id=prediction_id,
            owner_id=user_id,
            dataset_id=request.datasetId,
            model_name=request.modelName,
            metrics=metrics,
            horizon=request.horizon,
            output_gcs_object=output_object,
            preview_rows=preview_rows,
        )

        return PredictResponse(
            success=True,
            predictionId=prediction_id,
            metrics=metrics,
            previewRows=preview_rows,
            outputGcsObject=output_object,
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")


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

