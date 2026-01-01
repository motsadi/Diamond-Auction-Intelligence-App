"""
Google Cloud Storage utilities.
"""

import os
from datetime import timedelta
from google.cloud import storage
from typing import Tuple
import google.auth
from google.auth import impersonated_credentials

from google.cloud import storage





def get_storage_client():
    """Get GCS client."""
    return storage.Client()


def generate_signed_upload_url(bucket_name: str, object_name: str, content_type: str = "text/csv") -> str:
    signing_sa = os.getenv("SIGNING_SA_EMAIL")
    if not signing_sa:
        raise RuntimeError("SIGNING_SA_EMAIL env var not set")

    # token-based creds on Cloud Run
    source_credentials, _ = google.auth.default()

    # impersonate a service account to get sign-capable creds
    signing_credentials = impersonated_credentials.Credentials(
        source_credentials=source_credentials,
        target_principal=signing_sa,
        target_scopes=["https://www.googleapis.com/auth/devstorage.read_write"],
        lifetime=900,
    )

    client = storage.Client(credentials=signing_credentials)
    blob = client.bucket(bucket_name).blob(object_name)

    return blob.generate_signed_url(
        version="v4",
        expiration=timedelta(minutes=15),
        method="PUT",
        content_type=content_type,
    )

def generate_signed_download_url(
    bucket_name: str,
    object_name: str,
    expiration_minutes: int = 60,
) -> str:
    """
    Generate a signed URL for downloading a file from GCS.

    Parameters
    ----------
    bucket_name : str
        Name of the GCS bucket
    object_name : str
        Object path within the bucket
    expiration_minutes : int
        Minutes until the URL expires

    Returns
    -------
    str
        Signed URL for GET request
    """
    client = get_storage_client()
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(object_name)

    url = blob.generate_signed_url(
        version="v4",
        method="GET",
        expiration=timedelta(minutes=expiration_minutes),
    )
    return url


def read_csv_from_gcs(bucket_name: str, object_name: str) -> bytes:
    """
    Read a CSV file from GCS.

    Parameters
    ----------
    bucket_name : str
        Name of the GCS bucket
    object_name : str
        Object path within the bucket

    Returns
    -------
    bytes
        File contents
    """
    client = get_storage_client()
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(object_name)
    return blob.download_as_bytes()


def write_csv_to_gcs(
    bucket_name: str,
    object_name: str,
    content: bytes,
    content_type: str = "text/csv",
) -> None:
    """
    Write a CSV file to GCS.

    Parameters
    ----------
    bucket_name : str
        Name of the GCS bucket
    object_name : str
        Object path within the bucket
    content : bytes
        File contents
    content_type : str
        Content type of the file
    """
    client = get_storage_client()
    bucket = client.bucket(bucket_name)
    blob = bucket.blob(object_name)
    blob.upload_from_string(content, content_type=content_type)























