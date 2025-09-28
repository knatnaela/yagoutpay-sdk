export const ACTION_URLS = {
    uat: 'https://uatcheckout.yagoutpay.com/ms-transaction-core-1-0/paymentRedirection/checksumGatewayPage',
    prod: 'https://checkout.yagoutpay.com/ms-transaction-core-1-0/paymentRedirection/checksumGatewayPage',
} as const;

export const API_URLS = {
    uat: 'https://uatcheckout.yagoutpay.com/ms-transaction-core-1-0/apiRedirection/apiIntegration',
    prod: 'https://checkout.yagoutpay.com/ms-transaction-core-1-0/apiRedirection/apiIntegration',
} as const;

/** Payment Link endpoints */
export const PAYMENT_LINK_URLS = {
    /** Static Link API */
    uat: 'https://uatcheckout.yagoutpay.com/ms-transaction-core-1-0/sdk/staticQRPaymentResponse',
    prod: 'https://checkout.yagoutpay.com/ms-transaction-core-1-0/sdk/staticQRPaymentResponse',
} as const;

/** Dynamic Link (Payment By Link) endpoints */
export const PAYMENT_BY_LINK_URLS = {
    /** Payment Link / Link Payment API */
    uat: 'https://uatcheckout.yagoutpay.com/ms-transaction-core-1-0/sdk/paymentByLinkResponse',
    prod: 'https://checkout.yagoutpay.com/ms-transaction-core-1-0/sdk/paymentByLinkResponse',
} as const;

export const API_DEFAULTS = {
    pgId: '67ee846571e740418d688c3f',
    paymode: 'WA',
    schemeId: '7',
    walletType: 'telebirr',
} as const;

export type Environment = keyof typeof ACTION_URLS;

/**
 * Default pg options exposed to consumers for display/selection.
 * Consumers can render a picker and feed the chosen values into API calls.
 */
export const DEFAULT_PG_OPTIONS = [
    { id: 'telebirr-wa', label: 'Telebirr Wallet', pgId: '67ee846571e740418d688c3f', paymode: 'WA', schemeId: '7', walletType: 'telebirr' },
] as const;
