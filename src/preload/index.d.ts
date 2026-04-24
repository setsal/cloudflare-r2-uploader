import { AppConfig, UploadResult, UploadHistoryItem } from '../common/types'

declare global {
  interface Window {
    api: {
      // Config
      getConfig: () => Promise<AppConfig>
      setConfig: (config: Partial<AppConfig>) => Promise<AppConfig>
      setProfile: (name: string, profile: Record<string, unknown>) => Promise<AppConfig>
      deleteProfile: (name: string) => Promise<AppConfig>
      getConfigPath: () => Promise<string>
      getHistoryPath: () => Promise<string>
      exportConfig: () => Promise<{ success: boolean; path?: string; error?: string }>
      importConfig: () => Promise<{ success: boolean; config?: AppConfig; error?: string }>

      // Upload
      uploadFile: (
        fileData: { buffer: ArrayBuffer; name: string; size: number },
        options: { targetPath: string; autoRename: string }
      ) => Promise<UploadResult>

      // R2 connection test
      testConnection: (profile: Record<string, unknown>) => Promise<{ success: boolean; error?: string }>

      // Clipboard
      copyToClipboard: (text: string) => Promise<boolean>

      // File dialog
      openFileDialog: () => Promise<string[] | null>

      // History
      getHistory: () => Promise<UploadHistoryItem[]>
      clearHistory: () => Promise<UploadHistoryItem[]>

      // Theme
      updateTheme: (theme: string) => Promise<void>

      // Window controls
      minimizeWindow: () => Promise<void>
      closeWindow: () => Promise<void>
    }
  }
}
