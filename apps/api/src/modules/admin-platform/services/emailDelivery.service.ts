import { env } from '../../../config/env.js';
import { logger } from '../../../shared/utils/logger.js';
import { INotificationDelivery } from '../models/notificationDelivery.model.js';

export interface EmailOptions {
  to: string;
  from?: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey?: string;
  headers?: Record<string, string>;
}

export interface EmailSendResult {
  accepted: boolean;
  messageId: string;
  provider: string;
  response: string;
}

export interface IEmailTransport {
  sendMail(options: EmailOptions): Promise<EmailSendResult>;
}

/**
 * Mock Email Transport: Used in tests and development environments.
 * Stores dispatches in an in-memory queue for assertions without external network dependencies.
 */
export class MockEmailTransport implements IEmailTransport {
  private sentEmails: Array<EmailOptions & { sentAt: Date; messageId: string }> = [];

  public async sendMail(options: EmailOptions): Promise<EmailSendResult> {
    const messageId = `<mock-${Date.now()}-${Math.random().toString(36).substring(2, 9)}@autodock.lk>`;
    const record = {
      ...options,
      sentAt: new Date(),
      messageId,
    };
    this.sentEmails.push(record);

    logger.info(`[EmailDelivery:Mock] Email accepted for delivery to ${options.to}`, {
      messageId,
      subject: options.subject,
    });

    return {
      accepted: true,
      messageId,
      provider: 'mock',
      response: '250 Mock Message Accepted',
    };
  }

  public getSentEmails(): Array<EmailOptions & { sentAt: Date; messageId: string }> {
    return [...this.sentEmails];
  }

  public clear(): void {
    this.sentEmails = [];
  }
}

/**
 * Provider-Neutral Email Delivery Service.
 * Implements bounded retry tracking, idempotency enforcement, and provider outcome recording.
 */
export class EmailDeliveryService {
  private transport: IEmailTransport;

  constructor(customTransport?: IEmailTransport) {
    if (customTransport) {
      this.transport = customTransport;
    } else {
      // Default to Mock transport for safe development and testing
      this.transport = new MockEmailTransport();
    }
  }

  /**
   * Sets a custom transport implementation (e.g. For integration tests or live SMTP).
   */
  public setTransport(transport: IEmailTransport): void {
    this.transport = transport;
  }

  public getTransport(): IEmailTransport {
    return this.transport;
  }

  /**
   * Calculates next exponential backoff timestamp: 2^attempt * 60s
   */
  public calculateNextAttempt(attemptCount: number): Date {
    const delayMs = Math.min(Math.pow(2, attemptCount) * 60 * 1000, 3600 * 1000); // Max 1 hour
    return new Date(Date.now() + delayMs);
  }

  /**
   * Dispatches an email through the active transport and updates the delivery record.
   * STRICT INVARIANT: Records status as SENT (accepted by transport); never claims DELIVERED without external webhook.
   */
  public async dispatchDeliveryRecord(delivery: INotificationDelivery, options: EmailOptions): Promise<boolean> {
    if (env.EMAIL_PROVIDER === 'disabled') {
      delivery.status = 'CANCELLED';
      delivery.lastErrorMessage = 'Email delivery is globally disabled in configuration';
      await delivery.save();
      return false;
    }

    try {
      delivery.attemptCount += 1;
      delivery.lastAttemptAt = new Date();
      delivery.status = 'PROCESSING';
      await delivery.save();
    } catch (_err) {
      return false;
    }

    try {
      const result = await this.transport.sendMail({
        ...options,
        from: options.from || env.EMAIL_FROM,
        headers: {
          'X-AutoDock-Idempotency-Key': delivery.idempotencyKey,
          'X-AutoDock-Template': `${delivery.templateId}:${delivery.templateVersion}`,
          ...options.headers,
        },
      });

      if (result.accepted) {
        delivery.status = 'SENT';
        delivery.providerMessageId = result.messageId;
        delivery.providerResponse = {
          provider: result.provider,
          response: result.response,
        };
        delivery.nextAttemptAt = null;
        delivery.lastErrorCode = null;
        delivery.lastErrorMessage = null;
        await delivery.save().catch(() => {});
        return true;
      } else {
        throw new Error(`Transport rejected message: ${result.response}`);
      }
    } catch (err: any) {
      logger.warn(`[EmailDeliveryService] Dispatch attempt ${delivery.attemptCount} failed for ${delivery.recipientAddress}: ${err.message}`);

      if (delivery.attemptCount >= delivery.maxAttempts) {
        delivery.status = 'FAILED';
        delivery.nextAttemptAt = null;
      } else {
        delivery.status = 'RETRYING';
        delivery.nextAttemptAt = this.calculateNextAttempt(delivery.attemptCount);
      }

      delivery.lastErrorCode = err.code || 'TRANSPORT_ERROR';
      delivery.lastErrorMessage = err.message || 'Unknown email transport failure';
      await delivery.save().catch(() => {});
      return false;
    }
  }
}

export const emailDeliveryService = new EmailDeliveryService();
