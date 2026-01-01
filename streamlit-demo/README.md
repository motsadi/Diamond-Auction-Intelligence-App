# Diamond Auction Intelligence Demo (Streamlit)

This directory contains the original Streamlit proof-of-concept application.

## Features

- Interactive exploration of a synthetic diamond‑auction dataset (500 lots).
- Training of a price regression model (Gradient Boosting) and a sale‑
  probability classifier.
- Evaluation of model performance (R², MAE, accuracy).
- Single‑lot prediction interface with a recommended reserve price based on
  predicted price and sale probability.
- Batch predictions for all lots with a downloadable CSV output.
- Background information on why such a platform matters for Botswana,
  including citations to recent news sources.

## Synthetic Dataset

The file `synthetic_auction_data.csv` contains 500 rows of generated data
emulating rough‑diamond auction lots.  Each row has the following fields:

| Column        | Description                                                   |
|---------------|---------------------------------------------------------------|
| `lot_id`      | Unique identifier for each lot                               |
| `carat`       | Carat weight of the diamond lot                              |
| `color`       | Colour grade (D–J)                                           |
| `clarity`     | Clarity grade (IF–I1)                                        |
| `viewings`    | Number of buyer viewings                                     |
| `price_index` | Macro price index factor                                     |
| `reserve_price` | Baseline reserve price for the lot                          |
| `final_price` | Final hammer price (synthesised for demonstration)           |
| `sold`        | Indicator whether the final price exceeded the reserve       |

In a production setting, these fields would be replaced with actual ODC auction
records (lot mix, reserve, bids, unsold flags) and additional variables such
as bidder category or origin.

## Running the Demo

```bash
pip install -r requirements.txt
streamlit run app.py
```

## Context and Need

Botswana's economy is heavily reliant on diamonds, accounting for
**around 80 % of exports** and **roughly one‑third of fiscal revenue**.
Weak demand in 2024 reduced Okavango Diamond Company's revenues to about
**60 % of 2023 levels**.  Because ODC sells most of its supply via a
handful of online auctions each year, optimising lot composition
and reserve prices could materially improve national revenue.  This demo app
supports the proposal for a full‑scale **Diamond Auction Intelligence** platform
by showing how machine learning can predict prices, estimate sale probabilities
and recommend reserve prices using auction data.























