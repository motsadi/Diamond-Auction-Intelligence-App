import { NextResponse } from 'next/server';
import { loadTrainedSyntheticAuction, predictPrice, predictSaleProba } from '@/lib/server/syntheticAuction';
import { STATIC_DATASET_ID } from '@/lib/staticDataset';

export const runtime = 'nodejs';

function linspace(min: number, max: number, n: number) {
  if (n <= 1) return [min];
  const out: number[] = [];
  const step = (max - min) / (n - 1);
  for (let i = 0; i < n; i++) out.push(min + step * i);
  return out;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const datasetId = String(body?.datasetId ?? '');
    if (!datasetId) return NextResponse.json({ success: false, message: 'datasetId is required' }, { status: 400 });
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

    const varX = String(body?.var_x ?? 'carat');
    const varY = String(body?.var_y ?? 'viewings');
    const metric = String(body?.metric ?? 'Final Price') as 'Final Price' | 'Sale Probability' | 'Expected Revenue';
    const nPoints = Number(body?.n_points ?? 25);
    const fixed_color = String(body?.fixed_color ?? 'G');
    const fixed_clarity = String(body?.fixed_clarity ?? 'VS1');

    const trained = await loadTrainedSyntheticAuction();

    const ranges: Record<string, { min: number; max: number }> = {
      carat: trained.ranges.carat,
      viewings: trained.ranges.viewings,
      price_index: trained.ranges.price_index,
    };

    if (!ranges[varX] || !ranges[varY]) {
      return NextResponse.json({ success: false, message: 'Invalid surface variables' }, { status: 400 });
    }

    const xs = linspace(ranges[varX].min, ranges[varX].max, Math.max(10, Math.min(50, nPoints)));
    const ys = linspace(ranges[varY].min, ranges[varY].max, Math.max(10, Math.min(50, nPoints)));

    const typical = {
      carat: (trained.ranges.carat.min + trained.ranges.carat.max) / 2,
      viewings: (trained.ranges.viewings.min + trained.ranges.viewings.max) / 2,
      price_index: (trained.ranges.price_index.min + trained.ranges.price_index.max) / 2,
      color: fixed_color,
      clarity: fixed_clarity,
    };

    const x_grid: number[][] = [];
    const y_grid: number[][] = [];
    const z_values: number[][] = [];

    for (let i = 0; i < ys.length; i++) {
      const rowX: number[] = [];
      const rowY: number[] = [];
      const rowZ: number[] = [];
      for (let j = 0; j < xs.length; j++) {
        const inp: any = { ...typical };
        inp[varX] = xs[j];
        inp[varY] = ys[i];

        const pred_price = predictPrice(trained.priceModel, inp);
        const pred_prob = predictSaleProba(trained.saleModel, inp);
        const z =
          metric === 'Final Price' ? pred_price : metric === 'Sale Probability' ? pred_prob : pred_price * pred_prob;

        rowX.push(xs[j]);
        rowY.push(ys[i]);
        rowZ.push(z);
      }
      x_grid.push(rowX);
      y_grid.push(rowY);
      z_values.push(rowZ);
    }

    return NextResponse.json({ success: true, x_grid, y_grid, z_values });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e?.message || 'Surface failed' }, { status: 500 });
  }
}


