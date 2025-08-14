import type { BuiltRequest, TransactionDetails, YagoutPayClientConfig } from '../types';
import { buildMerchantRequestPlain } from './assemble';
import { aes256CbcEncrypt } from './crypto';
import { buildHashInput, generateSha256Hex, encryptHashHex } from './hash';
import { validateTransactionDetails } from './validate';

const ACTION_URLS = {
  uat: 'https://uatcheckout.yagoutpay.com/ms-transaction-core-1-0/paymentRedirection/checksumGatewayPage',
  prod: 'https://checkout.yagoutpay.com/ms-transaction-core-1-0/paymentRedirection/checksumGatewayPage',
} as const;

export function buildFormPayload(details: TransactionDetails, encryptionKey: string, actionUrl?: string): BuiltRequest {
  validateTransactionDetails(details);
  const merchant_request_plain = buildMerchantRequestPlain(details);
  const merchant_request = aes256CbcEncrypt(merchant_request_plain, encryptionKey);
  const hash_input = buildHashInput(details);
  const hash_hex = generateSha256Hex(hash_input);
  const hash = encryptHashHex(hash_hex, encryptionKey);
  return {
    me_id: details.merchantId,
    merchant_request,
    merchant_request_plain,
    hash_input,
    hash_hex,
    hash,
    actionUrl: actionUrl ?? ACTION_URLS.uat,
  };
}

export function createYagoutPay(config: YagoutPayClientConfig) {
  const actionUrl = config.actionUrlOverride ?? ACTION_URLS[config.environment ?? 'uat'];
  return {
    build(details: Omit<TransactionDetails, 'merchantId'>): BuiltRequest {
      return buildFormPayload({ ...details, merchantId: config.merchantId }, config.encryptionKey, actionUrl);
    },
  };
}
