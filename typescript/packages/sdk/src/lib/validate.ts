import type { TransactionDetails } from '../types';

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

function isUrl(value: string): boolean {
  try {
    // Basic URL validation via URL constructor
    // eslint-disable-next-line no-new
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

export function validateTransactionDetails(details: TransactionDetails): void {
  const baseRequired: Array<[keyof TransactionDetails, string]> = [
    ['aggregatorId', 'aggregatorId'],
    ['merchantId', 'merchantId'],
    ['orderNumber', 'orderNumber'],
    ['amount', 'amount'],
    ['country', 'country'],
    ['currency', 'currency'],
    ['transactionType', 'transactionType'],
    ['channel', 'channel'],
  ];
  const webMobileExtras: Array<[keyof TransactionDetails, string]> = [
    ['successUrl', 'successUrl'],
    ['failureUrl', 'failureUrl'],
  ];
  const apiExtras: Array<[keyof TransactionDetails, string]> = [
    ['customerMobile', 'customerMobile'],
    ['pgId', 'pgId'],
    ['paymode', 'paymode'],
    ['schemeId', 'schemeId'],
    ['walletType', 'walletType'],
  ];

  const required: Array<[keyof TransactionDetails, string]> = [
    ...baseRequired,
    ...(['WEB', 'MOBILE'].includes(details.channel) ? webMobileExtras : []),
    ...(details.channel === 'API' ? apiExtras : []),
  ];

  for (const [key, label] of required) {
    const val = details[key];
    if (val == null || String(val).length === 0) {
      throw new ValidationError(`${label} is required`);
    }
  }

  if (!/^\d+(?:\.\d{1,2})?$/.test(details.amount)) {
    throw new ValidationError('amount must be a numeric string with up to 2 decimals');
  }

  if (!/^[A-Z]{3}$/.test(details.country)) {
    throw new ValidationError('country must be a 3-letter uppercase code');
  }

  if (!/^[A-Z]{3}$/.test(details.currency)) {
    throw new ValidationError('currency must be a 3-letter uppercase code');
  }

  if (!['SALE'].includes(details.transactionType)) {
    throw new ValidationError('transactionType must be one of: SALE');
  }

  if (!['WEB', 'MOBILE', 'API'].includes(details.channel)) {
    throw new ValidationError('channel must be WEB, MOBILE or API');
  }

  // For API channel, success/failure URLs may be empty; for WEB/MOBILE validate URLs
  if (['WEB', 'MOBILE'].includes(details.channel)) {
    if (!isUrl(details.successUrl)) {
      throw new ValidationError('successUrl must be a valid URL');
    }
    if (!isUrl(details.failureUrl)) {
      throw new ValidationError('failureUrl must be a valid URL');
    }
  }
}

