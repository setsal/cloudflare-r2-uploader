import { useState, useCallback, DragEvent } from 'react'
import { IconUpload } from './Icons'

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

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        onFiles(files)
      }
    },
    [onFiles, disabled]
  )

  const handleClick = useCallback(() => {
    if (disabled) return

    const input = document.createElement('input')
    input.type = 'file'
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
        {isDragActive ? 'Drop files here' : 'Drag & drop files here'}
      </div>
      <div className="dropzone__subtext">
        {isDragActive
          ? 'Release to start upload'
          : 'or click to browse — images, documents, and more'}
      </div>
    </div>
  )
}
