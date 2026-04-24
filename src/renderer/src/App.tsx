import { useState, useCallback, useEffect } from 'react'
import { ToastProvider, useToast } from './components/Toast'
import { DropZone } from './components/DropZone'
import { PathInput } from './components/PathInput'
import { RenameToggle } from './components/RenameToggle'
import { UploadProgress } from './components/UploadProgress'
import { UploadHistory } from './components/UploadHistory'
import { SettingsPanel } from './components/SettingsPanel'
import { useConfig } from './hooks/useConfig'
import { useUpload } from './hooks/useUpload'

type TabId = 'upload' | 'history' | 'settings'

function AppContent() {
  const [activeTab, setActiveTab] = useState<TabId>('upload')
  const { config, loading, updateConfig, setProfile, deleteProfile } = useConfig()
  const { uploading, results, uploadFiles, clearResults } = useUpload()
  const { addToast } = useToast()

  const [uploadPath, setUploadPath] = useState('')

  // Apply theme to document root and update native title bar
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', config.theme)
    window.api.updateTheme(config.theme)
  }, [config.theme])

  // Use the config's default path if user hasn't overridden
  const effectivePath = uploadPath || config.profiles[config.activeProfile]?.defaultPathPrefix || ''

  const handleFiles = useCallback(
    async (files: File[]) => {
      // Check if profile is configured
      const profile = config.profiles[config.activeProfile]
      if (!profile?.endpoint || !profile?.accessKeyId || !profile?.bucketName) {
        addToast('Please configure your R2 settings first', 'error')
        setActiveTab('settings')
        return
      }

      clearResults()

      const uploadResults = await uploadFiles(files, {
        targetPath: effectivePath,
        autoRename: config.autoRename
      })

      const successCount = uploadResults.filter((r) => r.success).length
      const failCount = uploadResults.length - successCount

      if (successCount > 0) {
        const clipboardMsg = config.copyToClipboard ? ' URL copied to clipboard 📋' : ''
        addToast(
          `${successCount} image${successCount > 1 ? 's' : ''} uploaded!${clipboardMsg}`,
          'success'
        )
      }
      if (failCount > 0) {
        addToast(`${failCount} upload${failCount > 1 ? 's' : ''} failed`, 'error')
      }
    },
    [config, effectivePath, uploadFiles, clearResults, addToast]
  )

  if (loading) {
    return (
      <div className="app">
        <div className="app-content" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <span className="spinner" style={{ width: 32, height: 32 }} />
        </div>
      </div>
    )
  }

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: 'upload', label: 'Upload', icon: '☁' },
    { id: 'history', label: 'History', icon: '📋' },
    { id: 'settings', label: 'Settings', icon: '⚙' }
  ]

  // Show connection status
  const profile = config.profiles[config.activeProfile]
  const isConfigured = !!(profile?.endpoint && profile?.accessKeyId && profile?.bucketName)

  return (
    <div className="app">
      {/* Title Bar Area */}
      <div className="app-header">
        <div className="app-header__title">
          <div className="app-header__title-icon" />
          R2 Uploader
        </div>
        <div className="app-header__actions">
          <span
            className={`status-badge ${isConfigured ? 'status-badge--success' : 'status-badge--error'}`}
          >
            <span className="status-badge__dot" />
            {isConfigured ? config.activeProfile : 'Not configured'}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ padding: '0 24px' }}>
        <nav className="nav-tabs" id="main-nav">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`nav-tab ${activeTab === tab.id ? 'nav-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              id={`nav-${tab.id}`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="app-content">
        {activeTab === 'upload' && (
          <>
            <DropZone onFiles={handleFiles} disabled={uploading} />

            <div className="upload-controls">
              <PathInput
                value={uploadPath}
                onChange={setUploadPath}
                defaultPrefix={profile?.defaultPathPrefix}
              />
              <RenameToggle
                value={config.autoRename}
                onChange={(v) => updateConfig({ autoRename: v })}
              />
            </div>

            <UploadProgress results={results} uploading={uploading} />
          </>
        )}

        {activeTab === 'history' && <UploadHistory />}

        {activeTab === 'settings' && (
          <SettingsPanel
            config={config}
            onUpdateConfig={updateConfig}
            onSetProfile={setProfile}
            onDeleteProfile={deleteProfile}
          />
        )}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  )
}
