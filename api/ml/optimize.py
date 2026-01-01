"""
Optimization and surface computation functions.
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, Tuple, Optional


def random_search_optimize(
    df: pd.DataFrame,
    price_model: Any,
    sale_model: Any,
    objective: str = "max_price",
    n_samples: int = 1000,
    min_prob: float = 0.0,
    target_price: Optional[float] = None,
    target_prob: Optional[float] = None,
    fixed_color: Optional[str] = None,
    fixed_clarity: Optional[str] = None,
) -> Dict[str, Any]:
    """Perform a random search to identify operating conditions that optimise the objective.

    This helper samples random combinations of the continuous and categorical
    features within their observed ranges. It supports three objectives:
    maximising predicted final price, maximising sale probability, or
    matching a target price and sale probability (minimising squared error).

    Parameters
    ----------
    df : pandas.DataFrame
        The data frame used to determine sampling ranges and available
        categories for colour and clarity.
    price_model : sklearn estimator
        A trained regression pipeline used to predict final prices.
    sale_model : sklearn estimator
        A trained classification pipeline used to estimate sale probability.
    objective : str, optional
        Objective function to optimise. One of ``"max_price"``,
        ``"max_prob"`` or ``"target"``. Defaults to ``"max_price"``.
    n_samples : int, optional
        Number of random samples to draw. More samples improve the
        likelihood of finding a good solution at the expense of compute.
        Defaults to 1000.
    min_prob : float, optional
        Minimum sale probability required when optimising for price. If
        ``objective`` is ``"max_price"``, sampled points with predicted
        sale probability below this threshold are ignored. Defaults to 0.0.
    target_price : float, optional
        Target final price used when ``objective == "target"``.
    target_prob : float, optional
        Target sale probability used when ``objective == "target"``.
    fixed_color : str, optional
        If provided, restrict search to this colour grade. Otherwise
        sample from all unique colours in the dataset.
    fixed_clarity : str, optional
        If provided, restrict search to this clarity grade. Otherwise
        sample from all unique clarity grades in the dataset.

    Returns
    -------
    dict
        A dictionary containing the best sample's feature values and its
        associated predictions and objective score.
    """
    colors = [fixed_color] if fixed_color else sorted(df["color"].unique())
    clarities = [fixed_clarity] if fixed_clarity else sorted(df["clarity"].unique())
    rng = np.random.default_rng(seed=42)
    best = None
    best_score = -np.inf
    # Determine ranges for continuous variables
    ranges = {
        "carat": (df["carat"].min(), df["carat"].max()),
        "viewings": (df["viewings"].min(), df["viewings"].max()),
        "price_index": (df["price_index"].min(), df["price_index"].max()),
    }
    for _ in range(n_samples):
        carat = rng.uniform(*ranges["carat"])
        viewings = rng.integers(ranges["viewings"][0], ranges["viewings"][1] + 1)
        price_index = rng.uniform(*ranges["price_index"])
        color = rng.choice(colors)
        clarity = rng.choice(clarities)
        sample_df = pd.DataFrame(
            {
                "carat": [carat],
                "color": [color],
                "clarity": [clarity],
                "viewings": [viewings],
                "price_index": [price_index],
            }
        )
        pred_price = float(price_model.predict(sample_df)[0])
        pred_prob = float(sale_model.predict_proba(sample_df)[0][1])
        if objective == "max_price":
            # Only consider samples meeting minimum probability
            if pred_prob < min_prob:
                continue
            score = pred_price
        elif objective == "max_prob":
            score = pred_prob
        else:  # target objective minimises squared error
            if target_price is None or target_prob is None:
                continue
            score = -((pred_price - target_price) ** 2 + (pred_prob - target_prob) ** 2)
        if score > best_score:
            best_score = score
            best = {
                "carat": float(carat),
                "viewings": int(viewings),
                "price_index": float(price_index),
                "color": str(color),
                "clarity": str(clarity),
                "pred_price": float(pred_price),
                "pred_prob": float(pred_prob),
                "objective_score": float(score),
            }
    return best if best is not None else {}


def compute_surface(
    df: pd.DataFrame,
    price_model: Any,
    sale_model: Any,
    var_x: str,
    var_y: str,
    metric: str = "Final Price",
    n_points: int = 25,
    fixed_color: Optional[str] = None,
    fixed_clarity: Optional[str] = None,
) -> Tuple[np.ndarray, np.ndarray, np.ndarray]:
    """Compute a 3D response surface for two variables.

    All features not explicitly varied are fixed at their mean values (for
    continuous variables) or at the specified fixed colour/clarity. The
    resulting surface can represent predicted final price, sale probability or
    expected revenue (price × probability).

    Parameters
    ----------
    df : pandas.DataFrame
        Data frame used to derive mean values and available category options.
    price_model, sale_model : sklearn estimator
        Trained models for predicting final price and sale probability.
    var_x : str
        Feature to vary along the X‑axis.
    var_y : str
        Feature to vary along the Y‑axis.
    metric : str, optional
        Which response to compute. ``"Final Price"``, ``"Sale Probability"``
        or ``"Expected Revenue"``. Defaults to ``"Final Price"``.
    n_points : int, optional
        Number of grid points per axis. Defaults to 25.
    fixed_color : str, optional
        Colour grade to fix across the grid. If not provided, the mode of
        ``df["color"]`` is used.
    fixed_clarity : str, optional
        Clarity grade to fix across the grid. If not provided, the mode of
        ``df["clarity"]`` is used.

    Returns
    -------
    tuple
        Arrays X_grid, Y_grid and Z_values suitable for plotting with Plotly.
    """
    # Determine base values
    base_vals = {
        "carat": float(df["carat"].mean()),
        "viewings": float(df["viewings"].mean()),
        "price_index": float(df["price_index"].mean()),
    }
    color_val = fixed_color if fixed_color else str(df["color"].mode()[0])
    clarity_val = fixed_clarity if fixed_clarity else str(df["clarity"].mode()[0])
    # Generate grid values
    range_x = (
        (float(df[var_x].min()), float(df[var_x].max()))
        if var_x in base_vals
        else (0.0, 1.0)
    )
    range_y = (
        (float(df[var_y].min()), float(df[var_y].max()))
        if var_y in base_vals
        else (0.0, 1.0)
    )
    xs = np.linspace(range_x[0], range_x[1], n_points)
    ys = np.linspace(range_y[0], range_y[1], n_points)
    X_grid, Y_grid = np.meshgrid(xs, ys)
    Z = np.zeros_like(X_grid)
    for i in range(n_points):
        for j in range(n_points):
            sample = base_vals.copy()
            sample[var_x] = float(X_grid[i, j])
            sample[var_y] = float(Y_grid[i, j])
            row_df = pd.DataFrame(
                {
                    "carat": [sample.get("carat", base_vals["carat"])],
                    "viewings": [int(round(sample.get("viewings", base_vals["viewings"])))],
                    "price_index": [sample.get("price_index", base_vals["price_index"])],
                    "color": [color_val],
                    "clarity": [clarity_val],
                }
            )
            pred_price = float(price_model.predict(row_df)[0])
            pred_prob = float(sale_model.predict_proba(row_df)[0][1])
            if metric == "Final Price":
                z_val = pred_price
            elif metric == "Sale Probability":
                z_val = pred_prob
            else:  # Expected Revenue
                z_val = pred_price * pred_prob
            Z[i, j] = float(z_val)
    return X_grid, Y_grid, Z

