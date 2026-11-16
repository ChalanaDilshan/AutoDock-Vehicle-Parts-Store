import crypto from 'crypto';
import path from 'path';
import fs from 'fs/promises';
import { env } from '../../../config/env.js';
import { logger } from '../../../shared/utils/logger.js';

export interface PresignedUrlResult {
  viewUrl: string;
  expiresInSeconds: number;
}

export interface IStorageService {
  uploadPrivateFile(
    sellerId: string,
    documentType: string,
    originalFileName: string,
    mimeType: string,
    dataBuffer: Buffer
  ): Promise<string>;

  generatePresignedViewUrl(s3StorageKey: string, expiresInSeconds?: number): Promise<PresignedUrlResult>;

  getFileBuffer(s3StorageKey: string): Promise<{ buffer: Buffer; mimeType: string }>;
}

/**
 * Local Private Storage Service Adapter
 * Uses local isolated non-public directory with secure token-gated streaming.
 * Provides identical interface to AWS S3 private bucket adapter.
 */
export class LocalPrivateStorageService implements IStorageService {
  private baseDir: string;

  constructor() {
    this.baseDir = path.resolve(process.cwd(), 'storage', 'private');
  }

  private async ensureBaseDir(): Promise<void> {
    try {
      await fs.mkdir(this.baseDir, { recursive: true });
    } catch {
      // Directory already exists
    }
  }

  public async uploadPrivateFile(
    sellerId: string,
    documentType: string,
    originalFileName: string,
    _mimeType: string,
    dataBuffer: Buffer
  ): Promise<string> {
    await this.ensureBaseDir();

    // Sanitize and randomize filename to prevent path traversal or collisions
    const safeUUID = crypto.randomUUID();
    const sanitizedExt = path.extname(originalFileName).replace(/[^a-zA-Z0-9.]/g, '').toLowerCase() || '.bin';
    const storageKey = `sellers/${sellerId}/verification/${documentType.toLowerCase()}_${safeUUID}${sanitizedExt}`;

    const fullFilePath = path.join(this.baseDir, storageKey);
    await fs.mkdir(path.dirname(fullFilePath), { recursive: true });
    await fs.writeFile(fullFilePath, dataBuffer);

    logger.info(`[StorageService] Stored private document safely for seller ${sellerId}`, {
      documentType,
      storageKey,
      fileSizeBytes: dataBuffer.length,
    });

    return storageKey;
  }

  public async generatePresignedViewUrl(
    s3StorageKey: string,
    expiresInSeconds: number = 60
  ): Promise<PresignedUrlResult> {
    // Generate temporary HMAC signature for secure backend stream view
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const hmac = crypto.createHmac('sha256', env.JWT_ACCESS_SECRET);
    hmac.update(`${s3StorageKey}:${expiresAt}`);
    const token = hmac.digest('hex');

    const viewUrl = `${env.API_PREFIX}/identity/documents/stream?key=${encodeURIComponent(s3StorageKey)}&expires=${expiresAt}&token=${token}`;

    return {
      viewUrl,
      expiresInSeconds,
    };
  }

  public async getFileBuffer(s3StorageKey: string): Promise<{ buffer: Buffer; mimeType: string }> {
    const fullFilePath = path.join(this.baseDir, s3StorageKey);
    const buffer = await fs.readFile(fullFilePath);

    let mimeType = 'application/octet-stream';
    if (s3StorageKey.endsWith('.pdf')) mimeType = 'application/pdf';
    else if (s3StorageKey.endsWith('.jpg') || s3StorageKey.endsWith('.jpeg')) mimeType = 'image/jpeg';
    else if (s3StorageKey.endsWith('.png')) mimeType = 'image/png';

    return { buffer, mimeType };
  }
}

export const storageService: IStorageService = new LocalPrivateStorageService();
