import crypto from 'crypto';
import type { TransactionDetails } from '../types';
import { aes256CbcEncrypt } from './crypto';

export function generateSha256Hex(input: string): string {
  return crypto.createHash('sha256').update(input, 'utf8').digest('hex');
}

export function buildHashInput(details: Pick<TransactionDetails, 'merchantId' | 'orderNumber' | 'amount' | 'country' | 'currency'>): string {
  return [
    details.merchantId,
    details.orderNumber,
    details.amount,
    details.country,
    details.currency,
  ].join('~');
}

export function encryptHashHex(hashHex: string, encryptionKey: string): string {
  return aes256CbcEncrypt(hashHex, encryptionKey);
}
