/**
 * AutoDock Notification Template Registry & HTML Sanitizer.
 * Enforces strict HTML escaping of user inputs and omission of credentials/private documents.
 */

export interface RenderedTemplate {
  subject: string;
  inAppTitle: string;
  inAppMessage: string;
  htmlBody: string;
  textBody: string;
}

export function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) return '';
  const s = String(str);
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function formatLkrCents(cents: number | null | undefined): string {
  const num = typeof cents === 'number' && !isNaN(cents) ? cents : 0;
  const rupees = (Math.max(0, num) / 100).toFixed(2);
  return `LKR ${rupees.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

export type TemplateRenderer = (data: Record<string, any>) => RenderedTemplate;

const registry: Record<string, { version: string; render: TemplateRenderer }> = {
  // --- MOD-01 Identity & Seller Verification Templates ---
  WELCOME_USER_ACCOUNT: {
    version: '1.0',
    render: (d) => ({
      subject: 'Welcome to AutoDock Sri Lanka',
      inAppTitle: 'Welcome to AutoDock',
      inAppMessage: `Welcome to AutoDock, ${escapeHtml(d.firstName || 'Customer')}! Explore genuine auto parts with island-wide delivery.`,
      htmlBody: `
        <h2>Welcome to AutoDock, ${escapeHtml(d.firstName)}!</h2>
        <p>Your AutoDock account is active. Discover verified vehicle spare parts across all 25 Sri Lankan districts.</p>
        <p><a href="${escapeHtml(d.loginUrl || 'http://localhost:5173/login')}">Log In to Your Account</a></p>
      `,
      textBody: `Welcome to AutoDock, ${d.firstName}! Your account is active. Log in at http://localhost:5173/login`,
    }),
  },

  SELLER_APPLICATION_RECEIVED: {
    version: '1.0',
    render: (d) => ({
      subject: `Seller Application Received: ${escapeHtml(d.businessName)}`,
      inAppTitle: 'Seller Application Under Review',
      inAppMessage: `Your merchant verification dossier for "${escapeHtml(d.businessName)}" has been received and is under review.`,
      htmlBody: `
        <h2>Merchant Verification In Progress</h2>
        <p>We received your seller registration for <strong>${escapeHtml(d.businessName)}</strong>.</p>
        <p>Our compliance team will review your business documents. You will receive an update within 1-2 business days.</p>
      `,
      textBody: `Your seller application for ${d.businessName} has been received and is under review.`,
    }),
  },

  SELLER_APPLICATION_APPROVED: {
    version: '1.0',
    render: (d) => ({
      subject: 'Congratulations! Your AutoDock Seller Account is Approved',
      inAppTitle: 'Seller Account Approved',
      inAppMessage: `Your store "${escapeHtml(d.businessName)}" is approved! You can now publish vehicle parts to the catalogue.`,
      htmlBody: `
        <h2>Seller Application Approved!</h2>
        <p>Dear ${escapeHtml(d.businessName)},</p>
        <p>Congratulations! Your merchant account has been approved by our administrators.</p>
        <p><a href="http://localhost:5173/seller/dashboard">Go to Seller Portal</a></p>
      `,
      textBody: `Congratulations! Your store ${d.businessName} is approved on AutoDock. Access your portal at http://localhost:5173/seller/dashboard`,
    }),
  },

  SELLER_APPLICATION_REJECTED: {
    version: '1.0',
    render: (d) => ({
      subject: 'AutoDock Seller Application Decision',
      inAppTitle: 'Seller Application Not Approved',
      inAppMessage: `Your seller application for "${escapeHtml(d.businessName)}" could not be approved. Reason: ${escapeHtml(d.reason || 'Verification criteria not met')}`,
      htmlBody: `
        <h2>Seller Application Update</h2>
        <p>We regret to inform you that your seller application for <strong>${escapeHtml(d.businessName)}</strong> could not be approved at this time.</p>
        <p><strong>Reason:</strong> ${escapeHtml(d.reason || 'Documentation did not meet criteria')}</p>
        <p>Please contact AutoDock support for guidance.</p>
      `,
      textBody: `Your seller application for ${d.businessName} was not approved. Reason: ${d.reason || 'Documentation did not meet criteria'}`,
    }),
  },

  SELLER_ADDITIONAL_INFO_REQUESTED: {
    version: '1.0',
    render: (d) => ({
      subject: 'Action Required: Additional Information Needed for Seller Verification',
      inAppTitle: 'Additional Information Required',
      inAppMessage: `Admin requested additional details for your store verification: ${escapeHtml(d.notes || 'Please review requested documents')}`,
      htmlBody: `
        <h2>Additional Information Required</h2>
        <p>Our review team requested additional information for <strong>${escapeHtml(d.businessName)}</strong>:</p>
        <blockquote>${escapeHtml(d.notes)}</blockquote>
        <p><a href="http://localhost:5173/seller/onboarding">Update Your Dossier</a></p>
      `,
      textBody: `Additional information needed for ${d.businessName}: ${d.notes}. Visit your onboarding portal to update.`,
    }),
  },

  SELLER_BANK_DETAILS_OUTCOME: {
    version: '1.0',
    render: (d) => ({
      subject: `Seller Bank Details Verification: ${d.decision === 'VERIFY' ? 'Verified' : 'Rejected'}`,
      inAppTitle: d.decision === 'VERIFY' ? 'Bank Details Verified' : 'Bank Details Rejected',
      inAppMessage: d.decision === 'VERIFY'
        ? `Your bank account (${escapeHtml(d.bankName)} ending in ${escapeHtml(d.maskedAccountNumber || '****')}) has been verified.`
        : `Your bank account details were rejected. Reason: ${escapeHtml(d.rejectionReason || 'Details mismatch')}`,
      htmlBody: `
        <h2>Bank Details Verification</h2>
        <p>Bank: <strong>${escapeHtml(d.bankName)}</strong></p>
        <p>Account: <strong>${escapeHtml(d.maskedAccountNumber || '****')}</strong></p>
        <p>Status: <strong>${d.decision === 'VERIFY' ? 'VERIFIED' : 'REJECTED'}</strong></p>
        ${d.rejectionReason ? `<p>Reason: ${escapeHtml(d.rejectionReason)}</p>` : ''}
      `,
      textBody: `Bank details for ${d.bankName} (${d.maskedAccountNumber}): ${d.decision === 'VERIFY' ? 'VERIFIED' : 'REJECTED'}.`,
    }),
  },

  // --- MOD-02 Product & Catalogue Templates ---
  SELLER_PRODUCT_MODERATION_NOTICE: {
    version: '1.0',
    render: (d) => ({
      subject: `Product Listing Moderation: ${escapeHtml(d.productTitle || 'Product')}`,
      inAppTitle: `Product ${d.action === 'SUSPEND' ? 'Suspended' : 'Activated'}`,
      inAppMessage: `Your listing "${escapeHtml(d.productTitle || 'Product')}" has been ${d.action === 'SUSPEND' ? 'suspended' : 'activated'} by platform administration.`,
      htmlBody: `
        <h2>Product Moderation Notice</h2>
        <p>Product: <strong>${escapeHtml(d.productTitle)}</strong></p>
        <p>Status: <strong>${d.action === 'SUSPEND' ? 'SUSPENDED' : 'ACTIVE'}</strong></p>
        ${d.reason ? `<p>Reason: ${escapeHtml(d.reason)}</p>` : ''}
      `,
      textBody: `Product ${d.productTitle} has been ${d.action === 'SUSPEND' ? 'suspended' : 'activated'}.`,
    }),
  },

  // --- MOD-03 Orders, Delivery & Payments Templates ---
  CUSTOMER_ORDER_CONFIRMATION: {
    version: '1.0',
    render: (d) => ({
      subject: `AutoDock Order Confirmed: ${escapeHtml(d.orderNumber)}`,
      inAppTitle: 'Order Confirmed',
      inAppMessage: `Your order ${escapeHtml(d.orderNumber)} for ${formatLkrCents(d.grandTotalInCents || 0)} has been placed successfully.`,
      htmlBody: `
        <h2>Thank You For Your Order!</h2>
        <p>Order Number: <strong>${escapeHtml(d.orderNumber)}</strong></p>
        <p>Total Amount: <strong>${formatLkrCents(d.grandTotalInCents || 0)}</strong></p>
        <p>Payment Method: <strong>${escapeHtml(d.paymentMethod)}</strong></p>
        <p><a href="http://localhost:5173/orders/${escapeHtml(d.orderId)}">View Order Status</a></p>
      `,
      textBody: `Order ${d.orderNumber} confirmed. Total: ${formatLkrCents(d.grandTotalInCents || 0)}. Track at http://localhost:5173/orders/${d.orderId}`,
    }),
  },

  SELLER_NEW_ORDER_ALERT: {
    version: '1.0',
    render: (d) => ({
      subject: `New Suborder Assigned: ${escapeHtml(d.suborderNumber)}`,
      inAppTitle: 'New Order Received',
      inAppMessage: `New suborder ${escapeHtml(d.suborderNumber)} received (${d.itemCount || 1} items). Total: ${formatLkrCents(d.totalPayableInCents || 0)}.`,
      htmlBody: `
        <h2>New Suborder Received</h2>
        <p>Suborder: <strong>${escapeHtml(d.suborderNumber)}</strong></p>
        <p>Items: <strong>${escapeHtml(d.itemCount)}</strong></p>
        <p>Total Payable: <strong>${formatLkrCents(d.totalPayableInCents || 0)}</strong></p>
        <p>Destination: <strong>${escapeHtml(d.shippingCity)}, ${escapeHtml(d.shippingDistrict)}</strong></p>
        <p><a href="http://localhost:5173/seller/orders/${escapeHtml(d.suborderId)}">Process Suborder</a></p>
      `,
      textBody: `New suborder ${d.suborderNumber} received. Destination: ${d.shippingCity}, ${d.shippingDistrict}. Total: ${formatLkrCents(d.totalPayableInCents || 0)}.`,
    }),
  },

  CUSTOMER_PAYMENT_VERIFIED: {
    version: '1.0',
    render: (d) => ({
      subject: `Payment Verified for Suborder ${escapeHtml(d.suborderNumber)}`,
      inAppTitle: 'Bank Payment Verified',
      inAppMessage: `Your bank deposit for suborder ${escapeHtml(d.suborderNumber)} has been approved by the merchant.`,
      htmlBody: `
        <h2>Payment Verified</h2>
        <p>Your bank transfer slip for suborder <strong>${escapeHtml(d.suborderNumber)}</strong> has been verified.</p>
        <p>The seller is now preparing your spare parts for dispatch.</p>
      `,
      textBody: `Bank payment verified for ${d.suborderNumber}. Seller is preparing dispatch.`,
    }),
  },

  CUSTOMER_PAYMENT_REJECTED: {
    version: '1.0',
    render: (d) => ({
      subject: `Action Required: Bank Payment Slip Rejected for Suborder ${escapeHtml(d.suborderNumber)}`,
      inAppTitle: 'Bank Slip Rejected',
      inAppMessage: `Your bank slip for suborder ${escapeHtml(d.suborderNumber)} was rejected. Reason: ${escapeHtml(d.rejectionReason || 'Unreadable or mismatched amount')}`,
      htmlBody: `
        <h2>Payment Slip Rejected</h2>
        <p>The bank deposit slip for suborder <strong>${escapeHtml(d.suborderNumber)}</strong> could not be verified.</p>
        <p><strong>Reason:</strong> ${escapeHtml(d.rejectionReason || 'Unreadable slip or incorrect deposited amount')}</p>
        <p>Please upload a valid bank deposit receipt promptly.</p>
      `,
      textBody: `Bank slip for ${d.suborderNumber} was rejected. Reason: ${d.rejectionReason}. Please re-upload.`,
    }),
  },

  CUSTOMER_ORDER_DISPATCHED: {
    version: '1.0',
    render: (d) => ({
      subject: `Suborder Dispatched: ${escapeHtml(d.suborderNumber)}`,
      inAppTitle: 'Suborder Dispatched',
      inAppMessage: `Your suborder ${escapeHtml(d.suborderNumber)} has been dispatched via ${escapeHtml(d.courierName || 'Courier')}. Tracking: ${escapeHtml(d.trackingNumber || 'Available in portal')}.`,
      htmlBody: `
        <h2>Your Parts Are On The Way!</h2>
        <p>Suborder: <strong>${escapeHtml(d.suborderNumber)}</strong></p>
        <p>Courier: <strong>${escapeHtml(d.courierName || 'Standard Delivery')}</strong></p>
        <p>Tracking Number: <strong>${escapeHtml(d.trackingNumber || 'N/A')}</strong></p>
      `,
      textBody: `Suborder ${d.suborderNumber} dispatched via ${d.courierName || 'Courier'}. Tracking: ${d.trackingNumber || 'N/A'}.`,
    }),
  },

  CUSTOMER_ORDER_DELIVERED: {
    version: '1.0',
    render: (d) => ({
      subject: `Suborder Delivered: ${escapeHtml(d.suborderNumber)}`,
      inAppTitle: 'Suborder Delivered',
      inAppMessage: `Your suborder ${escapeHtml(d.suborderNumber)} has been marked as delivered. You can now leave a verified review.`,
      htmlBody: `
        <h2>Package Delivered</h2>
        <p>Suborder <strong>${escapeHtml(d.suborderNumber)}</strong> was delivered.</p>
        <p>Thank you for shopping on AutoDock Sri Lanka.</p>
      `,
      textBody: `Suborder ${d.suborderNumber} was delivered.`,
    }),
  },

  // --- MOD-04 Finance Templates ---
  SELLER_MONTHLY_INVOICE_ISSUED: {
    version: '1.0',
    render: (d) => ({
      subject: `AutoDock Commission Invoice ${escapeHtml(d.invoiceNumber)} Issued for ${escapeHtml(d.billingPeriod)}`,
      inAppTitle: 'Monthly Commission Invoice Issued',
      inAppMessage: `Commission invoice ${escapeHtml(d.invoiceNumber)} for period ${escapeHtml(d.billingPeriod)} has been issued. Total due: ${formatLkrCents(d.grossCommissionInCents || 0)}.`,
      htmlBody: `
        <h2>Monthly Commission Invoice</h2>
        <p>Invoice Number: <strong>${escapeHtml(d.invoiceNumber)}</strong></p>
        <p>Billing Period: <strong>${escapeHtml(d.billingPeriod)}</strong></p>
        <p>Total Due: <strong>${formatLkrCents(d.grossCommissionInCents || 0)}</strong></p>
        <p>Payment Due Date: <strong>${escapeHtml(d.dueDate ? new Date(d.dueDate).toLocaleDateString() : 'In 14 Days')}</strong></p>
        <p><a href="http://localhost:5173/seller/invoices">View Invoice & Upload Bank Slip</a></p>
      `,
      textBody: `AutoDock invoice ${d.invoiceNumber} for ${d.billingPeriod} issued. Amount due: ${formatLkrCents(d.grossCommissionInCents || 0)}. Pay at http://localhost:5173/seller/invoices`,
    }),
  },

  SELLER_INVOICE_PAYMENT_APPROVED: {
    version: '1.0',
    render: (d) => ({
      subject: `Invoice Payment Verified: ${escapeHtml(d.invoiceNumber)}`,
      inAppTitle: 'Invoice Payment Approved',
      inAppMessage: `Your commission payment for invoice ${escapeHtml(d.invoiceNumber)} has been approved. Status: ${escapeHtml(d.newInvoiceStatus || 'PAID')}.`,
      htmlBody: `
        <h2>Invoice Payment Verified</h2>
        <p>Invoice: <strong>${escapeHtml(d.invoiceNumber)}</strong></p>
        <p>Verified Amount: <strong>${formatLkrCents(d.verifiedAmountInCents || 0)}</strong></p>
        <p>Status: <strong>${escapeHtml(d.newInvoiceStatus || 'PAID')}</strong></p>
      `,
      textBody: `Invoice payment for ${d.invoiceNumber} verified (${formatLkrCents(d.verifiedAmountInCents || 0)}). Status: ${d.newInvoiceStatus || 'PAID'}.`,
    }),
  },

  SELLER_INVOICE_PAYMENT_REJECTED: {
    version: '1.0',
    render: (d) => ({
      subject: `Action Required: Invoice Payment Slip Rejected (${escapeHtml(d.invoiceNumber)})`,
      inAppTitle: 'Invoice Payment Slip Rejected',
      inAppMessage: `Your payment receipt for invoice ${escapeHtml(d.invoiceNumber)} was rejected. Reason: ${escapeHtml(d.rejectionReason || 'Unverified receipt')}`,
      htmlBody: `
        <h2>Invoice Payment Slip Rejected</h2>
        <p>Invoice: <strong>${escapeHtml(d.invoiceNumber)}</strong></p>
        <p>Reason: <strong>${escapeHtml(d.rejectionReason || 'Receipt details could not be reconciled')}</strong></p>
        <p>Please upload a clear deposit receipt to keep your store active.</p>
      `,
      textBody: `Payment slip for invoice ${d.invoiceNumber} rejected: ${d.rejectionReason}. Please re-upload.`,
    }),
  },

  // --- Generic Fallback Template ---
  GENERIC_NOTIFICATION: {
    version: '1.0',
    render: (d) => ({
      subject: escapeHtml(d.subject || 'AutoDock Notification'),
      inAppTitle: escapeHtml(d.title || 'System Notification'),
      inAppMessage: escapeHtml(d.message || 'You have a new update.'),
      htmlBody: `<p>${escapeHtml(d.message || '')}</p>`,
      textBody: String(d.message || ''),
    }),
  },
};

export class TemplateRegistryService {
  public render(templateId: string, data: Record<string, any>): { version: string; rendered: RenderedTemplate } {
    const entry = registry[templateId] || registry.GENERIC_NOTIFICATION;
    return {
      version: entry.version,
      rendered: entry.render(data),
    };
  }

  public hasTemplate(templateId: string): boolean {
    return Boolean(registry[templateId]);
  }
}

export const templateRegistry = new TemplateRegistryService();
