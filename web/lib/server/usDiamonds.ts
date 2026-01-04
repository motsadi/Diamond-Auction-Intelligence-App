import { readFile } from 'fs/promises';
import path from 'path';
import { RandomForestRegression } from 'ml-random-forest';

export const runtime = 'nodejs';

export type USDiamondRow = {
  carat: number;
  cut: string;
  color: string;
  clarity: string;
  depth: number;
  table: number;
  x: number;
  y: number;
  z: number;
  price: number;
};

export type USDiamondsModelName = 'Ridge' | 'RandomForest';

type Encoder = {
  cutLevels: string[];
  colorLevels: string[];
  clarityLevels: string[];
  numericMeans: Record<string, number>;
  numericStds: Record<string, number>;
  featureNames: string[];
};

type RidgeModel = {
  kind: 'Ridge';
  encoder: Encoder;
  beta: number[];
  residualStd: number;
};

type RFModel = {
  kind: 'RandomForest';
  encoder: Encoder;
  rf: any;
  residualStd: number;
  // Optional: normalized permutation importance (computed lazily)
  importance?: Record<string, number>;
};

export type USDiamondsTrained = {
  rows: USDiamondRow[];
  encoder: Encoder;
  ridge: RidgeModel;
  rf: RFModel;
  ranges: Record<string, { min: number; max: number }>;
};

let cached: USDiamondsTrained | null = null;

const NUMERIC_COLS = ['carat', 'depth', 'table', 'x', 'y', 'z'] as const;

