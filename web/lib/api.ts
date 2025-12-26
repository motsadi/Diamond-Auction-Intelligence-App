import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  // Get token from InstantDB auth (will be set by auth context)
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface SignedUploadResponse {
  uploadUrl: string;
  bucket: string;
  objectKey: string;
  datasetId: string;
}

export interface RegisterDatasetRequest {
  datasetId: string;
  name: string;
  gcsBucket: string;
  gcsObject: string;
}

export interface RegisterDatasetResponse {
  success: boolean;
  datasetId: string;
  rowCount: number;
  columns: string[];
}

export interface PredictRequest {
  datasetId: string;
  modelName: string;
  horizon?: number;
}

export interface PredictResponse {
  success: boolean;
  predictionId: string;
  metrics?: {
    price_r2?: number;
    price_mae?: number;
    sale_accuracy?: number;
  };
  previewRows?: any[];
  outputGcsObject?: string;
}

export const apiClient = {
  health: async () => {
    const response = await api.get('/health');
    return response.data;
  },

  getSignedUploadUrl: async (filename: string, contentType: string = 'text/csv'): Promise<SignedUploadResponse> => {
    const response = await api.post('/datasets/signed-upload', {
      filename,
      contentType,
    });
    return response.data;
  },

  registerDataset: async (data: RegisterDatasetRequest): Promise<RegisterDatasetResponse> => {
    const response = await api.post('/datasets/register', data);
    return response.data;
  },

  predict: async (data: PredictRequest): Promise<PredictResponse> => {
    const response = await api.post('/predict', data);
    return response.data;
  },

  backtest: async (datasetId: string, modelName: string) => {
    const response = await api.post('/backtest', {
      datasetId,
      modelName,
    });
    return response.data;
  },
};

export default api;










