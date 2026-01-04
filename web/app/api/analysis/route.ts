import { NextResponse } from 'next/server';
import { loadTrainedSyntheticAuction } from '@/lib/server/syntheticAuction';
import { STATIC_DATASET_ID, US_DIAMONDS_DATASET_ID } from '@/lib/staticDataset';
import { loadTrainedUSDiamonds } from '@/lib/server/usDiamonds';

export const runtime = 'nodejs';

function mean(arr: number[]) {
  return arr.reduce((a, b) => a + b, 0) / Math.max(arr.length, 1);
}

function std(arr: number[], mu: number) {
  const v =
    arr.reduce((a, b) => {
      const d = b - mu;
      return a + d * d;
    }, 0) / Math.max(arr.length, 1);
  return Math.sqrt(v);
}

function pearson(x: number[], y: number[]) {
  const mx = mean(x);
  const my = mean(y);
  let num = 0;
  let dx = 0;
  let dy = 0;
  for (let i = 0; i < x.length; i++) {
    const a = x[i] - mx;
    const b = y[i] - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  const den = Math.sqrt(dx * dy) || 1;
  return num / den;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const datasetId = String(body?.datasetId ?? '');
    if (!datasetId) return NextResponse.json({ success: false, message: 'datasetId is required' }, { status: 400 });

    // Dataset routing
    let rows: any[] = [];
    let numericColumns: string[] = [];

    if (datasetId === STATIC_DATASET_ID) {
      const trained = await loadTrainedSyntheticAuction();
      rows = trained.rows as any[];
      numericColumns = ['carat', 'viewings', 'price_index', 'reserve_price', 'final_price', 'sold'];
    } else if (datasetId === US_DIAMONDS_DATASET_ID) {
      const trained = await loadTrainedUSDiamonds();
      rows = trained.rows as any[];
      numericColumns = ['carat', 'depth', 'table', 'x', 'y', 'z', 'price'];
    } else {
      return NextResponse.json({ success: false, message: 'Unknown datasetId' }, { status: 400 });
    }

    const missingness: Record<string, number> = {};
    for (const col of numericColumns) missingness[col] = 0;
    // With the synthetic dataset we expect no missingness; kept for completeness.

    const distributions: Record<
      string,
      { count: number; mean: number; std: number; min: number; max: number }
    > = {};

    for (const col of numericColumns) {
      const arr = rows.map((r: any) => Number(r[col])).filter((v) => Number.isFinite(v));
      const mu = mean(arr);
      distributions[col] = {
        count: arr.length,
        mean: mu,
        std: std(arr, mu),
        min: Math.min(...arr),
        max: Math.max(...arr),
      };
    }

    const series: Record<string, number[]> = {};
    for (const col of numericColumns) {
      series[col] = rows.map((r: any) => Number(r[col]));
    }

    const corrCols = [...numericColumns];
    const matrix: number[][] = [];
    for (let i = 0; i < corrCols.length; i++) {
      const row: number[] = [];
      for (let j = 0; j < corrCols.length; j++) {
        row.push(pearson(series[corrCols[i]], series[corrCols[j]]));
      }
      matrix.push(row);
    }

    return NextResponse.json({
      success: true,
      missingness,
      distributions,
      correlations: { columns: corrCols, matrix },
    });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e?.message || 'Analysis failed' }, { status: 500 });
  }
}


