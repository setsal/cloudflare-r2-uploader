import sharp from 'sharp'
import { ImageProcessingConfig, ImageProcessingResult } from '../common/types'

/**
 * Process an image buffer with compression and/or resize using sharp.
 * Runs in the main process for performance.
 */
export async function processImage(
  buffer: Buffer,
  fileName: string,
  config: ImageProcessingConfig
): Promise<ImageProcessingResult> {
  const originalSize = buffer.length

  // Get original metadata
  const metadata = await sharp(buffer).metadata()
  const originalWidth = metadata.width || 0
  const originalHeight = metadata.height || 0
  const format = metadata.format || 'unknown'

  // SVG, BMP, ICO — pass through without processing (sharp can't meaningfully compress these)
  const passthroughFormats = ['svg', 'ico', 'bmp']
  if (passthroughFormats.includes(format)) {
    return {
      originalSize,
      processedSize: originalSize,
      processedBuffer: buffer.buffer.slice(
        buffer.byteOffset,
        buffer.byteOffset + buffer.byteLength
      ) as ArrayBuffer,
      width: originalWidth,
      height: originalHeight,
      originalWidth,
      originalHeight,
      savings: 0,
      format,
      fileName
    }
  }

  let pipeline = sharp(buffer)

  // Apply resize if mode includes resize
  if ((config.mode === 'resize' || config.mode === 'both') && config.resize.percentage < 100) {
    const scale = config.resize.percentage / 100
    const newWidth = Math.round(originalWidth * scale)
    const newHeight = Math.round(originalHeight * scale)

    if (newWidth > 0 && newHeight > 0) {
      pipeline = pipeline.resize(newWidth, newHeight, {
        fit: 'fill',
        withoutEnlargement: true
      })
    }
  }

  // Apply compression based on format
  const shouldCompress = config.mode === 'compress' || config.mode === 'both'
  const quality = config.compression.quality

  switch (format) {
    case 'jpeg':
    case 'jpg':
      pipeline = pipeline.jpeg({
        quality: shouldCompress ? quality : 90,
        mozjpeg: true
      })
      break
    case 'png':
      pipeline = pipeline.png({
        quality: shouldCompress ? quality : 90,
        compressionLevel: shouldCompress ? 9 : 6
      })
      break
    case 'webp':
      pipeline = pipeline.webp({
        quality: shouldCompress ? quality : 90
      })
      break
    case 'avif':
      pipeline = pipeline.avif({
        quality: shouldCompress ? quality : 90
      })
      break
    case 'tiff':
      pipeline = pipeline.tiff({
        quality: shouldCompress ? quality : 90
      })
      break
    case 'gif':
      // GIF: sharp can process but limited compression, just resize
      pipeline = pipeline.gif()
      break
    default:
      // Unknown format: attempt to process anyway
      break
  }

  const processedBuffer = await pipeline.toBuffer()
  const processedMeta = await sharp(processedBuffer).metadata()

  const processedSize = processedBuffer.length
  const savings = originalSize > 0 ? Math.round(((originalSize - processedSize) / originalSize) * 100) : 0

  return {
    originalSize,
    processedSize,
    processedBuffer: processedBuffer.buffer.slice(
      processedBuffer.byteOffset,
      processedBuffer.byteOffset + processedBuffer.byteLength
    ) as ArrayBuffer,
    width: processedMeta.width || originalWidth,
    height: processedMeta.height || originalHeight,
    originalWidth,
    originalHeight,
    savings: Math.max(0, savings), // Don't report negative savings
    format,
    fileName
  }
}
