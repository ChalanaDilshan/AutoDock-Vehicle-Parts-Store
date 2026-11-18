import crypto from 'crypto';
import path from 'path';
import fs from 'fs/promises';
import { env } from '../../../config/env.js';
import { logger } from '../../../shared/utils/logger.js';

export interface PresignedReceiptViewUrl {
  viewUrl: string;
  expiresInSeconds: number;
}

export class ReceiptStorageService {
  private baseDir: string;

  constructor() {
    this.baseDir = path.resolve(process.cwd(), 'storage', 'private', 'receipts');
  }

  private async ensureBaseDir(): Promise<void> {
    try {
      await fs.mkdir(this.baseDir, { recursive: true });
    } catch {
      // directory exists
    }
  }

  public async saveReceiptFile(
    suborderId: string,
    originalFileName: string,
    _mimeType: string,
    dataBuffer: Buffer
  ): Promise<string> {
    await this.ensureBaseDir();

    const safeUUID = crypto.randomUUID();
    const sanitizedExt =
      path.extname(originalFileName).replace(/[^a-zA-Z0-9.]/g, '').toLowerCase() || '.bin';
    const storageKey = `suborder_${suborderId}_${safeUUID}${sanitizedExt}`;

    const fullFilePath = path.join(this.baseDir, storageKey);
    await fs.mkdir(path.dirname(fullFilePath), { recursive: true });
    await fs.writeFile(fullFilePath, dataBuffer);

    logger.info(`[ReceiptStorageService] Stored payment receipt safely for suborder ${suborderId}`, {
      storageKey,
      fileSizeBytes: dataBuffer.length,
    });

    return storageKey;
  }

  public async generatePresignedViewUrl(
    storageKey: string,
    expiresInSeconds: number = 120
  ): Promise<PresignedReceiptViewUrl> {
    const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
    const hmac = crypto.createHmac('sha256', env.JWT_ACCESS_SECRET);
    hmac.update(`${storageKey}:${expiresAt}`);
    const token = hmac.digest('hex');

    const viewUrl = `${env.API_PREFIX}/orders/receipts/stream?key=${encodeURIComponent(
      storageKey
    )}&expires=${expiresAt}&token=${token}`;

    return {
      viewUrl,
      expiresInSeconds,
    };
  }

  public verifyStreamToken(storageKey: string, expiresAt: number, token: string): boolean {
    const now = Math.floor(Date.now() / 1000);
    if (now > expiresAt) {
      return false;
    }

    const hmac = crypto.createHmac('sha256', env.JWT_ACCESS_SECRET);
    hmac.update(`${storageKey}:${expiresAt}`);
    const expectedToken = hmac.digest('hex');

    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expectedToken));
  }

  public async getFileBuffer(storageKey: string): Promise<{ buffer: Buffer; mimeType: string }> {
    const fullFilePath = path.join(this.baseDir, storageKey);
    const buffer = await fs.readFile(fullFilePath);

    let mimeType = 'application/octet-stream';
    if (storageKey.endsWith('.pdf')) mimeType = 'application/pdf';
    else if (storageKey.endsWith('.jpg') || storageKey.endsWith('.jpeg')) mimeType = 'image/jpeg';
    else if (storageKey.endsWith('.png')) mimeType = 'image/png';
    else if (storageKey.endsWith('.webp')) mimeType = 'image/webp';

    return { buffer, mimeType };
  }
}

export const receiptStorageService = new ReceiptStorageService();
