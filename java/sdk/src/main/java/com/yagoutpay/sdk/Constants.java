package com.yagoutpay.sdk;

/** Environment endpoints and defaults used by the SDK. */
public final class Constants {
    private Constants() {
    }

    /** Supported environments. */
    public enum Environment {
        UAT, PROD
    }

    /** Hosted form action URL for the given environment. */
    public static String actionUrl(Environment env) {
        return env == Environment.PROD
                ? "https://checkout.yagoutpay.com/ms-transaction-core-1-0/paymentRedirection/checksumGatewayPage"
                : "https://uatcheckout.yagoutpay.com/ms-transaction-core-1-0/paymentRedirection/checksumGatewayPage";
    }

    /** Direct API URL for the given environment. */
    public static String apiUrl(Environment env) {
        return env == Environment.PROD
                ? "https://checkout.yagoutpay.com/ms-transaction-core-1-0/apiRedirection/apiIntegration"
                : "https://uatcheckout.yagoutpay.com/ms-transaction-core-1-0/apiRedirection/apiIntegration";
    }

    /** Static Payment Link endpoint for the given environment. */
    public static String paymentLinkUrl(Environment env) {
        return env == Environment.PROD
                ? "https://checkout.yagoutpay.com/ms-transaction-core-1-0/sdk/staticQRPaymentResponse"
                : "https://uatcheckout.yagoutpay.com/ms-transaction-core-1-0/sdk/staticQRPaymentResponse";
    }

    /** Dynamic Payment By Link endpoint for the given environment. */
    public static String paymentByLinkUrl(Environment env) {
        return env == Environment.PROD
                ? "https://checkout.yagoutpay.com/ms-transaction-core-1-0/sdk/paymentByLinkResponse"
                : "https://uatcheckout.yagoutpay.com/ms-transaction-core-1-0/sdk/paymentByLinkResponse";
    }

    /** Default pg_details used for API flow. */
    public static final class ApiDefaults {
        public static final String PG_ID = "67ee846571e740418d688c3f";
        public static final String PAYMODE = "WA";
        public static final String SCHEME_ID = "7";
        public static final String WALLET_TYPE = "telebirr";

        private ApiDefaults() {
        }
    }
}
