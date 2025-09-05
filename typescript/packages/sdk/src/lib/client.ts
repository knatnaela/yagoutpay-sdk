import type { ApiRequestResult, ApiIntegrationResponse, BuiltRequest, TransactionDetails, YagoutPayClientConfig, YagoutPayClient, SendApiOptions } from '../types';
import { buildMerchantRequestPlain, buildApiMerchantRequestPlain } from './assemble';
import { aes256CbcDecrypt, aes256CbcEncrypt } from './crypto';
import { buildHashInput, generateSha256Hex, encryptHashHex } from './hash';
import { validateTransactionDetails } from './validate';
import { ACTION_URLS, API_URLS, API_DEFAULTS } from './constants';

// SendApiOptions is exported from types

/**
 * Build the full set of form fields and related debug fields for the WEB flow.
 */
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

export function createYagoutPay(config: YagoutPayClientConfig): YagoutPayClient {
  const actionUrl = config.actionUrlOverride ?? ACTION_URLS[config.environment ?? 'uat'];
  const apiUrl = API_URLS[config.environment ?? 'uat'];
  return {
    build(details: Omit<TransactionDetails, 'merchantId'>): BuiltRequest {
      return buildFormPayload({ ...details, merchantId: config.merchantId }, config.encryptionKey, actionUrl);
    },
    api: {
      async send(details: Omit<TransactionDetails, 'merchantId' | 'channel'>, options?: SendApiOptions): Promise<ApiRequestResult> {
        const finalDetails: TransactionDetails = {
          ...API_DEFAULTS,
          ...details,
          channel: 'API',
          merchantId: config.merchantId,
        } as TransactionDetails;
        return sendApiIntegration(finalDetails, config.encryptionKey, {
          endpoint: options?.endpoint ?? apiUrl,
          decryptResponse: options?.decryptResponse ?? true,
          fetchImpl: options?.fetchImpl,
        });
      },
    },
  };
}

export function buildApiRequestBody(details: TransactionDetails, encryptionKey: string): { merchantId: string; merchantRequest: string; merchantRequestPlain: string; hash?: string; hashHex?: string; hashInput?: string } {
  // Build API JSON payload
  const merchant_request_plain = buildApiMerchantRequestPlain({ ...details, channel: 'API' });
  const merchantRequest = aes256CbcEncrypt(merchant_request_plain, encryptionKey);
  return { merchantId: details.merchantId, merchantRequest, merchantRequestPlain: merchant_request_plain };
}



export async function sendApiIntegration(
  details: TransactionDetails,
  encryptionKey: string,
  options?: SendApiOptions
): Promise<ApiRequestResult> {
  const endpoint = options?.endpoint ?? API_URLS.uat;
  const decryptResponse = options?.decryptResponse ?? true;
  const fetchImpl = options?.fetchImpl ?? fetch;

  // Ensure API defaults while allowing overrides
  const withDefaults: TransactionDetails = {
    ...API_DEFAULTS,
    ...details,
  } as TransactionDetails;

  // Validate with API rules
  validateTransactionDetails(withDefaults);

  // Build request body
  const built = buildApiRequestBody(withDefaults, encryptionKey);

  const resp = await fetchImpl(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ merchantId: built.merchantId, merchantRequest: built.merchantRequest, hash: built.hash }),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`API request failed (${resp.status}): ${text || resp.statusText}`);
  }

  const json = (await resp.json()) as ApiIntegrationResponse;
  let decryptedResponse: string | undefined;
  if (decryptResponse && json.response) {
    try {
      decryptedResponse = aes256CbcDecrypt(json.response, encryptionKey);
    } catch {
      decryptedResponse = undefined;
    }
  }

  return { raw: json, decryptedResponse, endpoint };
}
