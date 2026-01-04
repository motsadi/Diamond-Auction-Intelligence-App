import { NextResponse } from 'next/server';
import { loadTrainedSyntheticAuction, predictPrice, predictSaleProba } from '@/lib/server/syntheticAuction';
import { STATIC_DATASET_ID, US_DIAMONDS_DATASET_ID } from '@/lib/staticDataset';
import { loadTrainedUSDiamonds, predictUSDiamonds } from '@/lib/server/usDiamonds';
import { parseUSDiamondsModelName } from '@/lib/server/datasetRegistry';

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

    const varX = String(body?.var_x ?? 'carat');
    const varY = String(body?.var_y ?? 'viewings');
    const metric = String(body?.metric ?? 'Final Price') as 'Final Price' | 'Sale Probability' | 'Expected Revenue';
    const nPoints = Number(body?.n_points ?? 25);
    const fixed_color = String(body?.fixed_color ?? 'G');
    const fixed_clarity = String(body?.fixed_clarity ?? 'VS1');
    const fixed_cut = String(body?.fixed_cut ?? 'Ideal');

    // US diamonds surface (price only)
    if (datasetId === US_DIAMONDS_DATASET_ID) {
      const trained = await loadTrainedUSDiamonds();
      const model = parseUSDiamondsModelName(body?.modelName);

      const ranges: Record<string, { min: number; max: number }> = {
        carat: trained.ranges.carat,
        depth: trained.ranges.depth,
        table: trained.ranges.table,
        x: trained.ranges.x,
        y: trained.ranges.y,
        z: trained.ranges.z,
      };

      if (!ranges[varX] || !ranges[varY]) {
        return NextResponse.json({ success: false, message: 'Invalid surface variables' }, { status: 400 });
      }

      const xs = linspace(ranges[varX].min, ranges[varX].max, Math.max(10, Math.min(50, nPoints)));
      const ys = linspace(ranges[varY].min, ranges[varY].max, Math.max(10, Math.min(50, nPoints)));

      const typical: any = {
        carat: (trained.ranges.carat.min + trained.ranges.carat.max) / 2,
        depth: (trained.ranges.depth.min + trained.ranges.depth.max) / 2,
        table: (trained.ranges.table.min + trained.ranges.table.max) / 2,
        x: (trained.ranges.x.min + trained.ranges.x.max) / 2,
        y: (trained.ranges.y.min + trained.ranges.y.max) / 2,
        z: (trained.ranges.z.min + trained.ranges.z.max) / 2,
        cut: fixed_cut,
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
          const out = predictUSDiamonds(trained, model, inp);
          const val = metric === 'Sale Probability' ? 0 : out.predicted_price;
          rowX.push(xs[j]);
          rowY.push(ys[i]);
          rowZ.push(val);
        }
        x_grid.push(rowX);
        y_grid.push(rowY);
        z_values.push(rowZ);
      }

      return NextResponse.json({ success: true, x_grid, y_grid, z_values });
    }

    if (datasetId !== STATIC_DATASET_ID) {
      return NextResponse.json({ success: false, message: 'Unknown datasetId' }, { status: 400 });
    }

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


