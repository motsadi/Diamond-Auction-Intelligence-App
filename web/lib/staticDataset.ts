export const STATIC_DATASET_ID = 'synthetic-auction';
export const US_DIAMONDS_DATASET_ID = 'us-diamonds';

export const staticDataset = {
  id: STATIC_DATASET_ID,
  name: 'Synthetic Auction Data',
  createdAt: new Date('2024-01-01').getTime(),
  rowCount: 500,
  columns: [
    'lot_id',
    'carat',
    'color',
    'clarity',
    'viewings',
    'price_index',
    'reserve_price',
    'final_price',
    'sold',
  ],
  notes: 'Preloaded demo dataset used for analysis/forecasting. Uploads are disabled; this dataset is maintained by the developer.',
  downloadPath: '/api/static-dataset',
};

export const usDiamondsDataset = {
  id: US_DIAMONDS_DATASET_ID,
  name: 'US Diamonds (Retail)',
  createdAt: new Date('2024-01-01').getTime(),
  // This is the common ggplot2 diamonds dataset shape: ~54k rows.
  // We'll compute exact rowCount server-side when needed; for UI we provide an estimate.
  rowCount: 53940,
  columns: ['carat', 'cut', 'color', 'clarity', 'depth', 'table', 'x', 'y', 'z', 'price'],
  notes:
    'Retail diamonds dataset. Target is price (USD). Used for price prediction and uncertainty bands.',
  downloadPath: '/api/us-diamonds',
};

