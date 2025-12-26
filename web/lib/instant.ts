import { init } from '@instantdb/react';

const APP_ID = process.env.NEXT_PUBLIC_INSTANTDB_APP_ID || '';

if (!APP_ID) {
  console.warn('NEXT_PUBLIC_INSTANTDB_APP_ID is not set');
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










