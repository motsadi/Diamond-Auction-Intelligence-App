import { NextResponse } from 'next/server';
import { loadTrainedSyntheticAuction, predictPrice, predictSaleProba, recommendedReserve } from '@/lib/server/syntheticAuction';
import { STATIC_DATASET_ID } from '@/lib/staticDataset';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const datasetId = String(body?.datasetId ?? '');
    if (!datasetId) {
      return NextResponse.json({ success: false, message: 'datasetId is required' }, { status: 400 });
    }
    if (datasetId !== STATIC_DATASET_ID) {
      return NextResponse.json(
        {
          success: false,
          message:
            'Only the built-in synthetic dataset is available in this deployment. Set NEXT_PUBLIC_API_URL to use an external API for uploaded datasets.',
        },
        { status: 400 }
      );
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


