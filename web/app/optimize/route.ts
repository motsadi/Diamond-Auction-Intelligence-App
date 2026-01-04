import { NextResponse } from 'next/server';
import { loadTrainedSyntheticAuction, predictPrice, predictSaleProba } from '@/lib/server/syntheticAuction';
import { STATIC_DATASET_ID, US_DIAMONDS_DATASET_ID } from '@/lib/staticDataset';
import { loadTrainedUSDiamonds, predictUSDiamonds } from '@/lib/server/usDiamonds';
import { parseUSDiamondsModelName } from '@/lib/server/datasetRegistry';

export const runtime = 'nodejs';

function randBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const datasetId = String(body?.datasetId ?? '');
    if (!datasetId) {
      return NextResponse.json({ success: false, message: 'datasetId is required' }, { status: 400 });
    }

    const objective = String(body?.objective ?? 'max_price') as 'max_price' | 'max_prob' | 'target';
    const nSamples = Number(body?.n_samples ?? 1000);
    const fixed_color = String(body?.fixed_color ?? 'G');
    const fixed_clarity = String(body?.fixed_clarity ?? 'VS1');
    const fixed_cut = String(body?.fixed_cut ?? 'Ideal');
    const minProb = Number(body?.min_prob ?? 0.5);
    const targetPrice = Number(body?.target_price ?? 5000);
    const targetProb = Number(body?.target_prob ?? 0.8);

    // US diamonds optimization (price only)
    if (datasetId === US_DIAMONDS_DATASET_ID) {
      const trained = await loadTrainedUSDiamonds();
      const model = parseUSDiamondsModelName(body?.modelName);

      let best: any = null;
      let bestScore = -Infinity;

      const n = Math.max(50, Math.min(5000, nSamples));
      for (let i = 0; i < n; i++) {
        const carat = randBetween(trained.ranges.carat.min, trained.ranges.carat.max);
        const depth = randBetween(trained.ranges.depth.min, trained.ranges.depth.max);
        const table = randBetween(trained.ranges.table.min, trained.ranges.table.max);
        const x = randBetween(trained.ranges.x.min, trained.ranges.x.max);
        const y = randBetween(trained.ranges.y.min, trained.ranges.y.max);
        const z = randBetween(trained.ranges.z.min, trained.ranges.z.max);

        const out = predictUSDiamonds(trained, model, { carat, cut: fixed_cut, color: fixed_color, clarity: fixed_clarity, depth, table, x, y, z });
        const pred_price = out.predicted_price;
        const pred_ppc = pred_price / Math.max(carat, 1e-6);

        let score = -Infinity;
        if (objective === 'max_price') score = pred_price;
        else if (objective === 'max_prob') score = pred_ppc; // reinterpret as max value density
        else if (objective === 'target') score = -Math.abs(pred_price - targetPrice);

        if (score > bestScore) {
          bestScore = score;
          best = {
            carat,
            cut: fixed_cut,
            color: fixed_color,
            clarity: fixed_clarity,
            depth,
            table,
            x,
            y,
            z,
            pred_price,
            pred_prob: undefined,
            objective_score: score,
          };
        }
      }

      if (!best) {
        return NextResponse.json({ success: false, message: 'No feasible solution found for the selected constraints.' });
      }

      return NextResponse.json({ success: true, result: best });
    }

    if (datasetId !== STATIC_DATASET_ID) {
      return NextResponse.json({ success: false, message: 'Unknown datasetId' }, { status: 400 });
    }

    const trained = await loadTrainedSyntheticAuction();

    let best: any = null;
    let bestScore = -Infinity;

    for (let i = 0; i < Math.max(50, Math.min(5000, nSamples)); i++) {
      const carat = randBetween(trained.ranges.carat.min, trained.ranges.carat.max);
      const viewings = randBetween(trained.ranges.viewings.min, trained.ranges.viewings.max);
      const price_index = randBetween(trained.ranges.price_index.min, trained.ranges.price_index.max);

      const pred_price = predictPrice(trained.priceModel, { carat, viewings, price_index, color: fixed_color, clarity: fixed_clarity });
      const pred_prob = predictSaleProba(trained.saleModel, { carat, viewings, price_index, color: fixed_color, clarity: fixed_clarity });

      let score = -Infinity;
      if (objective === 'max_price') {
        if (pred_prob < minProb) continue;
        score = pred_price;
      } else if (objective === 'max_prob') {
        score = pred_prob;
      } else if (objective === 'target') {
        const priceLoss = Math.abs(pred_price - targetPrice) / Math.max(targetPrice, 1);
        const probLoss = Math.abs(pred_prob - targetProb);
        score = -(priceLoss + probLoss);
      }

      if (score > bestScore) {
        bestScore = score;
        best = { carat, viewings, price_index, color: fixed_color, clarity: fixed_clarity, pred_price, pred_prob, objective_score: score };
      }
    }

    if (!best) {
      return NextResponse.json({ success: false, message: 'No feasible solution found for the selected constraints.' });
    }

    return NextResponse.json({ success: true, result: best });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e?.message || 'Optimize failed' }, { status: 500 });
  }
}


