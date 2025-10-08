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

    /** Build encoded body for Payment Link (static). */
    public Types.PaymentLinkEncodedBody buildPaymentLinkBody(Types.PaymentLinkPlain plain) throws Exception {
        if (plain == null) {
            throw new IllegalArgumentException("PaymentLinkPlain cannot be null");
        }

        // Apply defaults like TypeScript implementation
        Types.PaymentLinkPlain filled = new Types.PaymentLinkPlain();
        filled.ag_id = plain.ag_id != null ? plain.ag_id : "";
        filled.ag_code = plain.ag_code != null ? plain.ag_code : "";
        filled.ag_name = plain.ag_name != null ? plain.ag_name : "";
        filled.req_user_id = plain.req_user_id != null ? plain.req_user_id : "";
        filled.me_code = plain.me_code != null ? plain.me_code : "";
        filled.me_name = plain.me_name != null ? plain.me_name : "";
        filled.qr_code_id = plain.qr_code_id != null ? plain.qr_code_id : "";
        filled.brandName = plain.brandName != null ? plain.brandName : "";
        filled.qr_name = plain.qr_name != null ? plain.qr_name : "";
        filled.status = plain.status != null ? plain.status : "";
        filled.storeName = plain.storeName != null ? plain.storeName : "";
        filled.store_id = plain.store_id != null ? plain.store_id : "";
        filled.token = plain.token != null ? plain.token : "";
        filled.qr_transaction_amount = plain.qr_transaction_amount != null ? plain.qr_transaction_amount : "";
        filled.logo = plain.logo != null ? plain.logo : "";
        filled.store_email = plain.store_email != null ? plain.store_email : "";
        filled.mobile_no = plain.mobile_no != null ? plain.mobile_no : "";
        filled.udf = plain.udf != null ? plain.udf : "";
        filled.udfmerchant = plain.udfmerchant != null ? plain.udfmerchant : "";
        filled.file_name = plain.file_name != null ? plain.file_name : "";
        filled.from_date = plain.from_date != null ? plain.from_date : "";
        filled.to_date = plain.to_date != null ? plain.to_date : "";
        filled.file_extn = plain.file_extn != null ? plain.file_extn : "";
        filled.file_url = plain.file_url != null ? plain.file_url : "";
        filled.file = plain.file != null ? plain.file : "";
        filled.original_file_name = plain.original_file_name != null ? plain.original_file_name : "";
        filled.successURL = plain.successURL != null ? plain.successURL : "";
        filled.failureURL = plain.failureURL != null ? plain.failureURL : "";
        filled.addAll = plain.addAll != null ? plain.addAll : "";
        filled.source = plain.source != null ? plain.source : "";

        String json = OM.writeValueAsString(filled);
        String enc = Crypto.aes256CbcEncrypt(json, encryptionKey);
        return new Types.PaymentLinkEncodedBody(enc);
    }

    /** Send a static Payment Link request and return PaymentLinkResult. */
    public Types.PaymentLinkResult sendPaymentLinkResult(Types.PaymentLinkPlain plain, String endpoint)
            throws Exception {
        String url = endpoint != null ? endpoint : Constants.paymentLinkUrl(environment);
        Types.PaymentLinkEncodedBody body = buildPaymentLinkBody(plain);
        String payload = OM.writeValueAsString(Map.of("request", body.request));

        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(30))
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .header("me_id", plain.me_code != null ? plain.me_code : "")
                .POST(HttpRequest.BodyPublishers.ofString(payload))
                .build();

        HttpResponse<String> resp = http.send(req, HttpResponse.BodyHandlers.ofString());

        // Check status like TypeScript: if (!resp.ok)
        if (resp.statusCode() < 200 || resp.statusCode() >= 300) {
            String text = resp.body() != null ? resp.body() : "";
            throw new RuntimeException("Payment Link request failed (" + resp.statusCode() + "): " +
                    (text.isEmpty() ? "Unknown error" : text));
        }

        // Read response as text first, then parse JSON like TypeScript
        String bodyText = resp.body() != null ? resp.body() : "";
        Object raw = bodyText;
        Object json = null;
        try {
            if (!bodyText.isEmpty()) {
                json = OM.readValue(bodyText, Object.class);
            }
        } catch (Exception ignored) {
            json = null;
        }
        if (json != null)
            raw = json;

        // Decrypt using TypeScript logic
        String decryptedResponse = null;
        try {
            Object candidate = null;
            if (json instanceof Map) {
                Map<?, ?> jsonMap = (Map<?, ?>) json;
                candidate = jsonMap.get("response");
                if (candidate == null)
                    candidate = jsonMap.get("data");
                if (candidate == null)
                    candidate = jsonMap.get("payload");
                if (candidate == null)
                    candidate = jsonMap.get("responseData");
            }
            if (candidate == null && raw instanceof String) {
                candidate = raw;
            }

            if (candidate instanceof String && !((String) candidate).isEmpty()) {
                decryptedResponse = Crypto.aes256CbcDecrypt((String) candidate, encryptionKey);
            }
        } catch (Exception ignored) {
            decryptedResponse = null;
        }

        return new Types.PaymentLinkResult(raw, decryptedResponse, url);
    }

    /** Send a dynamic Payment By Link request and return PaymentLinkResult. */
    public Types.PaymentLinkResult sendPaymentByLinkResult(Types.PaymentByLinkPlain plain, String endpoint)
            throws Exception {
        String url = endpoint != null ? endpoint : Constants.paymentByLinkUrl(environment);
        Types.PaymentLinkEncodedBody body = buildPaymentByLinkBody(plain);
        String payload = OM.writeValueAsString(Map.of("request", body.request));

        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(30))
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .header("me_id", plain.me_id != null ? plain.me_id : "")
                .POST(HttpRequest.BodyPublishers.ofString(payload))
                .build();

        HttpResponse<String> resp = http.send(req, HttpResponse.BodyHandlers.ofString());

        // Check status like TypeScript: if (!resp.ok)
        if (resp.statusCode() < 200 || resp.statusCode() >= 300) {
            String text = resp.body() != null ? resp.body() : "";
            throw new RuntimeException("Payment By Link request failed (" + resp.statusCode() + "): " +
                    (text.isEmpty() ? "Unknown error" : text));
        }

        // Read response as text first, then parse JSON like TypeScript
        String bodyText = resp.body() != null ? resp.body() : "";
        Object raw = bodyText;
        Object json = null;
        try {
            if (!bodyText.isEmpty()) {
                json = OM.readValue(bodyText, Object.class);
            }
        } catch (Exception ignored) {
            json = null;
        }
        if (json != null)
            raw = json;

        // Decrypt using TypeScript logic
        String decryptedResponse = null;
        try {
            Object candidate = null;
            if (json instanceof Map) {
                Map<?, ?> jsonMap = (Map<?, ?>) json;
                candidate = jsonMap.get("response");
                if (candidate == null)
                    candidate = jsonMap.get("data");
                if (candidate == null)
                    candidate = jsonMap.get("payload");
                if (candidate == null)
                    candidate = jsonMap.get("responseData");
            }
            if (candidate == null && raw instanceof String) {
                candidate = raw;
            }

            if (candidate instanceof String && !((String) candidate).isEmpty()) {
                decryptedResponse = Crypto.aes256CbcDecrypt((String) candidate, encryptionKey);
            }
        } catch (Exception ignored) {
            decryptedResponse = null;
        }

        return new Types.PaymentLinkResult(raw, decryptedResponse, url);
    }

    /**
     * Send a static Payment Link request (legacy method - use sendPaymentLinkResult
     * instead).
     */
    public Types.ApiRequestResult sendPaymentLink(Types.PaymentLinkPlain plain, String endpoint) throws Exception {
        String url = endpoint != null ? endpoint : Constants.paymentLinkUrl(environment);
        Types.PaymentLinkEncodedBody body = buildPaymentLinkBody(plain);
        String payload = OM.writeValueAsString(Map.of("request", body.request));

        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(30))
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .header("me_id", plain.me_code != null ? plain.me_code : "")
                .POST(HttpRequest.BodyPublishers.ofString(payload))
                .build();

        HttpResponse<String> resp = http.send(req, HttpResponse.BodyHandlers.ofString());

        // Check status like TypeScript: if (!resp.ok)
        if (resp.statusCode() < 200 || resp.statusCode() >= 300) {
            String text = resp.body() != null ? resp.body() : "";
            throw new RuntimeException("Payment Link request failed (" + resp.statusCode() + "): " +
                    (text.isEmpty() ? "Unknown error" : text));
        }

        // Read response as text first, then parse JSON like TypeScript
        String bodyText = resp.body() != null ? resp.body() : "";
        Object raw = bodyText;
        Object json = null;
        try {
            if (!bodyText.isEmpty()) {
                json = OM.readValue(bodyText, Object.class);
            }
        } catch (Exception ignored) {
            json = null;
        }
        if (json != null)
            raw = json;

        // Decrypt using TypeScript logic
        String decryptedResponse = null;
        try {
            Object candidate = null;
            if (json instanceof Map) {
                Map<?, ?> jsonMap = (Map<?, ?>) json;
                candidate = jsonMap.get("response");
                if (candidate == null)
                    candidate = jsonMap.get("data");
                if (candidate == null)
                    candidate = jsonMap.get("payload");
                if (candidate == null)
                    candidate = jsonMap.get("responseData");
            }
            if (candidate == null && raw instanceof String) {
                candidate = raw;
            }

            if (candidate instanceof String && !((String) candidate).isEmpty()) {
                decryptedResponse = Crypto.aes256CbcDecrypt((String) candidate, encryptionKey);
            }
        } catch (Exception ignored) {
            decryptedResponse = null;
        }

        return new Types.ApiRequestResult(raw, decryptedResponse, url);
    }

    /** Build encoded body for Payment By Link (dynamic). */
    public Types.PaymentLinkEncodedBody buildPaymentByLinkBody(Types.PaymentByLinkPlain plain) throws Exception {
        // Apply defaults like TypeScript implementation
        Types.PaymentByLinkPlain filled = new Types.PaymentByLinkPlain();
        filled.req_user_id = plain.req_user_id != null ? plain.req_user_id : "";
        filled.me_id = plain.me_id != null ? plain.me_id : "";
        filled.amount = plain.amount != null ? plain.amount : "";
        filled.order_id = plain.order_id != null ? plain.order_id : "";
        filled.product = plain.product != null ? plain.product : "";
        filled.customer_email = plain.customer_email != null ? plain.customer_email : "";
        filled.mobile_no = plain.mobile_no != null ? plain.mobile_no : "";
        filled.expiry_date = plain.expiry_date != null ? plain.expiry_date : "";
        filled.media_type = plain.media_type != null ? plain.media_type : new String[0];
        filled.first_name = plain.first_name != null ? plain.first_name : "";
        filled.last_name = plain.last_name != null ? plain.last_name : "";
        filled.dial_code = plain.dial_code != null ? plain.dial_code : "";
        filled.failure_url = plain.failure_url != null ? plain.failure_url : "";
        filled.success_url = plain.success_url != null ? plain.success_url : "";
        filled.country = plain.country != null ? plain.country : "";
        filled.currency = plain.currency != null ? plain.currency : "";

        String json = OM.writeValueAsString(filled);
        String enc = Crypto.aes256CbcEncrypt(json, encryptionKey);
        return new Types.PaymentLinkEncodedBody(enc);
    }

    /**
     * Send a dynamic Payment By Link request (legacy method - use
     * sendPaymentByLinkResult instead).
     */
    public Types.ApiRequestResult sendPaymentByLink(Types.PaymentByLinkPlain plain, String endpoint) throws Exception {
        String url = endpoint != null ? endpoint : Constants.paymentByLinkUrl(environment);
        Types.PaymentLinkEncodedBody body = buildPaymentByLinkBody(plain);
        String payload = OM.writeValueAsString(Map.of("request", body.request));

        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .timeout(Duration.ofSeconds(30))
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .header("me_id", plain.me_id != null ? plain.me_id : "")
                .POST(HttpRequest.BodyPublishers.ofString(payload))
                .build();

        HttpResponse<String> resp = http.send(req, HttpResponse.BodyHandlers.ofString());

        // Check status like TypeScript: if (!resp.ok)
        if (resp.statusCode() < 200 || resp.statusCode() >= 300) {
            String text = resp.body() != null ? resp.body() : "";
            throw new RuntimeException("Payment By Link request failed (" + resp.statusCode() + "): " +
                    (text.isEmpty() ? "Unknown error" : text));
        }

        // Read response as text first, then parse JSON like TypeScript
        String bodyText = resp.body() != null ? resp.body() : "";
        Object raw = bodyText;
        Object json = null;
        try {
            if (!bodyText.isEmpty()) {
                json = OM.readValue(bodyText, Object.class);
            }
        } catch (Exception ignored) {
            json = null;
        }
        if (json != null)
            raw = json;

        // Decrypt using TypeScript logic
        String decryptedResponse = null;
        try {
            Object candidate = null;
            if (json instanceof Map) {
                Map<?, ?> jsonMap = (Map<?, ?>) json;
                candidate = jsonMap.get("response");
                if (candidate == null)
                    candidate = jsonMap.get("data");
                if (candidate == null)
                    candidate = jsonMap.get("payload");
                if (candidate == null)
                    candidate = jsonMap.get("responseData");
            }
            if (candidate == null && raw instanceof String) {
                candidate = raw;
            }

            if (candidate instanceof String && !((String) candidate).isEmpty()) {
                decryptedResponse = Crypto.aes256CbcDecrypt((String) candidate, encryptionKey);
            }
        } catch (Exception ignored) {
            decryptedResponse = null;
        }

        return new Types.ApiRequestResult(raw, decryptedResponse, url);
    }

}