function toNumber(v: string) {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
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
    for (let c = col; c < n; c++) M[col][c] /= diag;
    x[col] /= diag;

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

function ridgeFit(X: number[][], y: number[], lambda = 1e-2) {
  const Xt = transpose(X);
  const XtX = matMul(Xt, X);
  const k = XtX.length;
  for (let i = 0; i < k; i++) XtX[i][i] += lambda;
  const Xty = matVecMul(Xt, y);
  return solve(XtX, Xty);
}

function buildEncoder(rows: USDiamondRow[]): Encoder {
  const cutLevels = Array.from(new Set(rows.map((r) => r.cut))).sort();
  const colorLevels = Array.from(new Set(rows.map((r) => r.color))).sort();
  const clarityLevels = Array.from(new Set(rows.map((r) => r.clarity))).sort();

  const numericMeans: Record<string, number> = {};
  const numericStds: Record<string, number> = {};
  for (const col of NUMERIC_COLS) {
    const arr = rows.map((r) => r[col]).filter((v) => Number.isFinite(v));
    const mu = mean(arr);
    numericMeans[col] = mu;
    numericStds[col] = std(arr, mu);
  }

  const featureNames = [
    'intercept',
    ...NUMERIC_COLS.map((c) => String(c)),
    ...cutLevels.map((c) => `cut:${c}`),
    ...colorLevels.map((c) => `color:${c}`),
    ...clarityLevels.map((c) => `clarity:${c}`),
  ];

  return { cutLevels, colorLevels, clarityLevels, numericMeans, numericStds, featureNames };
}

function encodeRow(row: Omit<USDiamondRow, 'price'>, enc: Encoder) {
  const v: number[] = [];
  v.push(1);
  for (const col of NUMERIC_COLS) {
    const raw = (row as any)[col];
    v.push((raw - enc.numericMeans[col]) / enc.numericStds[col]);
  }
  for (const c of enc.cutLevels) v.push(row.cut === c ? 1 : 0);
  for (const c of enc.colorLevels) v.push(row.color === c ? 1 : 0);
  for (const c of enc.clarityLevels) v.push(row.clarity === c ? 1 : 0);
  return v;
}

function predictRidge(model: RidgeModel, row: Omit<USDiamondRow, 'price'>) {
  const x = encodeRow(row, model.encoder);
  return matVecMul([x], model.beta)[0];
}

function residualStd(yTrue: number[], yPred: number[]) {
  const errs = yTrue.map((y, i) => y - yPred[i]);
  const mu = mean(errs);
  return std(errs, mu);
}

function r2Mae(yTrue: number[], yPred: number[]) {
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
  return { r2: ssTot > 0 ? 1 - ssRes / ssTot : 0, mae: mae / Math.max(yTrue.length, 1) };
}

function sampleRows<T>(arr: T[], n: number) {
  if (arr.length <= n) return arr.slice();
  const out: T[] = [];
  const step = arr.length / n;
  for (let i = 0; i < n; i++) out.push(arr[Math.floor(i * step)]);
  return out;
}

function permutationImportanceRF(
  rf: any,
  X: number[][],
  y: number[],
  featureNames: string[],
  maxSamples = 2000
) {
  const Xs = sampleRows(X, maxSamples);
  const ys = sampleRows(y, maxSamples);

  const basePred = rf.predict(Xs) as number[];
  const base = r2Mae(ys, basePred);
  const baseMse = ys.reduce((a, v, i) => {
    const d = v - basePred[i];
    return a + d * d;
  }, 0) / Math.max(ys.length, 1);

  const importances: Array<[string, number]> = [];

  for (let j = 0; j < (Xs[0]?.length ?? 0); j++) {
    const shuffled = Xs.map((r) => r.slice());
    // shuffle column j
    const col = shuffled.map((r) => r[j]);
    for (let i = col.length - 1; i > 0; i--) {
      const k = Math.floor(Math.random() * (i + 1));
      [col[i], col[k]] = [col[k], col[i]];
    }
    for (let i = 0; i < shuffled.length; i++) shuffled[i][j] = col[i];

    const pred = rf.predict(shuffled) as number[];
    const mse =
      ys.reduce((a, v, i) => {
        const d = v - pred[i];
        return a + d * d;
      }, 0) / Math.max(ys.length, 1);
    const delta = Math.max(0, mse - baseMse);
    importances.push([featureNames[j] ?? `x${j}`, delta]);
  }

  const total = importances.reduce((a, [, v]) => a + v, 0) || 1;
  const out: Record<string, number> = {};
  for (const [k, v] of importances) out[k] = v / total;
  // Also attach baseline metrics (unused currently, but helpful for debugging)
  out.__baseline_r2 = base.r2;
  out.__baseline_mae = base.mae;
  return out;
}

export async function loadTrainedUSDiamonds(): Promise<USDiamondsTrained> {
  if (cached) return cached;
  const filePath = path.join(process.cwd(), 'public', 'data', 'US_diamonds.csv');
  const csv = await readFile(filePath, 'utf-8');
  const lines = csv.trim().split(/\r?\n/);
  const header = lines[0].split(',').map((h) => h.trim());

  const idx = (name: string) => header.indexOf(name);
  const idxOrThrow = (name: string) => {
    const i = idx(name);
    if (i < 0) throw new Error(`US_diamonds.csv missing column: ${name}`);
    return i;
  };

  const rows: USDiamondRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',');
    const r: USDiamondRow = {
      carat: toNumber(parts[idxOrThrow('carat')] ?? ''),
      cut: String(parts[idxOrThrow('cut')] ?? ''),
      color: String(parts[idxOrThrow('color')] ?? ''),
      clarity: String(parts[idxOrThrow('clarity')] ?? ''),
      depth: toNumber(parts[idxOrThrow('depth')] ?? ''),
      table: toNumber(parts[idxOrThrow('table')] ?? ''),
      x: toNumber(parts[idxOrThrow('x')] ?? ''),
      y: toNumber(parts[idxOrThrow('y')] ?? ''),
      z: toNumber(parts[idxOrThrow('z')] ?? ''),
      price: toNumber(parts[idxOrThrow('price')] ?? ''),
    };
    if (!Number.isFinite(r.carat) || !Number.isFinite(r.price)) continue;
    if (!r.cut || !r.color || !r.clarity) continue;
    rows.push(r);
  }

  // Train on a representative subset for serverless performance.
  const trainRows = sampleRows(rows, 15000);
  const enc = buildEncoder(trainRows);

  const X = trainRows.map((r) =>
    encodeRow(
      {
        carat: r.carat,
        cut: r.cut,
        color: r.color,
        clarity: r.clarity,
        depth: r.depth,
        table: r.table,
        x: r.x,
        y: r.y,
        z: r.z,
      },
      enc
    )
  );
  const y = trainRows.map((r) => r.price);

  // Ridge
  const beta = ridgeFit(X, y, 1e-2);
  const ridgePred = X.map((x) => matVecMul([x], beta)[0]);
  const ridgeStd = residualStd(y, ridgePred);

  const ridge: RidgeModel = { kind: 'Ridge', encoder: enc, beta, residualStd: ridgeStd };

  // Random Forest
  const rf = new RandomForestRegression({
    nEstimators: 40,
    maxFeatures: 0.7,
    replacement: true,
    seed: 42,
    treeOptions: {
      maxDepth: 12,
      minNumSamples: 10,
    },
  });
  rf.train(X, y);
  const rfPred = rf.predict(X) as number[];
  const rfStd = residualStd(y, rfPred);

  const rfModel: RFModel = { kind: 'RandomForest', encoder: enc, rf, residualStd: rfStd };

  const ranges: Record<string, { min: number; max: number }> = {};
  for (const col of ['carat', 'depth', 'table', 'x', 'y', 'z'] as const) {
    const arr = trainRows.map((r) => (r as any)[col]).filter((v) => Number.isFinite(v));
    ranges[col] = { min: Math.min(...arr), max: Math.max(...arr) };
  }

  cached = { rows, encoder: enc, ridge, rf: rfModel, ranges };
  return cached;
}

