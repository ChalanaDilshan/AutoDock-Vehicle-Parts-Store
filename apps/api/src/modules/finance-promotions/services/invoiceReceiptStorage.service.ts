import crypto from 'crypto';
import path from 'path';
import fs from 'fs/promises';
import { logger } from '../../../shared/utils/logger.js';
import { AppError } from '../../../shared/middleware/errorHandler.js';

export class InvoiceReceiptStorageService {
  private baseDir: string;

  constructor() {
    this.baseDir = path.resolve(process.cwd(), 'storage', 'private', 'receipts');
  }

  private async ensureBaseDir(): Promise<void> {
    try {
      await fs.mkdir(this.baseDir, { recursive: true });
    } catch {
      // Directory exists or created
    }
  }

  public async saveReceipt(
    invoiceId: string,
    originalFileName: string,
    mimeType: string,
    fileBuffer: Buffer
  ): Promise<{ storageKey: string; fileSizeBytes: number }> {
    await this.ensureBaseDir();

    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedMimes.includes(mimeType)) {
      throw new AppError('Invalid file type. Allowed: JPEG, PNG, WebP, PDF', 400, 'INVALID_FILE_TYPE');
    }

    if (fileBuffer.length > 5 * 1024 * 1024) {
      throw new AppError('File size exceeds 5MB limit', 400, 'FILE_TOO_LARGE');
    }

    const safeUUID = crypto.randomUUID();
    const sanitizedExt =
      path.extname(originalFileName).replace(/[^a-zA-Z0-9.]/g, '').toLowerCase() || '.bin';
    const storageKey = `invoice_${invoiceId}_${safeUUID}${sanitizedExt}`;

    const fullFilePath = path.join(this.baseDir, storageKey);
    await fs.mkdir(path.dirname(fullFilePath), { recursive: true });
    await fs.writeFile(fullFilePath, fileBuffer);

    logger.info(`[InvoiceReceiptStorageService] Saved private invoice receipt`, {
      invoiceId,
      storageKey,
      fileSizeBytes: fileBuffer.length,
    });

    return {
      storageKey,
      fileSizeBytes: fileBuffer.length,
    };
  }

  public async getFileBuffer(storageKey: string): Promise<{ buffer: Buffer; mimeType: string }> {
    const fullFilePath = path.join(this.baseDir, storageKey);
    try {
      const buffer = await fs.readFile(fullFilePath);

      let mimeType = 'application/octet-stream';
      if (storageKey.endsWith('.pdf')) mimeType = 'application/pdf';
      else if (storageKey.endsWith('.jpg') || storageKey.endsWith('.jpeg')) mimeType = 'image/jpeg';
      else if (storageKey.endsWith('.png')) mimeType = 'image/png';
      else if (storageKey.endsWith('.webp')) mimeType = 'image/webp';

      return { buffer, mimeType };
    } catch {
      throw new AppError('Receipt file not found on disk', 404, 'RECEIPT_FILE_NOT_FOUND');
    }
  }
}

export const invoiceReceiptStorageService = new InvoiceReceiptStorageService();
