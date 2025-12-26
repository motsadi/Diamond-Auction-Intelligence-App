# Diamond Auction Intelligence Platform

A production-grade machine learning platform for predicting diamond auction outcomes, built with Next.js, FastAPI, InstantDB, and Google Cloud Storage.

## Architecture Overview

This repository contains a full-stack application with the following components:

- **`/web`** - Next.js (App Router) TypeScript frontend deployed on Vercel
- **`/api`** - FastAPI backend deployed on Google Cloud Run
- **`/streamlit-demo`** - Original Streamlit proof-of-concept (preserved for reference)

### Tech Stack

- **Frontend**: Next.js 14+ (App Router), TypeScript, React
- **Backend**: FastAPI, Python 3.11+
- **Database & Auth**: InstantDB
- **Storage**: Google Cloud Storage (GCS) for dataset files
- **ML**: scikit-learn (GradientBoosting, RandomForest, ExtraTrees)

## Features

- 🔐 **Authentication**: User signup/login via InstantDB
- 📊 **Dataset Management**: Upload CSV files directly to GCS via signed URLs
- 🤖 **ML Predictions**: Train and run models for price prediction and sale probability
- 📈 **Analytics Dashboard**: KPIs, recent runs, prediction history
- 🔍 **Exploratory Data Analysis**: Missingness, distributions, correlations
- 📉 **Forecasting**: Select dataset, model, and horizon; generate predictions with charts
- 👥 **Admin Panel**: Model registry, audit logs (admin-only)

## Project Structure

```
.
├── web/                    # Next.js frontend
│   ├── app/               # App Router pages
│   ├── components/        # React components
│   ├── lib/              # Utilities (InstantDB client, API client)
│   └── public/           # Static assets
├── api/                   # FastAPI backend
│   ├── ml/               # ML training and prediction modules
│   ├── routes/           # API endpoints
│   └── main.py          # FastAPI app entry point
└── streamlit-demo/       # Original Streamlit demo (preserved)
    ├── app.py
    ├── requirements.txt
    └── synthetic_auction_data.csv
```

## Quick Start (Local Development)

### Prerequisites

- Node.js 18+ and npm/yarn
- Python 3.11+
- Google Cloud account with GCS bucket
- InstantDB account

### 1. Backend Setup

```bash
cd api
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Set environment variables (see `api/.env.example`):
- `INSTANTDB_API_KEY`
- `GCS_BUCKET_NAME`
- `GOOGLE_APPLICATION_CREDENTIALS` (path to service account JSON)

Run the API:
```bash
uvicorn main:app --reload --port 8000
```

### 2. Frontend Setup

```bash
cd web
npm install
```

Set environment variables (see `web/.env.example`):
- `NEXT_PUBLIC_INSTANTDB_APP_ID`
- `NEXT_PUBLIC_API_URL` (e.g., `http://localhost:8000`)

Run the frontend:
```bash
npm run dev
```

Visit `http://localhost:3000`

### 3. First Admin User

See `DEPLOYMENT.md` for instructions on bootstrapping the first admin user.

## Deployment

See `DEPLOYMENT.md` for detailed deployment instructions:
- InstantDB setup
- Google Cloud Run deployment
- GCS bucket configuration
- Vercel deployment

## Dataset Format

The platform expects CSV files with the following columns (at minimum):
- `carat` - Carat weight (numeric)
- `color` - Color grade (categorical: D-J)
- `clarity` - Clarity grade (categorical: IF-I1)
- `viewings` - Number of viewings (integer)
- `price_index` - Price index factor (numeric)

Optional columns for training:
- `final_price` - Target for price prediction
- `sold` - Target for sale probability (0/1)

## ML Models

The platform supports three model families:
- **Gradient Boosting** (default)
- **Random Forest**
- **Extra Trees**

Each model predicts:
1. **Final Price** (regression)
2. **Sale Probability** (classification)

## License

[Add your license here]

## Contributing

[Add contributing guidelines here]
