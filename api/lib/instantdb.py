"""
InstantDB client utilities.
"""

import os
import httpx
from typing import Dict, Any, Optional


INSTANTDB_API_KEY = os.getenv("INSTANTDB_API_KEY")
INSTANTDB_APP_ID = os.getenv("INSTANTDB_APP_ID")
INSTANTDB_API_URL = os.getenv("INSTANTDB_API_URL", "https://api.instantdb.com")


def get_instantdb_client():
    """Get InstantDB HTTP client."""
    if not INSTANTDB_API_KEY:
        raise ValueError("INSTANTDB_API_KEY environment variable is not set")
    
    return httpx.Client(
        base_url=INSTANTDB_API_URL,
        headers={
            "Authorization": f"Bearer {INSTANTDB_API_KEY}",
            "Content-Type": "application/json",
        },
        timeout=30.0,
    )


def create_dataset(
    dataset_id: str,
    owner_id: str,
    name: str,
    gcs_bucket: str,
    gcs_object: str,
    row_count: int,
    columns: list,
    notes: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Create a dataset record in InstantDB.

    Parameters
    ----------
    dataset_id : str
        Unique dataset identifier
    owner_id : str
        User ID who owns the dataset
    name : str
        Dataset name
    gcs_bucket : str
        GCS bucket name
    gcs_object : str
        GCS object path
    row_count : int
        Number of rows in the dataset
    columns : list
        List of column names
    notes : str, optional
        Optional notes

    Returns
    -------
    dict
        Created dataset record
    """
    client = get_instantdb_client()
    
    data = {
        "id": dataset_id,
        "ownerId": owner_id,
        "name": name,
        "gcsBucket": gcs_bucket,
        "gcsObject": gcs_object,
        "rowCount": row_count,
        "columns": columns,
        "createdAt": int(__import__("time").time() * 1000),  # milliseconds
    }
    
    if notes:
        data["notes"] = notes
    
    # Note: This is a simplified version. In production, you'd use InstantDB's
    # GraphQL API or REST API to insert records. Adjust based on InstantDB's actual API.
    response = client.post(f"/apps/{INSTANTDB_APP_ID}/data/datasets", json=data)

    # Debug if non-2xx or non-JSON
    if response.status_code >= 400:
        raise RuntimeError(f"InstantDB error {response.status_code}: {response.text[:300]}")

    try:
        return response.json()
    except Exception:
        raise RuntimeError(f"InstantDB returned non-JSON: {response.text[:300]}")



def create_prediction(
    prediction_id: str,
    owner_id: str,
    dataset_id: str,
    model_name: str,
    metrics: Optional[Dict[str, float]] = None,
    horizon: Optional[int] = None,
    output_gcs_object: Optional[str] = None,
    preview_rows: Optional[list] = None,
) -> Dict[str, Any]:
    """
    Create a prediction record in InstantDB.

    Parameters
    ----------
    prediction_id : str
        Unique prediction identifier
    owner_id : str
        User ID who owns the prediction
    dataset_id : str
        Dataset ID used for prediction
    model_name : str
        Name of the model used
    metrics : dict, optional
        Prediction metrics
    horizon : int, optional
        Forecast horizon
    output_gcs_object : str, optional
        GCS path to output CSV
    preview_rows : list, optional
        Preview of prediction results

    Returns
    -------
    dict
        Created prediction record
    """
    client = get_instantdb_client()
    
    data = {
        "id": prediction_id,
        "ownerId": owner_id,
        "datasetId": dataset_id,
        "modelName": model_name,
        "createdAt": int(__import__("time").time() * 1000),
    }
    
    if metrics:
        data["metrics"] = metrics
    if horizon:
        data["horizon"] = horizon
    if output_gcs_object:
        data["outputGcsObject"] = output_gcs_object
    if preview_rows:
        data["previewRows"] = preview_rows
    
    response = client.post(
        f"/apps/{INSTANTDB_APP_ID}/data/predictions",
        json=data,
    )
    response.raise_for_status()
    return response.json()






















