export const STATIC_DATASET_ID = 'synthetic-auction';

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

