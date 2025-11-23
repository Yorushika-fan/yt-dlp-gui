import { DlpOptions } from './types';

export const DEFAULT_OPTIONS: DlpOptions = {
  url: '',
  format: 'bestvideo+bestaudio/best',
  mergeOutput: 'mp4',
  audioOnly: false,
  audioFormat: 'mp3',
  subs: false,
  autoSubs: false,
  embedSubs: false,
  embedThumbnail: true,
  embedMetadata: true,
  playlist: false,
  userAgent: '',
  cookiesBrowser: '',
  proxy: '',
  filenameTemplate: '%(title)s.%(ext)s',
  restrictFilenames: true,
};

export const FORMAT_OPTIONS = [
  { value: 'bestvideo+bestaudio/best', label: '最佳视频+最佳音频 (默认)' },
  { value: 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best', label: '最佳 MP4 兼容' },
  { value: 'bestvideo[height<=2160]+bestaudio/best[height<=2160]', label: '限制 4K (2160p)' },
  { value: 'bestvideo[height<=1080]+bestaudio/best[height<=1080]', label: '限制 1080p' },
  { value: 'bestvideo[height<=720]+bestaudio/best[height<=720]', label: '限制 720p' },
];

export const AUDIO_FORMATS = [
  { value: 'mp3', label: 'MP3' },
  { value: 'm4a', label: 'M4A' },
  { value: 'wav', label: 'WAV' },
  { value: 'flac', label: 'FLAC' },
];

export const MERGE_FORMATS = [
  { value: 'mp4', label: 'MP4' },
  { value: 'mkv', label: 'MKV' },
  { value: 'webm', label: 'WebM' },
];

export const BROWSER_OPTIONS = [
  { value: '', label: '无 (None)' },
  { value: 'chrome', label: 'Google Chrome' },
  { value: 'firefox', label: 'Mozilla Firefox' },
  { value: 'edge', label: 'Microsoft Edge' },
  { value: 'brave', label: 'Brave' },
];