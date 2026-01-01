import { readFile } from 'fs/promises';
import path from 'path';

export const runtime = 'nodejs';

export type AuctionRow = {
  lot_id: string;
  carat: number;
  color: string;
  clarity: string;
  viewings: number;
  price_index: number;
  reserve_price: number;
  final_price: number;
  sold: number;
};

type Model = {
  features: string[];
  beta: number[];
  numericMeans: Record<string, number>;
  numericStds: Record<string, number>;
  colorLevels: string[];
  clarityLevels: string[];
};

type Trained = {
  rows: AuctionRow[];
  priceModel: Model;
  saleModel: Model;
  ranges: {
    carat: { min: number; max: number };
    viewings: { min: number; max: number };
    price_index: { min: number; max: number };
  };
};

let cached: Trained | null = null;

function toNumber(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
}

function clamp01(x: number) {
  if (x < 0) return 0;
  if (x > 1) return 1;
  return x;
}

function sigmoid(z: number) {
  // stable sigmoid
  if (z >= 0) {
    const ez = Math.exp(-z);
    return 1 / (1 + ez);
  }
  const ez = Math.exp(z);
  return ez / (1 + ez);
}

function mean(arr: number[]) {
  return arr.reduce((a, b) => a + b, 0) / Math.max(arr.length, 1);
}

function std(arr: number[], mu: number) {
  const v =
    arr.reduce((a, b) => {
      const d = b - mu;
      return a + d * d;
    }, 0) / Math.max(arr.length, 1);
  const s = Math.sqrt(v);
  return s > 1e-8 ? s : 1;
}

function transpose(A: number[][]) {
  const m = A.length;
  const n = A[0]?.length ?? 0;
  const T = Array.from({ length: n }, () => Array(m).fill(0));
  for (let i = 0; i < m; i++) {
    for (let j = 0; j < n; j++) T[j][i] = A[i][j];
  }
  return T;
}

function matMul(A: number[][], B: number[][]) {
  const m = A.length;
  const n = A[0]?.length ?? 0;
  const p = B[0]?.length ?? 0;
  const out = Array.from({ length: m }, () => Array(p).fill(0));
  for (let i = 0; i < m; i++) {
    for (let k = 0; k < n; k++) {
      const aik = A[i][k];
      for (let j = 0; j < p; j++) out[i][j] += aik * B[k][j];
    }
  }
  return out;
}

function matVecMul(A: number[][], v: number[]) {
  const m = A.length;
  const n = A[0]?.length ?? 0;
  const out = Array(m).fill(0);
  for (let i = 0; i < m; i++) {
    let sum = 0;
    for (let j = 0; j < n; j++) sum += A[i][j] * v[j];
    out[i] = sum;
  }
  return out;
}

function solve(A: number[][], b: number[]) {
  // Gaussian elimination with partial pivoting
  const n = A.length;
  const M = A.map((row) => row.slice());
  const x = b.slice();

  for (let col = 0; col < n; col++) {
    // pivot
    let pivot = col;
    let best = Math.abs(M[col][col]);
    for (let r = col + 1; r < n; r++) {
      const v = Math.abs(M[r][col]);
      if (v > best) {
        best = v;
        pivot = r;
      }
    }
    if (pivot !== col) {
      [M[col], M[pivot]] = [M[pivot], M[col]];
      [x[col], x[pivot]] = [x[pivot], x[col]];
    }

    const diag = M[col][col] || 1e-12;
    // normalize row
    for (let c = col; c < n; c++) M[col][c] /= diag;
    x[col] /= diag;

    // eliminate
    for (let r = 0; r < n; r++) {
      if (r === col) continue;
      const factor = M[r][col];
      if (factor === 0) continue;
      for (let c = col; c < n; c++) M[r][c] -= factor * M[col][c];
      x[r] -= factor * x[col];
    }
  }
  return x;
}

function ridgeFit(X: number[][], y: number[], lambda = 1e-3) {
  const Xt = transpose(X);
  const XtX = matMul(Xt, X);
  const k = XtX.length;
  for (let i = 0; i < k; i++) XtX[i][i] += lambda;
  const Xty = matVecMul(Xt, y);
  return solve(XtX, Xty);
}

function buildFeatureVector(
  input: { carat: number; viewings: number; price_index: number; color: string; clarity: string },
  model: Pick<Model, 'numericMeans' | 'numericStds' | 'colorLevels' | 'clarityLevels'>
) {
  const { numericMeans, numericStds, colorLevels, clarityLevels } = model;
  const v: number[] = [];
  v.push(1); // intercept
  v.push((input.carat - numericMeans.carat) / numericStds.carat);
  v.push((input.viewings - numericMeans.viewings) / numericStds.viewings);
  v.push((input.price_index - numericMeans.price_index) / numericStds.price_index);

  for (const c of colorLevels) v.push(input.color === c ? 1 : 0);
  for (const c of clarityLevels) v.push(input.clarity === c ? 1 : 0);
  return v;
}

