import { useState, useCallback, DragEvent } from 'react'
import { IconUpload } from './Icons'

interface DropZoneProps {
  onFiles: (files: File[]) => void
  onRejectNonImage?: (count: number) => void
  disabled?: boolean
}

export function DropZone({ onFiles, onRejectNonImage, disabled }: DropZoneProps) {
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

      const allFiles = Array.from(e.dataTransfer.files)
      const imageFiles = allFiles.filter((f) => f.type.startsWith('image/'))
      const rejectedCount = allFiles.length - imageFiles.length

      if (rejectedCount > 0 && onRejectNonImage) {
        onRejectNonImage(rejectedCount)
      }

      if (imageFiles.length > 0) {
        onFiles(imageFiles)
      }
    },
    [onFiles, onRejectNonImage, disabled]
  )

  const handleClick = useCallback(() => {
    if (disabled) return

    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.multiple = true
    input.onchange = () => {
      if (input.files) {
        const files = Array.from(input.files)
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
      <div className="dropzone__icon">
        <IconUpload size={24} />
      </div>
      <div className="dropzone__text">
        {isDragActive ? 'Drop images here' : 'Drag & drop images here'}
      </div>
      <div className="dropzone__subtext">
        {isDragActive
          ? 'Release to start upload'
          : 'or click to browse — JPEG, PNG, WebP, AVIF, GIF, SVG'}
      </div>
    </div>
  )
}
