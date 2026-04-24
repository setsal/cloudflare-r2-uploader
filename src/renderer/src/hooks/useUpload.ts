import { useState, useCallback } from 'react'
import { UploadResult } from '@common/types'
import { fileToArrayBuffer } from '../lib/utils'

interface UploadState {
  uploading: boolean
  results: UploadResult[]
}

export function useUpload() {
  const [state, setState] = useState<UploadState>({
    uploading: false,
    results: []
  })

  const uploadFiles = useCallback(
    async (
      files: File[],
      options: { targetPath: string; autoRename: 'off' | 'timestamp' | 'random' }
    ) => {
      setState((prev) => ({ ...prev, uploading: true, results: [] }))

      const results: UploadResult[] = []

      for (const file of files) {
        try {
          const buffer = await fileToArrayBuffer(file)
          const result = await window.api.uploadFile(
            { buffer, name: file.name, size: file.size },
            options
          )
          results.push(result)
        } catch (err) {
          results.push({
            success: false,
            error: err instanceof Error ? err.message : 'Upload failed',
            timestamp: Date.now()
          })
        }

        // Update results progressively
        setState((prev) => ({ ...prev, results: [...results] }))
      }

      setState((prev) => ({ ...prev, uploading: false }))
      return results
    },
    []
  )

  const clearResults = useCallback(() => {
    setState((prev) => ({ ...prev, results: [] }))
  }, [])

  return {
    uploading: state.uploading,
    results: state.results,
    uploadFiles,
    clearResults
  }
}
