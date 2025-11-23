export interface DlpOptions {
  url: string;
  format: string;
  mergeOutput: string;
  audioOnly: boolean;
  audioFormat: string;
  subs: boolean;
  autoSubs: boolean;
  embedSubs: boolean;
  embedThumbnail: boolean;
  embedMetadata: boolean;
  playlist: boolean;
  userAgent: string;
  cookiesBrowser: string;
  proxy: string;
  filenameTemplate: string;
  restrictFilenames: boolean;
}

export enum Tab {
  QUICK = 'quick',
  ADVANCED = 'advanced',
  AI_HELP = 'ai_help'
}

export interface GeminiResponse {
  analysis: string;
  suggestions: string[];
}

export enum DownloadStatus {
  IDLE = 'idle',
  PREPARING = 'preparing',
  DOWNLOADING = 'downloading',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  ERROR = 'error'
}

export interface ServerLog {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface DownloadPayload {
  url: string;
  options: Partial<DlpOptions>;
}