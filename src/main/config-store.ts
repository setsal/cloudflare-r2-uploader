import Store from 'electron-store'
import { readFileSync, writeFileSync } from 'fs'
import { AppConfig, DEFAULT_CONFIG, UploadHistoryItem } from '../common/types'

// Config store — stores app settings and profiles
const configStore = new Store<{
  config: AppConfig
}>({
  name: 'config',
  defaults: {
    config: DEFAULT_CONFIG
  }
})

// History store — standalone file for upload history records
const historyStore = new Store<{
  history: UploadHistoryItem[]
}>({
  name: 'history',
  defaults: {
    history: []
  }
})

// ---- Config ----

export function getConfig(): AppConfig {
  return configStore.get('config')
}

export function setConfig(config: Partial<AppConfig>): AppConfig {
  const current = getConfig()
  const updated = { ...current, ...config }
  configStore.set('config', updated)
  return updated
}

export function getActiveProfile() {
  const config = getConfig()
  return config.profiles[config.activeProfile] || null
}

export function setProfile(name: string, profile: Partial<AppConfig['profiles'][string]>) {
  const config = getConfig()
  const existing = config.profiles[name] || DEFAULT_CONFIG.profiles.Default
  config.profiles[name] = { ...existing, ...profile }
  configStore.set('config', config)
  return config
}

export function deleteProfile(name: string) {
  const config = getConfig()
  if (name === 'Default') return config // Don't delete default
  delete config.profiles[name]
  if (config.activeProfile === name) {
    config.activeProfile = 'Default'
  }
  configStore.set('config', config)
  return config
}

// ---- History (separate file) ----

export function getHistory(): UploadHistoryItem[] {
  return historyStore.get('history')
}

export function addHistoryItem(item: UploadHistoryItem) {
  const history = getHistory()
  history.unshift(item) // Add to front
  // Keep last 100 items
  if (history.length > 100) {
    history.length = 100
  }
  historyStore.set('history', history)
  return history
}

export function clearHistory() {
  historyStore.set('history', [])
  return []
}

// ---- Paths ----

export function getConfigPath(): string {
  return configStore.path
}

export function getHistoryPath(): string {
  return historyStore.path
}

// ---- Export / Import ----

export function exportConfig(): { config: AppConfig; history: UploadHistoryItem[] } {
  return {
    config: getConfig(),
    history: getHistory()
  }
}

export function exportConfigToFile(filePath: string): void {
  const data = exportConfig()
  writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8')
}

export function importConfigFromFile(filePath: string): AppConfig {
  const raw = readFileSync(filePath, 'utf-8')
  const data = JSON.parse(raw)

  if (data.config) {
    // Merge with defaults to ensure new fields are present
    const merged = { ...DEFAULT_CONFIG, ...data.config }
    configStore.set('config', merged)
  }
  if (Array.isArray(data.history)) {
    historyStore.set('history', data.history)
  }

  return getConfig()
}
