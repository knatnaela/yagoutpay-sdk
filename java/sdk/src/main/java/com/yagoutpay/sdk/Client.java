package com.yagoutpay.sdk;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;

/**
 * YagoutPay client for building hosted form payloads and sending API requests.
 */
public final class Client {
    private final String merchantId;
    private final String encryptionKey;
    private final Constants.Environment environment;
    private final String actionUrlOverride;
    private final HttpClient http;

    private static final ObjectMapper OM = new ObjectMapper();

    /** Configuration for {@link Client}. */
    public static final class Config {
        public String merchantId;
        public String encryptionKey;
        public Constants.Environment environment = Constants.Environment.UAT;
        public String actionUrlOverride;
        public boolean allowInsecureTls = false;
    }

    /** Create a client with the provided configuration. */
    public Client(Config cfg) {
        this.merchantId = cfg.merchantId;
        this.encryptionKey = cfg.encryptionKey;
        this.environment = cfg.environment == null ? Constants.Environment.UAT : cfg.environment;
        this.actionUrlOverride = cfg.actionUrlOverride;
        this.http = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(20))
                .version(HttpClient.Version.HTTP_2)
                .build();
    }

    /** Build the hosted form fields and related debug values. */
    public Types.BuiltRequest build(Types.TransactionDetails details) {
        String actionUrl = actionUrlOverride != null ? actionUrlOverride : Constants.actionUrl(environment);
        String plain = Assemble.buildMerchantRequestPlain(details);
        String merchantReq = Crypto.aes256CbcEncrypt(plain, encryptionKey);
        String hashInput = Hashing.buildHashInput(details);
        String hashHex = Hashing.sha256Hex(hashInput);
        String hash = Crypto.aes256CbcEncrypt(hashHex, encryptionKey);
        return new Types.BuiltRequest(details.merchantId, plain, merchantReq, hashInput, hashHex, hash, actionUrl);
    }

    /**
     * Send a direct API request. If {@code endpoint} is null, the environment
     * default is used.
     * When {@code decryptResponse} is true, the SDK attempts to decrypt the
     * response payload.
     */
    public Types.ApiRequestResult sendApi(Types.TransactionDetails details, String endpoint, boolean decryptResponse)
            throws Exception {
        String api = endpoint != null ? endpoint : Constants.apiUrl(environment);
        Types.TransactionDetails withDefaults = Types.TransactionDetails.builder()
                .aggregatorId(details.aggregatorId)
                .merchantId(merchantId)
                .orderNumber(details.orderNumber)
                .amount(details.amount)
                .country(details.country)
                .currency(details.currency)
                .transactionType(details.transactionType)
                .successUrl("")
                .failureUrl("")
                .channel("API")
                .customerEmail(details.customerEmail)
                .customerMobile(details.customerMobile)
                .pgId(details.pgId != null ? details.pgId : Constants.ApiDefaults.PG_ID)
                .paymode(details.paymode != null ? details.paymode : Constants.ApiDefaults.PAYMODE)
                .schemeId(details.schemeId != null ? details.schemeId : Constants.ApiDefaults.SCHEME_ID)
                .walletType(details.walletType != null ? details.walletType : Constants.ApiDefaults.WALLET_TYPE)
                .build();

        String plain = Assemble.buildApiMerchantRequestPlain(withDefaults);
        String merchantRequest = Crypto.aes256CbcEncrypt(plain, encryptionKey);

        String body = OM.writeValueAsString(Map.of(
                "merchantId", merchantId,
                "merchantRequest", merchantRequest));

        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(api))
                .timeout(Duration.ofSeconds(30))
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(body))
                .build();

        HttpResponse<String> resp = http.send(req, HttpResponse.BodyHandlers.ofString());
        if (resp.statusCode() < 200 || resp.statusCode() >= 300) {
            throw new RuntimeException("API request failed (" + resp.statusCode() + "): " + resp.body());
        }

        Types.ApiIntegrationResponse raw = OM.readValue(resp.body(), Types.ApiIntegrationResponse.class);
        String decrypted = null;
        if (decryptResponse && raw.response != null && !raw.response.isEmpty()) {
            try {
                decrypted = Crypto.aes256CbcDecrypt(raw.response, encryptionKey);
            } catch (Throwable ignored) {
            }
        }
        return new Types.ApiRequestResult(raw, decrypted, api);
    }
}
