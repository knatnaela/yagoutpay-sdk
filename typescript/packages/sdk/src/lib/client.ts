import type { ApiRequestResult, ApiIntegrationResponse, BuiltRequest, TransactionDetails, YagoutPayClientConfig, YagoutPayClient, SendApiOptions, PaymentLinkPlain, PaymentLinkResult, PaymentLinkEncodedBody, PaymentByLinkPlain } from '../types';
import { buildMerchantRequestPlain, buildApiMerchantRequestPlain } from './assemble';
import { aes256CbcDecrypt, aes256CbcEncrypt } from './crypto';
import { buildHashInput, generateSha256Hex, encryptHashHex } from './hash';
import { validateTransactionDetails } from './validate';
import { ACTION_URLS, API_URLS, API_DEFAULTS, PAYMENT_LINK_URLS, PAYMENT_BY_LINK_URLS } from './constants';

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

/** Build Payment Link encoded body from plain payload using AES function. */
export function buildPaymentLinkBody(plain: PaymentLinkPlain, encryptionKey: string): PaymentLinkEncodedBody {
  const defaults: PaymentLinkPlain = {
    ag_id: '', ag_code: '', ag_name: '',
    req_user_id: '', me_code: '', me_name: '',
    qr_code_id: '', brandName: '', qr_name: '',
    status: '', storeName: '', store_id: '', token: '',
    qr_transaction_amount: '', logo: '', store_email: '', mobile_no: '',
    udf: '', udfmerchant: '', file_name: '', from_date: '', to_date: '',
    file_extn: '', file_url: '', file: '', original_file_name: '',
    successURL: '', failureURL: '', addAll: '', source: '',
  };
  const filled = { ...defaults, ...plain } as PaymentLinkPlain;
  const merchantRequestPlain = JSON.stringify(filled);
  console.log(merchantRequestPlain);
  const merchantRequest = aes256CbcEncrypt(merchantRequestPlain, encryptionKey);
  return { request: merchantRequest };
}

/** Build Payment By Link encoded body from plain payload using AES function. */
export function buildPaymentByLinkBody(plain: PaymentByLinkPlain, encryptionKey: string): PaymentLinkEncodedBody {
  const defaults: PaymentByLinkPlain = {
    req_user_id: '', me_id: '', amount: '', order_id: '', product: '',
    customer_email: '', mobile_no: '', expiry_date: '', media_type: [],
    first_name: '', last_name: '', dial_code: '', failure_url: '', success_url: '',
    country: '', currency: '',
  };
  const filled = { ...defaults, ...plain } as PaymentByLinkPlain;
  const requestPlain = JSON.stringify(filled);
  console.log(requestPlain);
  const request = aes256CbcEncrypt(requestPlain, encryptionKey);
  return { request };
}

/**
 * Send Payment Link request (static or dynamic) to the gateway.
 * Adds required header `me_id` and encrypts body using the same AES function.
 */
