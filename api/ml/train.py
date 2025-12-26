"""
ML training module extracted from Streamlit app.
"""

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder
from sklearn.pipeline import Pipeline
from sklearn.ensemble import (
    GradientBoostingRegressor,
    GradientBoostingClassifier,
    RandomForestRegressor,
    RandomForestClassifier,
    ExtraTreesRegressor,
    ExtraTreesClassifier,
)
from sklearn.metrics import r2_score, mean_absolute_error, accuracy_score
from typing import Dict, Tuple, Any


def train_models(
    df: pd.DataFrame,
    model_name: str = "Gradient Boosting",
) -> Dict[str, Any]:
    """
    Train a price regression model and a sale probability classifier.

    Parameters
    ----------
    df : pandas.DataFrame
        The auction data containing predictor features and targets.
    model_name : str, optional
        The model family to use. One of "Gradient Boosting",
        "Random Forest" or "Extra Trees". Defaults to "Gradient Boosting".

    Returns
    -------
    dict
        A dictionary containing the trained models and evaluation metrics.
    """
    feature_cols = ["carat", "color", "clarity", "viewings", "price_index"]
    X = df[feature_cols]
    y_price = df["final_price"]
    y_sale = df["sold"]

    # Define column groups
    numeric_features = ["carat", "viewings", "price_index"]
    categorical_features = ["color", "clarity"]

    # Preprocess categorical variables with one-hot encoding
    preprocessor = ColumnTransformer(
        transformers=[
            ("cat", OneHotEncoder(handle_unknown="ignore"), categorical_features),
            ("num", "passthrough", numeric_features),
        ]
    )

    # Select model classes based on user choice
    if model_name == "Random Forest":
        price_reg = RandomForestRegressor(n_estimators=300, random_state=42)
        sale_clf = RandomForestClassifier(n_estimators=300, random_state=42)
    elif model_name == "Extra Trees":
        price_reg = ExtraTreesRegressor(n_estimators=300, random_state=42)
        sale_clf = ExtraTreesClassifier(n_estimators=300, random_state=42)
    else:
        # Default to Gradient Boosting
        price_reg = GradientBoostingRegressor(random_state=42)
        sale_clf = GradientBoostingClassifier(random_state=42)

    # Build pipelines
    price_pipeline = Pipeline(
        steps=[("preprocessor", preprocessor), ("model", price_reg)]
    )
    sale_pipeline = Pipeline(
        steps=[("preprocessor", preprocessor), ("model", sale_clf)]
    )

    # Split data
    X_train, X_test, y_price_train, y_price_test, y_sale_train, y_sale_test = train_test_split(
        X, y_price, y_sale, test_size=0.2, random_state=42
    )

    # Fit models
    price_pipeline.fit(X_train, y_price_train)
    sale_pipeline.fit(X_train, y_sale_train)

    # Predict on test sets
    price_pred = price_pipeline.predict(X_test)
    sale_pred = sale_pipeline.predict(X_test)
    sale_proba = sale_pipeline.predict_proba(X_test)[:, 1]

    # Compute metrics
    r2 = r2_score(y_price_test, price_pred)
    mae = mean_absolute_error(y_price_test, price_pred)
    acc = accuracy_score(y_sale_test, sale_pred)

    metrics = {
        "price_r2": float(r2),
        "price_mae": float(mae),
        "sale_accuracy": float(acc),
    }
    models = {
        "price_model": price_pipeline,
        "sale_model": sale_pipeline,
    }
    return {"models": models, "metrics": metrics}


def predict_and_recommend(
    price_model: Any,
    sale_model: Any,
    input_df: pd.DataFrame,
) -> Dict[str, float]:
    """
    Predict price and sale probability for a new lot and suggest a reserve price.

    Parameters
    ----------
    price_model : sklearn estimator
        Trained regression pipeline.
    sale_model : sklearn estimator
        Trained classification pipeline.
    input_df : pandas.DataFrame
        Single-row DataFrame with the same structure as the training
        features (columns: carat, color, clarity, viewings, price_index).

    Returns
    -------
    dict
        Contains predicted price, predicted sale probability and the
        recommended reserve price.
    """
    pred_price = float(price_model.predict(input_df)[0])
    pred_sale_proba = float(sale_model.predict_proba(input_df)[0][1])
    # Heuristic: at least 80% of predicted price, adjusted for probability
    recommended_reserve = pred_price * (0.8 + 0.2 * pred_sale_proba)
    return {
        "pred_price": pred_price,
        "pred_sale_proba": pred_sale_proba,
        "recommended_reserve": recommended_reserve,
    }










