"""
SHAP explainability functions.
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, List, Optional

try:
    import shap
    SHAP_AVAILABLE = True
except ImportError:
    SHAP_AVAILABLE = False


def compute_shap_values(
    model: Any,
    X_train: pd.DataFrame,
    X_explain: pd.DataFrame,
    model_type: str = "regressor",
) -> Dict[str, Any]:
    """
    Compute SHAP values for model explanations.

    Parameters
    ----------
    model : sklearn estimator
        Trained model (pipeline) to explain
    X_train : pd.DataFrame
        Training data used to compute SHAP baseline
    X_explain : pd.DataFrame
        Data points to explain
    model_type : str
        Either "regressor" or "classifier"

    Returns
    -------
    dict
        Contains SHAP values, feature names, and summary statistics
    """
    if not SHAP_AVAILABLE:
        raise ImportError("SHAP library is not installed. Install with: pip install shap")

    # Extract the actual model from the pipeline
    actual_model = model.named_steps["model"]
    preprocessor = model.named_steps["preprocessor"]

    # Transform the data
    X_train_transformed = preprocessor.transform(X_train)
    X_explain_transformed = preprocessor.transform(X_explain)

    # Get feature names after preprocessing
    feature_names = X_train.columns.tolist()
    # For one-hot encoded features, we'll use simplified names
    if hasattr(preprocessor, "transformers_"):
        # Try to get feature names from preprocessor
        try:
            feature_names_out = preprocessor.get_feature_names_out(feature_names)
            feature_names = list(feature_names_out)
        except AttributeError:
            # Fallback: use numeric indices
            feature_names = [f"Feature_{i}" for i in range(X_train_transformed.shape[1])]

    # Create SHAP explainer
    if model_type == "regressor":
        # For tree models, use TreeExplainer
        if hasattr(actual_model, "tree_") or hasattr(actual_model, "estimators_"):
            explainer = shap.TreeExplainer(actual_model)
            shap_values = explainer.shap_values(X_explain_transformed)
        else:
            # For other models, use KernelExplainer (slower but more general)
            explainer = shap.KernelExplainer(actual_model.predict, X_train_transformed[:100])
            shap_values = explainer.shap_values(X_explain_transformed[:10])
    else:  # classifier
        if hasattr(actual_model, "tree_") or hasattr(actual_model, "estimators_"):
            explainer = shap.TreeExplainer(actual_model)
            shap_values = explainer.shap_values(X_explain_transformed)
            # For binary classification, get SHAP values for positive class
            if isinstance(shap_values, list) and len(shap_values) == 2:
                shap_values = shap_values[1]
        else:
            explainer = shap.KernelExplainer(actual_model.predict_proba, X_train_transformed[:100])
            shap_values = explainer.shap_values(X_explain_transformed[:10])
            if isinstance(shap_values, list) and len(shap_values) == 2:
                shap_values = shap_values[1]

    # Compute mean absolute SHAP values for feature importance
    if len(shap_values.shape) > 1:
        mean_shap_values = np.abs(shap_values).mean(axis=0)
    else:
        mean_shap_values = np.abs(shap_values)

    # Convert to lists for JSON serialization
    feature_importance = {
        name: float(val) for name, val in zip(feature_names, mean_shap_values)
    }

    # For individual predictions, return SHAP values for first sample
    if len(shap_values.shape) > 1:
        individual_shap = {
            name: float(val) for name, val in zip(feature_names, shap_values[0])
        }
    else:
        individual_shap = {name: float(val) for name, val in zip(feature_names, shap_values)}

    return {
        "feature_importance": feature_importance,
        "individual_shap": individual_shap,
        "shap_values_array": shap_values.tolist() if isinstance(shap_values, np.ndarray) else shap_values,
    }


def get_global_feature_importance(
    price_model: Any,
    sale_model: Any,
    X_train: pd.DataFrame,
) -> Dict[str, Any]:
    """
    Get global feature importance using SHAP for both price and sale models.

    Parameters
    ----------
    price_model : sklearn estimator
        Trained price regression pipeline
    sale_model : sklearn estimator
        Trained sale classification pipeline
    X_train : pd.DataFrame
        Training data

    Returns
    -------
    dict
        Feature importance for both models
    """
    if not SHAP_AVAILABLE:
        raise ImportError("SHAP library is not installed. Install with: pip install shap")

    price_shap = compute_shap_values(price_model, X_train, X_train.head(50), "regressor")
    sale_shap = compute_shap_values(sale_model, X_train, X_train.head(50), "classifier")

    return {
        "price_importance": price_shap["feature_importance"],
        "sale_importance": sale_shap["feature_importance"],
    }