export async function sendPaymentLink(
  plain: PaymentLinkPlain,
  encryptionKey: string,
  opts?: { environment?: 'uat' | 'prod'; endpointOverride?: string; useDynamicEndpoint?: boolean; fetchImpl?: typeof fetch }
): Promise<PaymentLinkResult> {
  const environment = opts?.environment ?? 'uat';
  const endpoint = opts?.endpointOverride ?? (opts?.useDynamicEndpoint ? PAYMENT_BY_LINK_URLS[environment] : PAYMENT_LINK_URLS[environment]);
  const merchantRequest = buildPaymentLinkBody(plain, encryptionKey);
  const fetchImpl = opts?.fetchImpl ?? fetch;

  console.log(merchantRequest);

  const resp = await fetchImpl(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      // Gateway expects merchant id in header as me_id; align to me_code field in schema
      'me_id': plain.me_code,
    },
    body: JSON.stringify(merchantRequest),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Payment Link request failed (${resp.status}): ${text || resp.statusText}`);
  }

  // Read body as text first to support non-JSON responses
  const bodyText = await resp.text().catch(() => '');
  let raw: unknown = bodyText;
  let json: any | undefined;
  try { json = bodyText ? JSON.parse(bodyText) : undefined; } catch { json = undefined; }
  if (json !== undefined) raw = json;

  // Try to decrypt known fields or entire body if it's a string
  let decryptedResponse: string | undefined;
  try {
    const candidate = (json && (json.response || json.data || json.payload || json.responseData)) ?? (typeof raw === 'string' ? raw : undefined);
    const enc = typeof candidate === 'string' ? candidate : undefined;
    if (enc) {
      decryptedResponse = aes256CbcDecrypt(enc, encryptionKey);
    }
  } catch {
    decryptedResponse = undefined;
  }

  return { endpoint, raw, decryptedResponse };
}

/** Send Payment By Link (dynamic) request to the gateway. */
export async function sendPaymentByLink(
  plain: PaymentByLinkPlain,
  encryptionKey: string,
  opts?: { environment?: 'uat' | 'prod'; endpointOverride?: string; fetchImpl?: typeof fetch }
): Promise<PaymentLinkResult> {
  const environment = opts?.environment ?? 'uat';
  const endpoint = opts?.endpointOverride ?? PAYMENT_BY_LINK_URLS[environment];
  const body = buildPaymentByLinkBody(plain, encryptionKey);
  const fetchImpl = opts?.fetchImpl ?? fetch;

  const resp = await fetchImpl(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'me_id': plain.me_id,
    },
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const text = await resp.text().catch(() => '');
    throw new Error(`Payment By Link request failed (${resp.status}): ${text || resp.statusText}`);
  }

  // Read body as text first to support non-JSON responses
  const bodyText = await resp.text().catch(() => '');
  let raw: unknown = bodyText;
  let json: any | undefined;
  try { json = bodyText ? JSON.parse(bodyText) : undefined; } catch { json = undefined; }
  if (json !== undefined) raw = json;
  let decryptedResponse: string | undefined;
  try {
    const candidate = (json && (json.response || json.data || json.payload || json.responseData)) ?? (typeof raw === 'string' ? raw : undefined);
    const enc = typeof candidate === 'string' ? candidate : undefined;
    if (enc) {
      decryptedResponse = aes256CbcDecrypt(enc, encryptionKey);
    }
  } catch {
    decryptedResponse = undefined;
  }
  return { endpoint, raw, decryptedResponse };
}

export type PaymentLinkClient = {
  /** Send a static payment link using default payload with optional overrides. */
  sendStatic: (overrides?: Partial<PaymentLinkPlain> & { req_user_id?: string }) => Promise<PaymentLinkResult>;
  /** Send a dynamic payment link providing all fields (me_id filled from config). */
  sendDynamic: (plain: Omit<PaymentLinkPlain, 'me_code'>) => Promise<PaymentLinkResult>;
  /** Build encoded body (AES) from plain. */
  buildBody: (plain: PaymentLinkPlain) => PaymentLinkEncodedBody;
};

/** Factory for Payment Link operations (static and dynamic). */
export function createPaymentLinkClient(config: {
  merchantId: string;
  encryptionKey: string;
  environment?: 'uat' | 'prod';
  reqUserId?: string;
  /** Base payload used for static link (amount, currency, product, urls, etc). */
  staticDefaults?: Partial<Omit<PaymentLinkPlain, 'me_code'>>;
}): PaymentLinkClient {
  const environment = config.environment ?? 'uat';
  const reqUserId = config.reqUserId ?? "yagou381";
  return {
    async sendStatic(overrides) {
      const plain: PaymentLinkPlain = {
        req_user_id: overrides?.req_user_id ?? reqUserId,
        qr_transaction_amount: String((config.staticDefaults?.qr_transaction_amount ?? '1')),
        brandName: config.staticDefaults?.brandName,
        successURL: config.staticDefaults?.successURL,
        failureURL: config.staticDefaults?.failureURL,
        ...config.staticDefaults,
        ...overrides,
        me_code: config.merchantId,
      } as PaymentLinkPlain;
      return sendPaymentLink(plain, config.encryptionKey, { environment });
    },
    async sendDynamic(plainNoMeId) {
      const plain = { ...plainNoMeId, me_code: config.merchantId } as PaymentLinkPlain;
      if (!plain.req_user_id) plain.req_user_id = reqUserId;
      return sendPaymentLink(plain, config.encryptionKey, { environment });
    },
    buildBody(plain) {
      return buildPaymentLinkBody(plain, config.encryptionKey);
    },
  };
}
