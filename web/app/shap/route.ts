import { NextResponse } from 'next/server';
import { loadTrainedSyntheticAuction } from '@/lib/server/syntheticAuction';
import { STATIC_DATASET_ID, US_DIAMONDS_DATASET_ID } from '@/lib/staticDataset';
import { loadTrainedUSDiamonds, getUSDiamondsImportance } from '@/lib/server/usDiamonds';
import { parseUSDiamondsModelName } from '@/lib/server/datasetRegistry';

export const runtime = 'nodejs';

function normalizeImportance(featureNames: string[], beta: number[]) {
  const pairs: Array<[string, number]> = [];
  for (let i = 0; i < featureNames.length; i++) {
    const name = featureNames[i];
    const w = Math.abs(beta[i] ?? 0);
    if (name === 'intercept') continue;
    pairs.push([name, w]);
  }
  const total = pairs.reduce((a, [, w]) => a + w, 0) || 1;
  const out: Record<string, number> = {};
  for (const [k, w] of pairs) out[k] = w / total;
  return out;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const datasetId = String(body?.datasetId ?? '');
    if (!datasetId) return NextResponse.json({ success: false, message: 'datasetId is required' }, { status: 400 });

    if (datasetId === US_DIAMONDS_DATASET_ID) {
      const trained = await loadTrainedUSDiamonds();
      const model = parseUSDiamondsModelName(body?.modelName);
      const price_importance = await getUSDiamondsImportance(trained, model);
      return NextResponse.json({ success: true, price_importance, sale_importance: {} });
    }

    if (datasetId !== STATIC_DATASET_ID) {
      return NextResponse.json({ success: false, message: 'Unknown datasetId' }, { status: 400 });
    }

    const trained = await loadTrainedSyntheticAuction();
    const price_importance = normalizeImportance(trained.priceModel.features, trained.priceModel.beta);
    const sale_importance = normalizeImportance(trained.saleModel.features, trained.saleModel.beta);

    return NextResponse.json({ success: true, price_importance, sale_importance });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e?.message || 'SHAP failed' }, { status: 500 });
  }
}


