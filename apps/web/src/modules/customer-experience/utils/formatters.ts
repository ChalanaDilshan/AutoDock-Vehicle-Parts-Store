/**
 * Utility functions for currency and numerical formatting in AutoDock.
 * Stored strictly in integer minor units (cents) in the backend.
 */
export function formatLKR(priceInCents: number): string {
  if (typeof priceInCents !== 'number' || isNaN(priceInCents)) {
    return 'Rs. 0.00';
  }
  const rupees = priceInCents / 100;
  return `Rs. ${rupees.toLocaleString('en-LK', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function centsToRupees(priceInCents: number): number {
  if (typeof priceInCents !== 'number' || isNaN(priceInCents)) {
    return 0;
  }
  return Number((priceInCents / 100).toFixed(2));
}

export function rupeesToCents(rupees: number | string): number {
  const numericVal = typeof rupees === 'string' ? parseFloat(rupees) : rupees;
  if (isNaN(numericVal) || numericVal < 0) {
    return 0;
  }
  return Math.round(numericVal * 100);
}
