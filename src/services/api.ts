import axios from 'axios';
import type {
  OrganizeRequest,
  OrganizeResponse,
  OrganizeState,
  ResultsResponse,
  HealthResponse,
  EmbeddingsResponse
} from '../types';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
});

export const organizePhotos = {
  start: async (request: OrganizeRequest): Promise<OrganizeResponse> => {
    const response = await api.post('/organize/start', request);
    return response.data;
  },

  getProgress: async (): Promise<OrganizeState> => {
    const response = await api.get('/organize/progress');
    return response.data;
  },

  getResults: async (): Promise<ResultsResponse> => {
    const response = await api.get('/organize/results');
    return response.data;
  },

  cancel: async (): Promise<OrganizeResponse> => {
    const response = await api.post('/organize/cancel');
    return response.data;
  },
};

export const apiHealth = {
  check: async (): Promise<HealthResponse> => {
    const response = await api.get('/health');
    return response.data;
  },

  getEmbeddings: async (): Promise<EmbeddingsResponse> => {
    const response = await api.get('/embeddings');
    return response.data;
  },

  setEmbeddingsDir: async (embeddingsDir: string): Promise<any> => {
    const response = await api.post('/embeddings', { embeddingsDir });
    return response.data;
  },
};

export default api;

