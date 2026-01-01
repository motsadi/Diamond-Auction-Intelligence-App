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
  outputCsvData?: string; // Base64 encoded CSV for static dataset
}

export interface SinglePredictRequest {
  datasetId: string;
  modelName: string;
  carat: number;
  color: string;
  clarity: string;
  viewings: number;
  price_index: number;
}

export interface SinglePredictResponse {
  success: boolean;
  pred_price: number;
  pred_sale_proba: number;
  recommended_reserve: number;
}

export interface OptimizeRequest {
  datasetId: string;
  modelName: string;
  objective: 'max_price' | 'max_prob' | 'target';
  n_samples?: number;
  min_prob?: number;
  target_price?: number;
  target_prob?: number;
  fixed_color?: string;
  fixed_clarity?: string;
}

export interface OptimizeResponse {
  success: boolean;
  result?: {
    carat: number;
    viewings: number;
    price_index: number;
    color: string;
    clarity: string;
    pred_price: number;
    pred_prob: number;
    objective_score: number;
  };
  message?: string;
}

export interface SurfaceRequest {
  datasetId: string;
  modelName: string;
  var_x: string;
  var_y: string;
  metric?: 'Final Price' | 'Sale Probability' | 'Expected Revenue';
  n_points?: number;
  fixed_color?: string;
  fixed_clarity?: string;
}

export interface SurfaceResponse {
  success: boolean;
  x_grid: number[][];
  y_grid: number[][];
  z_values: number[][];
}

export interface ShapRequest {
  datasetId: string;
  modelName: string;
}

export interface ShapResponse {
  success: boolean;
  price_importance: Record<string, number>;
  sale_importance: Record<string, number>;
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

  predictSingle: async (data: SinglePredictRequest): Promise<SinglePredictResponse> => {
    const response = await api.post('/predict-single', data);
    return response.data;
  },

  downloadPrediction: async (predictionId: string): Promise<Blob> => {
    const response = await api.get(`/predictions/${predictionId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  optimize: async (data: OptimizeRequest): Promise<OptimizeResponse> => {
    const response = await api.post('/optimize', data);
    return response.data;
  },

  surface: async (data: SurfaceRequest): Promise<SurfaceResponse> => {
    const response = await api.post('/surface', data);
    return response.data;
  },

  shap: async (data: ShapRequest): Promise<ShapResponse> => {
    const response = await api.post('/shap', data);
    return response.data;
  },
};

export default api;






















