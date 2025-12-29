import { init } from '@instantdb/react';

// InstantDB App ID is safe to expose publicly (NEXT_PUBLIC_*). We still prefer env vars so
// deployments can point at the correct InstantDB project.
//
// Note: Vercel has separate env var scopes (Production / Preview / Development). If you only set
// this in Production, preview URLs will not have it and auth will fail.
const DEFAULT_INSTANTDB_APP_ID = 'fdfdd9c1-9d26-46cb-8659-ca0547ed8a71';
const APP_ID =
  (process.env.NEXT_PUBLIC_INSTANTDB_APP_ID &&
    process.env.NEXT_PUBLIC_INSTANTDB_APP_ID.trim()) ||
  DEFAULT_INSTANTDB_APP_ID;

if (!process.env.NEXT_PUBLIC_INSTANTDB_APP_ID) {
  console.warn(
    'NEXT_PUBLIC_INSTANTDB_APP_ID is not set; falling back to DEFAULT_INSTANTDB_APP_ID. ' +
      'Set it in Vercel for Production + Preview to avoid surprises.'
  );
}

export const db = init({
  appId: APP_ID,
});

// Schema types (matching InstantDB schema)
export type User = {
  id: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: number;
};

export type Dataset = {
  id: string;
  ownerId: string;
  name: string;
  createdAt: number;
  gcsBucket: string;
  gcsObject: string;
  rowCount: number;
  columns: string[];
  notes?: string;
};

export type Prediction = {
  id: string;
  ownerId: string;
  datasetId: string;
  modelName: string;
  horizon?: number;
  createdAt: number;
  metrics?: {
    price_r2?: number;
    price_mae?: number;
    sale_accuracy?: number;
  };
  outputGcsObject?: string;
  previewRows?: any[];
};

export type Model = {
  id: string;
  name: string;
  version: string;
  description?: string;
  features: string[];
  createdAt: number;
};

export type AuditLog = {
  id: string;
  actorId: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: number;
  meta?: Record<string, any>;
};

