export function predictUSDiamonds(
  trained: USDiamondsTrained,
  model: USDiamondsModelName,
  input: Omit<USDiamondRow, 'price'>
) {
  if (model === 'RandomForest') {
    const x = encodeRow(input, trained.encoder);
    const pred = (trained.rf.rf.predict([x]) as number[])[0];
    // 80% interval via residual std (fast default)
    const z80 = 1.281551565545; // ~Phi^{-1}(0.9)
    const low = pred - z80 * trained.rf.residualStd;
    const high = pred + z80 * trained.rf.residualStd;
    return { predicted_price: pred, price_low: low, price_high: high };
  }

  const pred = predictRidge(trained.ridge, input);
  const z80 = 1.281551565545;
  const low = pred - z80 * trained.ridge.residualStd;
  const high = pred + z80 * trained.ridge.residualStd;
  return { predicted_price: pred, price_low: low, price_high: high };
}

export async function getUSDiamondsImportance(trained: USDiamondsTrained, model: USDiamondsModelName) {
  if (model === 'Ridge') {
    const pairs: Array<[string, number]> = [];
    for (let i = 0; i < trained.encoder.featureNames.length; i++) {
      const name = trained.encoder.featureNames[i];
      if (name === 'intercept') continue;
      pairs.push([name, Math.abs(trained.ridge.beta[i] ?? 0)]);
    }
    const total = pairs.reduce((a, [, w]) => a + w, 0) || 1;
    const out: Record<string, number> = {};
    for (const [k, w] of pairs) out[k] = w / total;
    return out;
  }

  if (!trained.rf.importance) {
    const trainRows = sampleRows(trained.rows, 15000);
    const X = trainRows.map((r) =>
      encodeRow(
        {
          carat: r.carat,
          cut: r.cut,
          color: r.color,
          clarity: r.clarity,
          depth: r.depth,
          table: r.table,
          x: r.x,
          y: r.y,
          z: r.z,
        },
        trained.encoder
      )
    );
    const y = trainRows.map((r) => r.price);
    trained.rf.importance = permutationImportanceRF(
      trained.rf.rf,
      X,
      y,
      trained.encoder.featureNames,
      1500
    );
  }

  // Strip helper keys
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(trained.rf.importance)) {
    if (k.startsWith('__')) continue;
    out[k] = v as number;
  }
  return out;
}


