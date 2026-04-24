import { S3Client, PutObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3'
import { lookup } from 'mime-types'
import { nanoid } from 'nanoid'
import { R2Config, UploadResult } from '../common/types'

let s3Client: S3Client | null = null
let currentConfig: R2Config | null = null

function getClient(config: R2Config): S3Client {
  // Reuse client if config hasn't changed
  if (
    s3Client &&
    currentConfig &&
    currentConfig.endpoint === config.endpoint &&
    currentConfig.accessKeyId === config.accessKeyId &&
    currentConfig.secretAccessKey === config.secretAccessKey
  ) {
    return s3Client
  }

  s3Client = new S3Client({
    region: 'auto',
    endpoint: config.endpoint,
    credentials: {
      accessKeyId: config.accessKeyId,
      secretAccessKey: config.secretAccessKey
    }
  })

  currentConfig = { ...config }
  return s3Client
}

function generateFilename(
  originalName: string,
  mode: 'off' | 'timestamp' | 'random'
): string {
  const ext = originalName.includes('.') ? originalName.split('.').pop() : ''

  switch (mode) {
    case 'timestamp':
      return ext ? `${Date.now()}.${ext}` : `${Date.now()}`
    case 'random':
      return ext ? `${nanoid(16)}.${ext}` : nanoid(16)
    case 'off':
    default:
      return originalName
  }
}

function buildObjectKey(
  pathPrefix: string,
  fileName: string
): string {
  // Clean up path prefix
  let prefix = pathPrefix.trim()
  if (prefix.startsWith('/')) prefix = prefix.slice(1)
  if (prefix && !prefix.endsWith('/')) prefix += '/'

  return `${prefix}${fileName}`
}

function buildPublicUrl(publicUrlBase: string, objectKey: string): string {
  let base = publicUrlBase.trim()
  if (base.endsWith('/')) base = base.slice(0, -1)
  return `${base}/${objectKey}`
}

export async function uploadFile(
  config: R2Config,
  fileBuffer: Buffer,
  originalName: string,
  targetPath: string,
  autoRename: 'off' | 'timestamp' | 'random'
): Promise<UploadResult> {
  try {
    const client = getClient(config)
    const fileName = generateFilename(originalName, autoRename)
    const objectKey = buildObjectKey(targetPath, fileName)
    const contentType = lookup(originalName) || 'application/octet-stream'

    const command = new PutObjectCommand({
      Bucket: config.bucketName,
      Key: objectKey,
      Body: fileBuffer,
      ContentType: contentType
    })

    await client.send(command)

    const url = buildPublicUrl(config.publicUrlBase, objectKey)

    return {
      success: true,
      url,
      key: objectKey,
      fileName,
      fileSize: fileBuffer.length,
      timestamp: Date.now()
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown upload error'
    return {
      success: false,
      error: message,
      timestamp: Date.now()
    }
  }
}

export async function testConnection(config: R2Config): Promise<{ success: boolean; error?: string }> {
  try {
    const client = getClient(config)
    const command = new HeadBucketCommand({
      Bucket: config.bucketName
    })
    await client.send(command)
    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Connection failed'
    return { success: false, error: message }
  }
}
