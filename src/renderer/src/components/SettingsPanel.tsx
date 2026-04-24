import { useState, useEffect } from 'react'
import { AppConfig, R2Config } from '@common/types'
import { useToast } from './Toast'

interface SettingsPanelProps {
  config: AppConfig
  onUpdateConfig: (updates: Partial<AppConfig>) => Promise<AppConfig>
  onSetProfile: (name: string, profile: Record<string, unknown>) => Promise<AppConfig>
  onDeleteProfile: (name: string) => Promise<AppConfig>
}

export function SettingsPanel({
  config,
  onUpdateConfig,
  onSetProfile,
  onDeleteProfile
}: SettingsPanelProps) {
  const { addToast } = useToast()
  const [newProfileName, setNewProfileName] = useState('')
  const [testing, setTesting] = useState(false)
  const [configPath, setConfigPath] = useState('')
  const [historyPath, setHistoryPath] = useState('')

  const activeProfile = config.profiles[config.activeProfile]
  const profileNames = Object.keys(config.profiles)

  useEffect(() => {
    window.api.getConfigPath().then(setConfigPath).catch(() => {})
    window.api.getHistoryPath().then(setHistoryPath).catch(() => {})
  }, [])

  const updateActiveProfile = async (updates: Partial<R2Config>) => {
    const current = config.profiles[config.activeProfile]
    await onSetProfile(config.activeProfile, { ...current, ...updates })
  }

  const handleTestConnection = async () => {
    if (!activeProfile?.endpoint || !activeProfile?.bucketName) {
      addToast('Please fill in endpoint and bucket name first', 'error')
      return
    }
    setTesting(true)
    try {
      const result = await window.api.testConnection(activeProfile)
      if (result.success) {
        addToast('Connection successful! ✓', 'success')
      } else {
        addToast(`Connection failed: ${result.error}`, 'error')
      }
    } catch (err) {
      addToast('Connection test error', 'error')
    } finally {
      setTesting(false)
    }
  }

  const handleAddProfile = async () => {
    const name = newProfileName.trim()
    if (!name) return
    if (config.profiles[name]) {
      addToast('Profile name already exists', 'error')
      return
    }
    await onSetProfile(name, {
      endpoint: '',
      accessKeyId: '',
      secretAccessKey: '',
      bucketName: '',
      publicUrlBase: '',
      defaultPathPrefix: ''
    })
    await onUpdateConfig({ activeProfile: name })
    setNewProfileName('')
    addToast(`Profile "${name}" created`, 'success')
  }

  const handleDeleteProfile = async (name: string) => {
    if (name === 'Default') {
      addToast('Cannot delete the Default profile', 'error')
      return
    }
    await onDeleteProfile(name)
    addToast(`Profile "${name}" deleted`, 'info')
  }

  const handleExport = async () => {
    const result = await window.api.exportConfig()
    if (result.success) {
      addToast(`Settings exported to ${result.path}`, 'success')
    } else if (result.error) {
      addToast(`Export failed: ${result.error}`, 'error')
    }
  }

  const handleImport = async () => {
    const result = await window.api.importConfig()
    if (result.success) {
      addToast('Settings imported successfully! Reloading...', 'success')
      // Reload config in the app
      setTimeout(() => window.location.reload(), 500)
    } else if (result.error) {
      addToast(`Import failed: ${result.error}`, 'error')
    }
  }

  return (
    <div className="settings">
      {/* Profile Selector */}
      <div className="settings__section">
        <div className="settings__section-title">Credential Profile</div>

        <div className="profile-selector">
          <div className="form-group profile-selector__select">
            <label className="form-label" htmlFor="profile-select">Active Profile</label>
            <select
              id="profile-select"
              value={config.activeProfile}
              onChange={(e) => onUpdateConfig({ activeProfile: e.target.value })}
            >
              {profileNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {config.activeProfile !== 'Default' && (
            <button
              className="btn btn--danger btn--sm"
              onClick={() => handleDeleteProfile(config.activeProfile)}
              title="Delete this profile"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex gap-sm items-center">
          <input
            className="form-input flex-1"
            type="text"
            value={newProfileName}
            onChange={(e) => setNewProfileName(e.target.value)}
            placeholder="New profile name..."
            onKeyDown={(e) => e.key === 'Enter' && handleAddProfile()}
          />
          <button className="btn btn--secondary btn--sm" onClick={handleAddProfile}>
            + Add
          </button>
        </div>
      </div>

      {/* R2 Connection */}
      <div className="settings__section">
        <div className="settings__section-title">R2 Connection</div>

        <div className="form-group">
          <label className="form-label" htmlFor="endpoint">S3 API Endpoint</label>
          <input
            id="endpoint"
            className="form-input"
            type="text"
            value={activeProfile?.endpoint || ''}
            onChange={(e) => updateActiveProfile({ endpoint: e.target.value })}
            placeholder="https://<account-id>.r2.cloudflarestorage.com"
            spellCheck={false}
          />
        </div>

        <div className="settings__row">
          <div className="form-group">
            <label className="form-label" htmlFor="access-key">Access Key ID</label>
            <input
              id="access-key"
              className="form-input"
              type="text"
              value={activeProfile?.accessKeyId || ''}
              onChange={(e) => updateActiveProfile({ accessKeyId: e.target.value })}
              placeholder="Access Key ID"
              spellCheck={false}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="secret-key">Secret Access Key</label>
            <input
              id="secret-key"
              className="form-input form-input--password"
              type="password"
              value={activeProfile?.secretAccessKey || ''}
              onChange={(e) => updateActiveProfile({ secretAccessKey: e.target.value })}
              placeholder="••••••••"
            />
          </div>
        </div>

        <div className="settings__row">
          <div className="form-group">
            <label className="form-label" htmlFor="bucket-name">Bucket Name</label>
            <input
              id="bucket-name"
              className="form-input"
              type="text"
              value={activeProfile?.bucketName || ''}
              onChange={(e) => updateActiveProfile({ bucketName: e.target.value })}
              placeholder="my-bucket"
              spellCheck={false}
            />
          </div>
          <div className="form-group">
            <label className="form-label" htmlFor="public-url">Public URL Base</label>
            <input
              id="public-url"
              className="form-input"
              type="text"
              value={activeProfile?.publicUrlBase || ''}
              onChange={(e) => updateActiveProfile({ publicUrlBase: e.target.value })}
              placeholder="https://images.yourdomain.com"
              spellCheck={false}
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="default-path">Default Path Prefix</label>
          <input
            id="default-path"
            className="form-input"
            type="text"
            value={activeProfile?.defaultPathPrefix || ''}
            onChange={(e) => updateActiveProfile({ defaultPathPrefix: e.target.value })}
            placeholder="blog/images/"
            spellCheck={false}
          />
        </div>

        <button
          className="btn btn--secondary"
          onClick={handleTestConnection}
          disabled={testing}
          id="test-connection"
        >
          {testing ? (
            <>
              <span className="spinner" /> Testing...
            </>
          ) : (
            '🔗 Test Connection'
          )}
        </button>
      </div>

      {/* Preferences */}
      <div className="settings__section">
        <div className="settings__section-title">Preferences</div>

        {/* Theme Toggle */}
        <div className="toggle-group">
          <div className="toggle-group__label">
            <span className="toggle-group__title">
              {config.theme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}
            </span>
            <span className="toggle-group__desc">Switch between light and dark themes</span>
          </div>
          <div className="segmented" style={{ width: 160 }}>
            <button
              className={`segmented__option ${config.theme === 'light' ? 'segmented__option--active' : ''}`}
              onClick={() => onUpdateConfig({ theme: 'light' })}
            >
              ☀️ Light
            </button>
            <button
              className={`segmented__option ${config.theme === 'dark' ? 'segmented__option--active' : ''}`}
              onClick={() => onUpdateConfig({ theme: 'dark' })}
            >
              🌙 Dark
            </button>
          </div>
        </div>

        {/* Copy to Clipboard Toggle */}
        <div className="toggle-group">
          <div className="toggle-group__label">
            <span className="toggle-group__title">📋 Auto Copy to Clipboard</span>
            <span className="toggle-group__desc">Automatically copy URL after upload</span>
          </div>
          <label className="toggle-switch">
            <input
              type="checkbox"
              checked={config.copyToClipboard}
              onChange={(e) => onUpdateConfig({ copyToClipboard: e.target.checked })}
            />
            <span className="toggle-switch__slider" />
          </label>
        </div>

        <div className="form-group">
          <label className="form-label">Auto Rename Mode</label>
          <div className="segmented" id="settings-rename-toggle">
            {(['off', 'timestamp', 'random'] as const).map((mode) => (
              <button
                key={mode}
                className={`segmented__option ${config.autoRename === mode ? 'segmented__option--active' : ''}`}
                onClick={() => onUpdateConfig({ autoRename: mode })}
              >
                {mode === 'off' ? 'Off' : mode === 'timestamp' ? 'Timestamp' : 'Random'}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Clipboard Format</label>
          <div className="segmented" id="clipboard-format-toggle">
            {(['raw', 'markdown', 'html'] as const).map((fmt) => (
              <button
                key={fmt}
                className={`segmented__option ${config.clipboardFormat === fmt ? 'segmented__option--active' : ''}`}
                onClick={() => onUpdateConfig({ clipboardFormat: fmt })}
              >
                {fmt === 'raw' ? 'Raw URL' : fmt === 'markdown' ? 'Markdown' : 'HTML'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Data Management */}
      <div className="settings__section">
        <div className="settings__section-title">Data Management</div>

        <div className="config-info">
          <label className="form-label">Config File</label>
          <div className="config-info__path" title={configPath}>
            {configPath || 'Loading...'}
          </div>
        </div>

        <div className="config-info">
          <label className="form-label">History File</label>
          <div className="config-info__path" title={historyPath}>
            {historyPath || 'Loading...'}
          </div>
        </div>

        <div className="config-info__actions">
          <button className="btn btn--secondary" onClick={handleExport} id="export-config">
            📤 Export Settings
          </button>
          <button className="btn btn--secondary" onClick={handleImport} id="import-config">
            📥 Import Settings
          </button>
        </div>
      </div>
    </div>
  )
}
