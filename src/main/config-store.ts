import Store from 'electron-store'
import { readFileSync, writeFileSync } from 'fs'
import { AppConfig, DEFAULT_CONFIG, CURRENT_CONFIG_VERSION, UploadHistoryItem } from '../common/types'

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

// Window state store — persists window position & size across sessions
export interface WindowBounds {
  x?: number
  y?: number
  width: number
  height: number
}

const windowStateStore = new Store<{
  bounds: WindowBounds
}>({
  name: 'window-state',
  defaults: {
    bounds: { width: 800, height: 650 }
  }
})

export function getWindowBounds(): WindowBounds {
  return windowStateStore.get('bounds')
}

export function setWindowBounds(bounds: WindowBounds): void {
  windowStateStore.set('bounds', bounds)
}

// ---- Config Migrations ----
// Add new migrations here when you change the AppConfig schema.
// Each migration transforms the config from (toVersion - 1) → toVersion.
// They run in order at startup if the stored version is behind.

interface Migration {
  toVersion: number
  migrate: (config: Record<string, unknown>) => Record<string, unknown>
}

const migrations: Migration[] = [
  // Example for future use:
  // {
  //   toVersion: 2,
  //   migrate: (config) => {
  //     // Add a new field with a default value
  //     config.newField = config.newField ?? 'defaultValue'
  //     return config
  //   }
  // }
]

function runMigrations(): void {
  const raw = configStore.get('config') as unknown as Record<string, unknown>
  const storedVersion = (typeof raw.configVersion === 'number') ? raw.configVersion : 0

  if (storedVersion >= CURRENT_CONFIG_VERSION) return

  let config = { ...raw }

  for (const migration of migrations) {
    if (storedVersion < migration.toVersion) {
      console.log(`[config] Migrating config v${storedVersion} → v${migration.toVersion}`)
      config = migration.migrate(config)
    }
  }

  // Merge with defaults to pick up any new fields not covered by explicit migrations
  config = { ...DEFAULT_CONFIG, ...config, configVersion: CURRENT_CONFIG_VERSION }
  configStore.set('config', config as unknown as AppConfig)
  console.log(`[config] Migration complete → v${CURRENT_CONFIG_VERSION}`)
}

// Run migrations on startup
runMigrations()

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
