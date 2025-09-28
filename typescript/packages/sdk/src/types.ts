/** Channel of initiation. */
export type Channel = 'WEB' | 'MOBILE' | 'API';

/**
 * Canonical transaction input used to build both WEB form and API payloads.
 */
export type TransactionDetails = {
  aggregatorId: string; // ag_id
  merchantId: string; // me_id
  orderNumber: string; // order_no
  amount: string; // numeric string, use integer if required by spec
  country: string; // e.g. ETH
  currency: string; // e.g. ETB
  transactionType: string; // e.g. SALE
  successUrl: string;
  failureUrl: string;
  channel: Channel;
  customerEmail?: string; // emailId
  customerMobile?: string; // mobileNumber (required for API)
  isLoggedIn?: 'Y' | 'N';

  // Optional: pg_details (API requires these; can be hardcoded defaults)
  pgId?: string; // pg_Id
  paymode?: string; // e.g. WA
  schemeId?: string; // scheme_Id
  walletType?: string; // wallet_type

  // Optional: card_details
  cardNumber?: string;
  expiryMonth?: string;
  expiryYear?: string;
  cvv?: string;
  cardName?: string;

  // Optional: cust_details (extended)
  customerName?: string;
  uniqueId?: string;

  // Optional: bill_details
  billAddress?: string;
  billCity?: string;
  billState?: string;
  billCountry?: string;
  billZip?: string;

  // Optional: ship_details
  shipAddress?: string;
  shipCity?: string;
  shipState?: string;
  shipCountry?: string;
  shipZip?: string;
  shipDays?: string;
  addressCount?: string;

  // Optional: item_details
  itemCount?: string;
  itemValue?: string;
  itemCategory?: string;

  // Optional: udf_details (limit 5 per current format)
  udf1?: string;
  udf2?: string;
  udf3?: string;
  udf4?: string;
  udf5?: string;
  // API other_details allows up to 7 UDFs
  udf6?: string;
  udf7?: string;
};

/**
 * Fully built WEB form payload and related debug fields.
 */
export type BuiltRequest = {
  me_id: string;
  merchant_request: string; // base64 AES-256-CBC
  merchant_request_plain: string; // debug/plain
  hash_input: string;
  hash_hex: string;
  hash: string; // base64 AES-256-CBC
  actionUrl: string;
};

/**
 * Factory configuration for creating a YagoutPay client instance.
 */
export type YagoutPayClientConfig = {
  merchantId: string;
  encryptionKey: string;
  environment?: 'uat' | 'prod';
  actionUrlOverride?: string;
};

/**
 * Raw response shape from the API integration endpoint.
 */
export type ApiIntegrationResponse = {
  merchantId: string;
  status: string; // e.g. Success / Failed
  statusMessage: string;
  response?: string; // base64 AES-256-CBC
};

/**
 * Structured result returned by the SDK for API requests.
 */
export type ApiRequestResult = {
  raw: ApiIntegrationResponse;
  decryptedResponse?: string; // present if decryption attempted and succeeded
  endpoint: string;
};

/**
 * Payment Link request payload (plain before encryption).
 * Updated to align with gateway static/dynamic QR payment link schema.
 */
export type PaymentLinkPlain = {
  ag_id?: string;
  ag_code?: string;
  ag_name?: string;
  req_user_id: string;
  me_code: string;
  me_name?: string;
  qr_code_id?: string;
  brandName?: string;
  qr_name?: string;
  status?: string; // e.g. ACTIVE
  storeName?: string;
  store_id?: string;
  token?: string;
  qr_transaction_amount: string;
  logo?: string;
  store_email?: string;
  mobile_no?: string;
  udf?: string;
  udfmerchant?: string;
  file_name?: string;
  from_date?: string;
  to_date?: string;
  file_extn?: string;
  file_url?: string;
  file?: string;
  original_file_name?: string;
  successURL?: string;
  failureURL?: string;
  addAll?: string;
  source?: string;
};

/** Encoded request body for Payment Link API. */
export type PaymentLinkEncodedBody = {
  request: string; // base64 AES-256-CBC of JSON.stringify(PaymentLinkPlain)
};

/** Unified result for Payment Link API invocation. */
export type PaymentLinkResult = {
  endpoint: string;
  raw: unknown; // raw JSON from gateway
  decryptedResponse?: string; // if response contains enc payload and decryption succeeds
};

/**
 * Dynamic Link (Payment By Link) plain payload per documentation.
 */
export type PaymentByLinkPlain = {
  req_user_id: string;
  me_id: string;
  amount: string;
  customer_email?: string;
  mobile_no?: string;
  expiry_date?: string; // YYYY-MM-DD
  media_type?: string[]; // e.g. ["API"]
  order_id: string;
  first_name?: string;
  last_name?: string;
  product: string;
  dial_code?: string; // e.g. +251
  failure_url?: string;
  success_url?: string;
  country?: string; // ETH
  currency?: string; // ETB
};

/** Options for API calls made via the SDK. */
export type SendApiOptions = {
  endpoint?: string;
  decryptResponse?: boolean;
  fetchImpl?: typeof fetch;
};

/**
 * Public client interface returned by createYagoutPay.
 */
export interface YagoutPayClient {
  build(details: Omit<TransactionDetails, 'merchantId'>): BuiltRequest;
  api: {
    send(details: Omit<TransactionDetails, 'merchantId' | 'channel'>, options?: SendApiOptions): Promise<ApiRequestResult>;
  };
}

/**
 * pg_details structure for configuring payment options.
 */
export type PgDetails = Pick<TransactionDetails, 'pgId' | 'paymode' | 'schemeId' | 'walletType'>;

/**
 * A selectable payment option with a human-friendly label and pg_details.
 */
export type PgOption = PgDetails & { id: string; label: string };