function train(rows: AuctionRow[]): Trained {
  const colorLevels = Array.from(new Set(rows.map((r) => r.color))).sort();
  const clarityLevels = Array.from(new Set(rows.map((r) => r.clarity))).sort();

  const carats = rows.map((r) => r.carat);
  const viewings = rows.map((r) => r.viewings);
  const priceIndex = rows.map((r) => r.price_index);

  const muCarat = mean(carats);
  const muView = mean(viewings);
  const muPi = mean(priceIndex);
  const sdCarat = std(carats, muCarat);
  const sdView = std(viewings, muView);
  const sdPi = std(priceIndex, muPi);

  const numericMeans = { carat: muCarat, viewings: muView, price_index: muPi };
  const numericStds = { carat: sdCarat, viewings: sdView, price_index: sdPi };

  const baseModel = { numericMeans, numericStds, colorLevels, clarityLevels };
  const X = rows.map((r) =>
    buildFeatureVector(
      {
        carat: r.carat,
        viewings: r.viewings,
        price_index: r.price_index,
        color: r.color,
        clarity: r.clarity,
      },
      baseModel
    )
  );

  const yPrice = rows.map((r) => r.final_price);
  const ySold = rows.map((r) => r.sold);

  const betaPrice = ridgeFit(X, yPrice, 1e-2);
  const betaSale = ridgeFit(X, ySold, 1e-2);

  const features = [
    'intercept',
    'carat',
    'viewings',
    'price_index',
    ...colorLevels.map((c) => `color:${c}`),
    ...clarityLevels.map((c) => `clarity:${c}`),
  ];

  const priceModel: Model = { features, beta: betaPrice, numericMeans, numericStds, colorLevels, clarityLevels };
  const saleModel: Model = { features, beta: betaSale, numericMeans, numericStds, colorLevels, clarityLevels };

  const ranges = {
    carat: { min: Math.min(...carats), max: Math.max(...carats) },
    viewings: { min: Math.min(...viewings), max: Math.max(...viewings) },
    price_index: { min: Math.min(...priceIndex), max: Math.max(...priceIndex) },
  };

  return { rows, priceModel, saleModel, ranges };
}

export async function loadTrainedSyntheticAuction(): Promise<Trained> {
  if (cached) return cached;
  const filePath = path.join(process.cwd(), 'public', 'data', 'synthetic_auction_data.csv');
  const csv = await readFile(filePath, 'utf-8');
  const lines = csv.trim().split(/\r?\n/);
  const header = lines[0].split(',').map((h) => h.trim());

  const idx = (name: string) => header.indexOf(name);

  const rows: AuctionRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    const row: AuctionRow = {
      lot_id: String(parts[idx('lot_id')] ?? ''),
      carat: toNumber(parts[idx('carat')] ?? ''),
      color: String(parts[idx('color')] ?? ''),
      clarity: String(parts[idx('clarity')] ?? ''),
      viewings: toNumber(parts[idx('viewings')] ?? ''),
      price_index: toNumber(parts[idx('price_index')] ?? ''),
      reserve_price: toNumber(parts[idx('reserve_price')] ?? ''),
      final_price: toNumber(parts[idx('final_price')] ?? ''),
      sold: toNumber(parts[idx('sold')] ?? ''),
    };
    if (!row.lot_id) continue;
    if (!Number.isFinite(row.carat) || !Number.isFinite(row.viewings) || !Number.isFinite(row.price_index)) continue;
    if (!Number.isFinite(row.final_price) || !Number.isFinite(row.sold)) continue;
    rows.push(row);
  }

  cached = train(rows);
  return cached;
}

export function predictPrice(model: Model, input: { carat: number; viewings: number; price_index: number; color: string; clarity: string }) {
  const x = buildFeatureVector(input, model);
  return matVecMul([x], model.beta)[0];
}

export function predictSaleProba(
  model: Model,
  input: { carat: number; viewings: number; price_index: number; color: string; clarity: string }
) {
  const x = buildFeatureVector(input, model);
  const raw = matVecMul([x], model.beta)[0];
  return clamp01(sigmoid(raw));
}

export function recommendedReserve(predPrice: number, saleProba: number) {
  // Simple business rule: reserve close to predicted price, adjusted by confidence.
  const reserve = predPrice * (0.75 + 0.2 * saleProba);
  return Math.max(0, reserve);
}

export function priceMetrics(yTrue: number[], yPred: number[]) {
  const mu = mean(yTrue);
  let ssTot = 0;
  let ssRes = 0;
  let mae = 0;
  for (let i = 0; i < yTrue.length; i++) {
    const d = yTrue[i] - yPred[i];
    ssRes += d * d;
    const t = yTrue[i] - mu;
    ssTot += t * t;
    mae += Math.abs(d);
  }
  const r2 = ssTot > 0 ? 1 - ssRes / ssTot : 0;
  mae /= Math.max(yTrue.length, 1);
  return { r2, mae };
}

export function accuracy(yTrue: number[], yPredProb: number[], threshold = 0.5) {
  let correct = 0;
  for (let i = 0; i < yTrue.length; i++) {
    const pred = yPredProb[i] >= threshold ? 1 : 0;
    if (pred === (yTrue[i] >= 0.5 ? 1 : 0)) correct++;
  }
  return correct / Math.max(yTrue.length, 1);
}


