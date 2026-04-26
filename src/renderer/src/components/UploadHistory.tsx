import { useState, useEffect, useCallback } from 'react'
import { UploadHistoryItem } from '@common/types'
import { formatFileSize, formatTimestamp } from '../lib/utils'
import { useToast } from './Toast'
import { IconCopy, IconInbox } from './Icons'

export function UploadHistory() {
  const [history, setHistory] = useState<UploadHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const { addToast } = useToast()

  const loadHistory = useCallback(async () => {
    try {
      const items = await window.api.getHistory()
      setHistory(items)
    } catch (err) {
      console.error('Failed to load history:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const handleCopy = async (url: string) => {
    await window.api.copyToClipboard(url)
    addToast('URL copied to clipboard!', 'success')
  }

  const handleClear = async () => {
    await window.api.clearHistory()
    setHistory([])
    addToast('History cleared', 'info')
  }

  if (loading) {
    return (
      <div className="history__empty">
        <span className="spinner" />
      </div>
    )
  }

  return (
    <div className="history">
      {history.length > 0 && (
        <div className="flex justify-between items-center mb-md">
          <span className="text-sm text-secondary">{history.length} uploads</span>
          <button className="btn btn--ghost btn--sm" onClick={handleClear}>
            Clear History
          </button>
        </div>
      )}

      {history.length === 0 ? (
        <div className="history__empty">
          <IconInbox size={32} />
          <div style={{ marginTop: '8px' }}>No uploads yet. Drop a file to get started!</div>
        </div>
      ) : (
        history.map((item, index) => (
          <div key={index} className="history__item">
            <div className="history__item-info">
              <div className="history__item-name" title={item.originalName}>
                {item.fileName}
              </div>
              <div className="history__item-url" title={item.url}>
                {item.url}
              </div>
            </div>
            <div className="history__item-meta">
              <div>{formatFileSize(item.fileSize)}</div>
              <div>{formatTimestamp(item.timestamp)}</div>
            </div>
            <div className="history__item-actions">
              <button
                className="btn btn--secondary btn--sm"
                onClick={() => handleCopy(item.url)}
                title="Copy URL"
              >
                <IconCopy size={12} /> Copy
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
