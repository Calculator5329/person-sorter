export interface Photo {
  originalPath: string;
  newPath: string;
  filename: string;
  similarity: number;
  timestamp: number;
}

export interface Person {
  name: string;
  photoCount: number;
  photos: Photo[];
}

export interface Progress {
  scanned: number;
  total: number;
  organized: number;
  currentFile: string;
  currentPerson: string;
}

export interface OrganizeState {
  active: boolean;
  progress: Progress;
  persons: Person[];
}

export interface OrganizeRequest {
  inputFolder: string;
  outputFolder: string;
  threshold: number;
  embeddingsDir?: string;
}

export interface OrganizeResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface HealthResponse {
  status: string;
  embeddings_loaded: number;
  face_app_ready: boolean;
}

export interface EmbeddingsResponse {
  persons: string[];
  count: number;
}

export interface ResultsResponse {
  persons: Person[];
  totalScanned: number;
  totalOrganized: number;
}

// Electron API types
declare global {
  interface Window {
    electronAPI: {
      selectFolder: () => Promise<string | null>;
      getAppPath: (name: string) => Promise<string>;
      getPublicPath: () => Promise<string>;
    };
  }
}

