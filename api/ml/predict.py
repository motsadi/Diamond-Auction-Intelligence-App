"""
ML prediction module for batch predictions.
"""

import pandas as pd
from typing import Dict, Any, List
from .train import predict_and_recommend


def batch_predict(
    df: pd.DataFrame,
    price_model: Any,
    sale_model: Any,
) -> pd.DataFrame:
    """
    Generate batch predictions for an entire dataset.

    Parameters
    ----------
    df : pandas.DataFrame
        Dataset with feature columns: carat, color, clarity, viewings, price_index
    price_model : sklearn estimator
        Trained regression pipeline
    sale_model : sklearn estimator
        Trained classification pipeline

    Returns
    -------
    pandas.DataFrame
        Original dataframe with added columns:
        - predicted_price
        - predicted_sale_proba
        - recommended_reserve
    """
    feature_cols = ["carat", "color", "clarity", "viewings", "price_index"]
    df_pred = df.copy()

    # Generate predictions
    df_pred["predicted_price"] = price_model.predict(df_pred[feature_cols])
    df_pred["predicted_sale_proba"] = sale_model.predict_proba(df_pred[feature_cols])[:, 1]
    df_pred["recommended_reserve"] = df_pred["predicted_price"] * (
        0.8 + 0.2 * df_pred["predicted_sale_proba"]
    )

    return df_pred


def get_preview_rows(df_pred: pd.DataFrame, n_rows: int = 10) -> List[Dict[str, Any]]:
    """
    Convert prediction dataframe to JSON-serializable preview rows.

    Parameters
    ----------
    df_pred : pandas.DataFrame
        DataFrame with predictions
    n_rows : int
        Number of rows to include in preview

    Returns
    -------
    List[Dict]
        List of dictionaries representing rows
    """
    preview = df_pred.head(n_rows)
    return preview.to_dict(orient="records")










