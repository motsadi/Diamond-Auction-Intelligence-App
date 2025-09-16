"""
Streamlit application for the Diamond Auction Intelligence demo.

This application illustrates how machine learning can be
applied to rough‑diamond auction data to predict final sale prices,
estimate the probability a lot will sell and suggest an appropriate
reserve price.  Because no confidential auction data are used,
the app relies on a synthetic dataset generated for demonstration
purposes.  It is intended as a proof‑of‑concept companion to
the MASA proposal for the Diamond Auction Intelligence project.
"""

import os
import streamlit as st
import pandas as pd
import numpy as np
import altair as alt
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
import plotly.graph_objects as go


@st.cache_data
def load_data() -> pd.DataFrame:
    """Load the synthetic auction dataset from the local CSV file.

    The data are generated offline and stored under the ``diamond_auction_app``
    directory.  When deployed, Streamlit caches the result to avoid
    reloading the file on every interaction.

    Returns
    -------
    pandas.DataFrame
        The synthetic auction data with columns: lot_id, carat, color,
        clarity, viewings, price_index, reserve_price, final_price, sold.
    """
    csv_path = os.path.join(os.path.dirname(__file__), "synthetic_auction_data.csv")
    df = pd.read_csv(csv_path)
    return df


def train_models(df: pd.DataFrame, model_name: str = "Gradient Boosting"):
    """Train a price regression model and a sale probability classifier.

    Depending on the ``model_name`` argument, this function trains one of
    several algorithms from scikit‑learn (Gradient Boosting, Random Forest,
    or Extra Trees). Categorical variables are one‑hot encoded and numeric
    variables are passed through unchanged via a ``ColumnTransformer``. The
    dataset is split into train and test sets to provide an unbiased
    evaluation of model performance.

    Parameters
    ----------
    df : pandas.DataFrame
        The auction data containing predictor features and targets.
    model_name : str, optional
        The model family to use. One of ``"Gradient Boosting"``,
        ``"Random Forest"`` or ``"Extra Trees"``. Defaults to
        ``"Gradient Boosting"``.

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

    # Preprocess categorical variables with one‑hot encoding
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
    # Note: we keep sale_proba for possible extension even though not used here
    sale_proba = sale_pipeline.predict_proba(X_test)[:, 1]

    # Compute metrics
    r2 = r2_score(y_price_test, price_pred)
    mae = mean_absolute_error(y_price_test, price_pred)
    acc = accuracy_score(y_sale_test, sale_pred)

    metrics = {
        "price_r2": r2,
        "price_mae": mae,
        "sale_accuracy": acc,
    }
    models = {
        "price_model": price_pipeline,
        "sale_model": sale_pipeline,
    }
    return {"models": models, "metrics": metrics}


def predict_and_recommend(price_model, sale_model, input_df: pd.DataFrame):
    """Predict price and sale probability for a new lot and suggest a reserve price.

    A simple heuristic is used to set the recommended reserve price: it is
    calculated as ``predicted_price * (0.8 + 0.2 * sale_probability)``.
    This ensures that the suggested reserve is never below 80 % of the
    predicted final price while still adjusting upward for lots with
    higher predicted sale probability.

    Parameters
    ----------
    price_model : sklearn estimator
        Trained regression pipeline.
    sale_model : sklearn estimator
        Trained classification pipeline.
    input_df : pandas.DataFrame
        Single‑row DataFrame with the same structure as the training
        features (columns: carat, color, clarity, viewings, price_index).

    Returns
    -------
    dict
        Contains predicted price, predicted sale probability and the
        recommended reserve price.
    """
    pred_price = float(price_model.predict(input_df)[0])
    pred_sale_proba = float(sale_model.predict_proba(input_df)[0][1])
    # Heuristic: at least 80 % of predicted price, adjusted for probability
    recommended_reserve = pred_price * (0.8 + 0.2 * pred_sale_proba)
    return {
        "pred_price": pred_price,
        "pred_sale_proba": pred_sale_proba,
        "recommended_reserve": recommended_reserve,
    }


def random_search_optimize(
    df: pd.DataFrame,
    price_model,
    sale_model,
    objective: str = "max_price",
    n_samples: int = 1000,
    min_prob: float = 0.0,
    target_price: float | None = None,
    target_prob: float | None = None,
    fixed_color: str | None = None,
    fixed_clarity: str | None = None,
) -> dict:
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
                "carat": carat,
                "viewings": viewings,
                "price_index": price_index,
                "color": color,
                "clarity": clarity,
                "pred_price": pred_price,
                "pred_prob": pred_prob,
                "objective_score": score,
            }
    return best if best is not None else {}


def compute_surface(
    df: pd.DataFrame,
    price_model,
    sale_model,
    var_x: str,
    var_y: str,
    metric: str = "Final Price",
    n_points: int = 25,
    fixed_color: str | None = None,
    fixed_clarity: str | None = None,
) -> tuple:
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
        "carat": df["carat"].mean(),
        "viewings": df["viewings"].mean(),
        "price_index": df["price_index"].mean(),
    }
    color_val = fixed_color if fixed_color else df["color"].mode()[0]
    clarity_val = fixed_clarity if fixed_clarity else df["clarity"].mode()[0]
    # Generate grid values
    range_x = (
        df[var_x].min(), df[var_x].max()
    ) if var_x in base_vals else (0, 1)
    range_y = (
        df[var_y].min(), df[var_y].max()
    ) if var_y in base_vals else (0, 1)
    xs = np.linspace(range_x[0], range_x[1], n_points)
    ys = np.linspace(range_y[0], range_y[1], n_points)
    X_grid, Y_grid = np.meshgrid(xs, ys)
    Z = np.zeros_like(X_grid)
    for i in range(n_points):
        for j in range(n_points):
            sample = base_vals.copy()
            sample[var_x] = X_grid[i, j]
            sample[var_y] = Y_grid[i, j]
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
            Z[i, j] = z_val
    return X_grid, Y_grid, Z


def main():
    st.set_page_config(page_title="Diamond Auction Intelligence Demo", layout="wide")
    st.title("Diamond Auction Intelligence Demo")
    st.markdown(
        """
        This demo illustrates how artificial intelligence can be applied to rough‑diamond auction
        data to predict the final price of a lot, estimate the probability that it will
        sell, and suggest an appropriate reserve price.  The dataset used here is synthetic
        and intended solely for demonstration.  For more details about the underlying
        project and its importance to Botswana's diamond industry, see the accompanying
        MASA proposal.
        """
    )

    # Load data
    df = load_data()

    # Data overview
    st.header("Data Overview")
    with st.expander("Show raw data"):
        st.dataframe(df)
    st.write("Summary statistics")
    st.dataframe(df.describe())

    # Distribution charts
    st.header("Exploratory Analysis")
    col1, col2 = st.columns(2)
    with col1:
        st.subheader("Distribution of Final Prices")
        price_hist = (
            alt.Chart(df)
            .mark_bar()
            .encode(
                x=alt.X("final_price", bin=alt.Bin(maxbins=30), title="Final Price"),
                y=alt.Y("count()", title="Count"),
            )
            .interactive()
        )
        st.altair_chart(price_hist, use_container_width=True)
    with col2:
        st.subheader("Carat Weight vs Final Price")
        scatter = (
            alt.Chart(df)
            .mark_circle(size=60, opacity=0.6)
            .encode(
                x=alt.X("carat", title="Carat Weight"),
                y=alt.Y("final_price", title="Final Price"),
                color="sold:N",
                tooltip=["carat", "color", "clarity", "viewings", "final_price", "sold"],
            )
            .interactive()
        )
        st.altair_chart(scatter, use_container_width=True)

    # Model training section
    st.header("Model Training")
    # Select model type
    model_options = ["Gradient Boosting", "Random Forest", "Extra Trees"]
    model_choice = st.selectbox(
        "Choose a model family", model_options, index=model_options.index("Gradient Boosting")
    )
    if "models" not in st.session_state or st.session_state.get("model_choice") != model_choice:
        st.info(
            "Click the button below to train the price and sale models. Training may take a few seconds."
        )
        if st.button("Train models"):
            with st.spinner("Training models..."):
                result = train_models(df, model_name=model_choice)
            st.session_state["models"] = result["models"]
            st.session_state["metrics"] = result["metrics"]
            st.session_state["model_choice"] = model_choice
            st.success("Models trained successfully!")

    # Display metrics if models are available
    if "metrics" in st.session_state:
        metrics = st.session_state["metrics"]
        st.subheader("Evaluation Metrics on Test Set")
        st.markdown(
            f"**Price model R²:** {metrics['price_r2']:.3f}\n\n"
            f"**Price model MAE:** {metrics['price_mae']:.2f}\n\n"
            f"**Sale model accuracy:** {metrics['sale_accuracy']:.3f}"
        )

    # Prediction input
    st.header("Predict and Recommend")
    if "models" in st.session_state:
        price_model = st.session_state["models"]["price_model"]
        sale_model = st.session_state["models"]["sale_model"]

        with st.form("prediction_form"):
            st.markdown("Enter details about a new diamond lot:")
            carat_input = st.number_input(
                "Carat weight", min_value=0.1, max_value=10.0, value=1.0, step=0.01
            )
            color_input = st.selectbox("Colour grade", sorted(df["color"].unique()))
            clarity_input = st.selectbox(
                "Clarity grade", sorted(df["clarity"].unique())
            )
            viewings_input = st.number_input(
                "Number of viewings", min_value=0, max_value=50, value=10, step=1
            )
            price_index_input = st.number_input(
                "Price index", min_value=0.5, max_value=2.0, value=1.0, step=0.01
            )
            submitted = st.form_submit_button("Predict")

        if submitted:
            input_df = pd.DataFrame(
                {
                    "carat": [carat_input],
                    "color": [color_input],
                    "clarity": [clarity_input],
                    "viewings": [viewings_input],
                    "price_index": [price_index_input],
                }
            )
            results = predict_and_recommend(price_model, sale_model, input_df)
            st.markdown(
                f"**Predicted final price:** {results['pred_price']:.2f}\n"
                f"**Predicted sale probability:** {results['pred_sale_proba']:.3f}\n"
                f"**Recommended reserve price:** {results['recommended_reserve']:.2f}"
            )
    else:
        st.warning("Train the models first before making predictions.")

    # Batch predictions for entire dataset
    st.header("Batch Predictions and Recommendations")
    if "models" in st.session_state:
        price_model = st.session_state["models"]["price_model"]
        sale_model = st.session_state["models"]["sale_model"]
        # Compute predictions on full dataset
        df_pred = df.copy()
        df_pred["predicted_price"] = price_model.predict(
            df_pred[["carat", "color", "clarity", "viewings", "price_index"]]
        )
        df_pred["predicted_sale_proba"] = sale_model.predict_proba(
            df_pred[["carat", "color", "clarity", "viewings", "price_index"]]
        )[:, 1]
        df_pred["recommended_reserve"] = df_pred["predicted_price"] * (
            0.8 + 0.2 * df_pred["predicted_sale_proba"]
        )
        st.dataframe(df_pred.head(20))
        # Provide download button
        csv_data = df_pred.to_csv(index=False).encode("utf-8")
        st.download_button(
            "Download full predictions (CSV)",
            csv_data,
            "auction_predictions.csv",
            "text/csv",
        )
    else:
        st.info("Train the models to generate batch predictions.")

    # Inverse design and solution surfaces section
    st.header("Optimisation & Solution Surfaces")
    if "models" in st.session_state:
        price_model = st.session_state["models"]["price_model"]
        sale_model = st.session_state["models"]["sale_model"]
        st.write(
            "Work backwards from a desired outcome or explore how two features influence price, sale probability or expected revenue."
        )
        # Select fixed colour and clarity
        st.subheader("Fixed Categorical Settings")
        fixed_color = st.selectbox("Select colour grade", sorted(df["color"].unique()))
        fixed_clarity = st.selectbox("Select clarity grade", sorted(df["clarity"].unique()))
        st.markdown("---")

        # Optimisation / goal seeking
        st.subheader("Goal Seeking / Optimisation")
        opt_objective = st.selectbox(
            "Optimisation objective",
            [
                "Maximise Final Price",
                "Maximise Sale Probability",
                "Match Target Price & Sale Probability",
            ],
        )
        if opt_objective == "Maximise Final Price":
            min_prob = st.slider(
                "Minimum acceptable sale probability",
                min_value=0.0,
                max_value=1.0,
                value=0.5,
                step=0.05,
            )
            samples = st.number_input(
                "Number of random samples",
                min_value=100,
                max_value=5000,
                value=1000,
                step=100,
            )
            if st.button("Run optimisation"):
                with st.spinner("Searching for optimal conditions..."):
                    result = random_search_optimize(
                        df,
                        price_model,
                        sale_model,
                        objective="max_price",
                        n_samples=int(samples),
                        min_prob=min_prob,
                        fixed_color=fixed_color,
                        fixed_clarity=fixed_clarity,
                    )
                if result:
                    st.success("Best conditions found!")
                    display_df = pd.DataFrame(
                        {
                            "Variable": ["Carat", "Viewings", "Price Index", "Colour", "Clarity"],
                            "Value": [
                                result["carat"],
                                result["viewings"],
                                result["price_index"],
                                result["color"],
                                result["clarity"],
                            ],
                        }
                    )
                    st.table(display_df)
                    st.markdown(
                        f"**Predicted final price:** {result['pred_price']:.2f}\n"
                        f"**Predicted sale probability:** {result['pred_prob']:.3f}"
                    )
                else:
                    st.warning(
                        "No feasible solution found that meets the minimum sale probability."
                    )
        elif opt_objective == "Maximise Sale Probability":
            samples = st.number_input(
                "Number of random samples", min_value=100, max_value=5000, value=1000, step=100
            )
            if st.button("Run optimisation"):
                with st.spinner("Searching for optimal conditions..."):
                    result = random_search_optimize(
                        df,
                        price_model,
                        sale_model,
                        objective="max_prob",
                        n_samples=int(samples),
                        fixed_color=fixed_color,
                        fixed_clarity=fixed_clarity,
                    )
                if result:
                    st.success("Best conditions found!")
                    display_df = pd.DataFrame(
                        {
                            "Variable": ["Carat", "Viewings", "Price Index", "Colour", "Clarity"],
                            "Value": [
                                result["carat"],
                                result["viewings"],
                                result["price_index"],
                                result["color"],
                                result["clarity"],
                            ],
                        }
                    )
                    st.table(display_df)
                    st.markdown(
                        f"**Predicted final price:** {result['pred_price']:.2f}\n"
                        f"**Predicted sale probability:** {result['pred_prob']:.3f}"
                    )
                else:
                    st.warning("No feasible solution found.")
        else:
            target_price = st.number_input(
                "Target final price", min_value=0.0, max_value=float(df["final_price"].max()), value=float(df["final_price"].mean())
            )
            target_prob = st.number_input(
                "Target sale probability", min_value=0.0, max_value=1.0, value=0.8, step=0.05
            )
            samples = st.number_input(
                "Number of random samples", min_value=100, max_value=5000, value=2000, step=100
            )
            if st.button("Run inverse design"):
                with st.spinner("Searching for conditions that meet targets..."):
                    result = random_search_optimize(
                        df,
                        price_model,
                        sale_model,
                        objective="target",
                        n_samples=int(samples),
                        target_price=target_price,
                        target_prob=target_prob,
                        fixed_color=fixed_color,
                        fixed_clarity=fixed_clarity,
                    )
                if result:
                    st.success("Best conditions found!")
                    display_df = pd.DataFrame(
                        {
                            "Variable": ["Carat", "Viewings", "Price Index", "Colour", "Clarity"],
                            "Value": [
                                result["carat"],
                                result["viewings"],
                                result["price_index"],
                                result["color"],
                                result["clarity"],
                            ],
                        }
                    )
                    st.table(display_df)
                    st.markdown(
                        f"**Predicted final price:** {result['pred_price']:.2f}\n"
                        f"**Predicted sale probability:** {result['pred_prob']:.3f}"
                    )
                else:
                    st.warning("No suitable solution found.")

        st.markdown("---")
        # 3D surfaces
        st.subheader("3D Solution Surfaces")
        st.write(
            "Select two variables to explore how the response changes across their range. You can choose to view the predicted final price, sale probability or expected revenue (price × probability)."
        )
        continuous_vars = ["carat", "viewings", "price_index"]
        x_var = st.selectbox("X‑axis variable", continuous_vars, index=0)
        y_var = st.selectbox("Y‑axis variable", [v for v in continuous_vars if v != x_var], index=0)
        surface_metric = st.selectbox(
            "Metric to display", ["Final Price", "Sale Probability", "Expected Revenue"], index=0
        )
        resolution = st.slider("Surface resolution", min_value=10, max_value=50, value=25, step=5)
        if st.button("Generate surface"):
            with st.spinner("Computing surface..."):
                X_grid, Y_grid, Z = compute_surface(
                    df,
                    price_model,
                    sale_model,
                    var_x=x_var,
                    var_y=y_var,
                    metric=surface_metric,
                    n_points=int(resolution),
                    fixed_color=fixed_color,
                    fixed_clarity=fixed_clarity,
                )
            surface = go.Surface(x=X_grid, y=Y_grid, z=Z, colorscale="Viridis", showscale=True)
            fig = go.Figure(data=[surface])
            fig.update_layout(
                title=f"{surface_metric} Surface: {x_var} vs {y_var}",
                scene=dict(
                    xaxis_title=x_var,
                    yaxis_title=y_var,
                    zaxis_title=surface_metric,
                ),
                autosize=True,
                height=600,
            )
            st.plotly_chart(fig, use_container_width=True)
    else:
        st.info("Train the models to use optimisation and surfaces features.")

    # About section with citations
    st.header("About this demo")
    st.markdown(
        """
        This Streamlit app is a proof of concept for the **Diamond Auction
        Intelligence** project being proposed to the MASA innovation programme.  It
        showcases how synthetic diamond auction data can be analysed and how
        machine‑learning models can predict final prices and sale probabilities, and
        recommend reserve prices.  In a real implementation, the models would be
        trained on historical ODC auction records, including information on lot
        composition, bidder behaviour and market indices.

        Botswana’s economy is heavily dependent on diamonds, accounting for around
        80 % of exports and roughly one‑third of fiscal revenue. In 2024, the Okavango Diamond Company’s
        revenues were about 60 % of the prior year’s levels due to a slump in the
        diamond market. ODC currently sells most of its supply through approximately ten
        online auctions per year. A data‑driven optimisation platform could therefore
        deliver meaningful revenue uplift for Botswana by refining lot mixes and
        reserve prices.
        """
    )


if __name__ == "__main__":
    main()
