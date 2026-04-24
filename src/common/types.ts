export interface R2Config {
  endpoint: string
  accessKeyId: string
  secretAccessKey: string
  bucketName: string
  publicUrlBase: string
  defaultPathPrefix: string
}

export interface AppConfig {
  profiles: Record<string, R2Config>
  activeProfile: string
  autoRename: 'off' | 'timestamp' | 'random'
  clipboardFormat: 'raw' | 'markdown' | 'html'
  copyToClipboard: boolean
  theme: 'light' | 'dark'
  minimizeToTray: boolean
}

export interface UploadOptions {
  targetPath: string
  autoRename: 'off' | 'timestamp' | 'random'
}

export interface UploadResult {
  success: boolean
  url?: string
  key?: string
  fileName?: string
  fileSize?: number
  error?: string
  timestamp: number
}

export interface UploadHistoryItem {
  url: string
  key: string
  fileName: string
  originalName: string
  fileSize: number
  timestamp: number
  profile: string
}

export interface FileData {
  buffer: ArrayBuffer
  name: string
  type: string
  size: number
}

export const DEFAULT_CONFIG: AppConfig = {
  profiles: {
    Default: {
      endpoint: '',
      accessKeyId: '',
      secretAccessKey: '',
      bucketName: '',
      publicUrlBase: '',
      defaultPathPrefix: ''
    }
  },
  activeProfile: 'Default',
  autoRename: 'timestamp',
  clipboardFormat: 'raw',
  copyToClipboard: false,
  theme: 'dark',
  minimizeToTray: true
}

export const SUPPORTED_IMAGE_TYPES = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/svg+xml',
  'image/avif',
  'image/bmp',
  'image/tiff',
  'image/x-icon',
  'image/heic',
  'image/heif'
]
