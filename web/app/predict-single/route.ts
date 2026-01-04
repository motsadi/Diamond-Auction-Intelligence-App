import { NextResponse } from 'next/server';
import { loadTrainedSyntheticAuction, predictPrice, predictSaleProba, recommendedReserve } from '@/lib/server/syntheticAuction';
import { US_DIAMONDS_DATASET_ID } from '@/lib/staticDataset';
import { loadTrainedUSDiamonds, predictUSDiamonds } from '@/lib/server/usDiamonds';
import { parseUSDiamondsModelName } from '@/lib/server/datasetRegistry';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const datasetId = String(body?.datasetId ?? '');
    if (!datasetId) {
      return NextResponse.json({ success: false, message: 'datasetId is required' }, { status: 400 });
    }

    // US diamonds single prediction
    if (datasetId === US_DIAMONDS_DATASET_ID) {
      const trained = await loadTrainedUSDiamonds();
      const model = parseUSDiamondsModelName(body?.modelName);

      const carat = Number(body?.carat);
      const cut = String(body?.cut ?? '');
      const color = String(body?.color ?? '');
      const clarity = String(body?.clarity ?? '');
      const depth = Number(body?.depth);
      const table = Number(body?.table);
      const x = Number(body?.x);
      const y = Number(body?.y);
      const z = Number(body?.z);

      if (
        !Number.isFinite(carat) ||
        !Number.isFinite(depth) ||
        !Number.isFinite(table) ||
        !Number.isFinite(x) ||
        !Number.isFinite(y) ||
        !Number.isFinite(z) ||
        !cut ||
        !color ||
        !clarity
      ) {
        return NextResponse.json({ success: false, message: 'Invalid inputs' }, { status: 400 });
      }

      const out = predictUSDiamonds(trained, model, { carat, cut, color, clarity, depth, table, x, y, z });
      const predicted_price_per_carat = out.predicted_price / Math.max(carat, 1e-6);

      // Keep legacy field names for UI compatibility where possible
      return NextResponse.json({
        success: true,
        pred_price: out.predicted_price,
        pred_sale_proba: undefined,
        recommended_reserve: undefined,
        predicted_price: out.predicted_price,
        predicted_price_per_carat,
        price_low: out.price_low,
        price_high: out.price_high,
      });
    }

    const carat = Number(body?.carat);
    const viewings = Number(body?.viewings);
    const price_index = Number(body?.price_index);
    const color = String(body?.color ?? '');
    const clarity = String(body?.clarity ?? '');

    if (!Number.isFinite(carat) || !Number.isFinite(viewings) || !Number.isFinite(price_index) || !color || !clarity) {
      return NextResponse.json({ success: false, message: 'Invalid inputs' }, { status: 400 });
    }

    const trained = await loadTrainedSyntheticAuction();

    const pred_price = predictPrice(trained.priceModel, { carat, viewings, price_index, color, clarity });
    const pred_sale_proba = predictSaleProba(trained.saleModel, { carat, viewings, price_index, color, clarity });
    const recommended_reserve = recommendedReserve(pred_price, pred_sale_proba);

    return NextResponse.json({ success: true, pred_price, pred_sale_proba, recommended_reserve });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e?.message || 'Predict failed' }, { status: 500 });
  }
}


