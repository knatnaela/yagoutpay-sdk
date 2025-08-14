export type Channel = 'WEB' | 'MOBILE';

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
  customerEmail?: string;
  customerMobile?: string;
  isLoggedIn?: 'Y' | 'N';
};

export type BuiltRequest = {
  me_id: string;
  merchant_request: string; // base64 AES-256-CBC
  merchant_request_plain: string; // debug/plain
  hash_input: string;
  hash_hex: string;
  hash: string; // base64 AES-256-CBC
  actionUrl: string;
};

export type YagoutPayClientConfig = {
  merchantId: string;
  encryptionKey: string;
  environment?: 'uat' | 'prod';
  actionUrlOverride?: string;
};
