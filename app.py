"""
Streamlit application for the Diamond Auction Intelligence demo.

This mini application illustrates how machine learning can be
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
from sklearn.ensemble import GradientBoostingRegressor, GradientBoostingClassifier
from sklearn.metrics import r2_score, mean_absolute_error, accuracy_score


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


def train_models(df: pd.DataFrame):
    """Train a price regression model and a sale probability classifier.

    This function splits the provided DataFrame into train and test sets,
    constructs preprocessing pipelines to encode categorical features and
    pass through numeric features, trains both a GradientBoostingRegressor
    and a GradientBoostingClassifier, and evaluates them on the test set.

    Parameters
    ----------
    df : pandas.DataFrame
        The auction data containing predictor features and targets.

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

    # Define models
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
    if "models" not in st.session_state:
        st.info(
            "Click the button below to train the price and sale models. Training may take a few seconds."
        )
        if st.button("Train models"):
            with st.spinner("Training models..."):
                result = train_models(df)
            st.session_state["models"] = result["models"]
            st.session_state["metrics"] = result["metrics"]
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
        df_pred["predicted_price"] = price_model.predict(df_pred[["carat", "color", "clarity", "viewings", "price_index"]])
        df_pred["predicted_sale_proba"] = sale_model.predict_proba(df_pred[["carat", "color", "clarity", "viewings", "price_index"]])[:, 1]
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

    # About section with citations
    st.header("About this demo")
    st.markdown(
        """
        This Streamlit app is a simplified proof of concept for the **Diamond Auction
        Intelligence** project being proposed to the MASA innovation programme.  It
        showcases how synthetic diamond auction data can be analysed and how
        machine‑learning models can predict final prices and sale probabilities, and
        recommend reserve prices.  In a real implementation the models would be
        trained on historical ODC auction records, including information on lot
        composition, bidder behaviour and market indices.

        Botswana’s economy is heavily dependent on diamonds, accounting for around
        80 % of exports and roughly one‑third of fiscal revenue. In 2024, the Okavango Diamond Company’s
        revenues were about 60 % of the prior year’s levels due to a slump in the
        diamond market.  ODC currently sells most of its supply through approximately ten
        online auctions per year.  A data‑driven optimisation platform could therefore
        deliver meaningful revenue uplift for Botswana by refining lot mixes and
        reserve prices.
        """
    )


if __name__ == "__main__":
    main()
