import { STATIC_DATASET_ID, US_DIAMONDS_DATASET_ID } from '@/lib/staticDataset';
import { loadTrainedSyntheticAuction } from './syntheticAuction';
import { loadTrainedUSDiamonds, type USDiamondsModelName } from './usDiamonds';

export type DatasetKind = 'synthetic-auction' | 'us-diamonds';

export function getDatasetKind(datasetId: string): DatasetKind | null {
  if (datasetId === STATIC_DATASET_ID) return 'synthetic-auction';
  if (datasetId === US_DIAMONDS_DATASET_ID) return 'us-diamonds';
  return null;
}

export function parseUSDiamondsModelName(modelName: unknown): USDiamondsModelName {
  const m = String(modelName ?? '');
  return /random\s*forest/i.test(m) ? 'RandomForest' : 'Ridge';
}

export async function loadDataset(datasetId: string) {
  const kind = getDatasetKind(datasetId);
  if (!kind) throw new Error('Unknown datasetId');
  if (kind === 'synthetic-auction') return { kind, trained: await loadTrainedSyntheticAuction() };
  return { kind, trained: await loadTrainedUSDiamonds() };
}


