package com.yagoutpay.sdk;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Map;
import javax.net.ssl.SSLContext;
import javax.net.ssl.TrustManager;
import javax.net.ssl.X509TrustManager;
import java.security.cert.X509Certificate;
import java.security.SecureRandom;

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

        HttpClient.Builder httpBuilder = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(20))
                .version(HttpClient.Version.HTTP_2);

        // Configure SSL if insecure TLS is allowed
        if (cfg.allowInsecureTls) {
            try {
                configureInsecureSSL(httpBuilder);
            } catch (Exception e) {
                System.err.println("Warning: Could not configure insecure SSL: " + e.getMessage());
            }
        }

        this.http = httpBuilder.build();
    }

    private void configureInsecureSSL(HttpClient.Builder httpBuilder) throws Exception {
        // Create a trust manager that accepts all certificates
        TrustManager[] trustAllCerts = new TrustManager[] {
                new X509TrustManager() {
                    public X509Certificate[] getAcceptedIssuers() {
                        return new X509Certificate[0];
                    }

                    public void checkClientTrusted(X509Certificate[] certs, String authType) {
                        // Accept all client certificates
                    }

                    public void checkServerTrusted(X509Certificate[] certs, String authType) {
                        // Accept all server certificates
                    }
                }
        };

        // Create SSL context with the trust manager
        SSLContext sc = SSLContext.getInstance("TLS");
        sc.init(null, trustAllCerts, new SecureRandom());

        // Configure the HTTP client to use the custom SSL context
        httpBuilder.sslContext(sc);

        System.out.println("YagoutPay SDK: SSL certificate validation disabled (allowInsecureTls=true)");
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
        System.out.println("Plain: " + plain);
        System.out.println("Encryption Key: " + encryptionKey);
        System.out.println("Merchant ID: " + merchantId);
        String merchantRequest = Crypto.aes256CbcEncrypt(plain, encryptionKey);
        System.out.println("Merchant Request: " + merchantRequest);

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
        System.out.println("API request response: " + resp.body());
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
