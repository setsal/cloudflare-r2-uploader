import { useState, useCallback, DragEvent } from 'react'
import { isImageFile } from '../lib/utils'

interface DropZoneProps {
  onFiles: (files: File[]) => void
  disabled?: boolean
}

export function DropZone({ onFiles, disabled }: DropZoneProps) {
  const [isDragActive, setIsDragActive] = useState(false)

  const handleDrag = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDragIn = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragActive(true)
    }
  }, [])

  const handleDragOut = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragActive(false)
  }, [])

  const handleDrop = useCallback(
    (e: DragEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragActive(false)

      if (disabled) return

      const files = Array.from(e.dataTransfer.files).filter(isImageFile)
      if (files.length > 0) {
        onFiles(files)
      }
    },
    [onFiles, disabled]
  )

  const handleClick = useCallback(async () => {
    if (disabled) return

    const filePaths = await window.api.openFileDialog()
    if (!filePaths) return

    // We can't get File objects from paths directly in renderer,
    // so we use an input element as fallback
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.multiple = true
    input.onchange = () => {
      if (input.files) {
        const files = Array.from(input.files).filter(isImageFile)
        if (files.length > 0) {
          onFiles(files)
        }
      }
    }
    input.click()
  }, [onFiles, disabled])

  return (
    <div
      className={`dropzone ${isDragActive ? 'dropzone--active' : ''}`}
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      id="dropzone"
    >
      <div className="dropzone__icon">☁</div>
      <div className="dropzone__text">
        {isDragActive ? 'Drop images here' : 'Drag & drop images here'}
      </div>
      <div className="dropzone__subtext">
        {isDragActive
          ? 'Release to start upload'
          : 'or click to browse • PNG, JPG, GIF, WebP, SVG, AVIF & more'}
      </div>
    </div>
  )
}
