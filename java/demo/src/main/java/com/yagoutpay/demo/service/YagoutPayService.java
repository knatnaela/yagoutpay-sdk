package com.yagoutpay.demo.service;

import com.yagoutpay.sdk.Client;
import com.yagoutpay.sdk.Constants;
import com.yagoutpay.sdk.Types;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;

import java.util.HashMap;
import java.util.Map;

@Service
public class YagoutPayService {

    @Value("${yagout.merchant.id:}")
    private String merchantId;

    @Value("${yagout.merchant.key:}")
    private String merchantKey;

    @Value("${yagout.allow.insecure.tls:true}")
    private boolean allowInsecureTls;

    private Client client;

    @PostConstruct
    public void init() {
        if (merchantId == null || merchantId.isEmpty() || merchantKey == null || merchantKey.isEmpty()) {
            throw new IllegalStateException("Missing YAGOUT_MERCHANT_ID or YAGOUT_MERCHANT_KEY environment variables");
        }

        Client.Config cfg = new Client.Config();
        cfg.merchantId = merchantId;
        cfg.encryptionKey = merchantKey;
        cfg.environment = Constants.Environment.UAT;
        cfg.allowInsecureTls = allowInsecureTls;
        client = new Client(cfg);
    }

    public Map<String, Object> buildHostedForm(String amount, String baseUrl, String email, String mobile) {
        String orderNo = "ORDER" + System.currentTimeMillis();

        Types.TransactionDetails details = Types.TransactionDetails.builder()
                .aggregatorId("yagout")
                .merchantId(merchantId)
                .orderNumber(orderNo)
                .amount(amount)
                .country("ETH")
                .currency("ETB")
                .transactionType("SALE")
                .successUrl(baseUrl + "/success")
                .failureUrl(baseUrl + "/failure")
                .channel("WEB")
                .customerEmail(email)
                .customerMobile(mobile)
                .build();

        Types.BuiltRequest built = client.build(details);
        return Map.of(
                "me_id", built.meId,
                "merchant_request", built.merchantRequest,
                "hash", built.hash,
                "actionUrl", built.actionUrl);
    }

    public Map<String, Object> sendApiRequest(String amount, String mobile, String email) throws Exception {
        String orderNo = "ORDER" + System.currentTimeMillis();

        Types.TransactionDetails details = Types.TransactionDetails.builder()
                .aggregatorId("yagout")
                .merchantId(merchantId)
                .orderNumber(orderNo)
                .amount(amount)
                .country("ETH")
                .currency("ETB")
                .transactionType("SALE")
                .successUrl("")
                .failureUrl("")
                .channel("API")
                .customerMobile(mobile)
                .customerEmail(email)
                .pgId(Constants.ApiDefaults.PG_ID)
                .paymode(Constants.ApiDefaults.PAYMODE)
                .schemeId(Constants.ApiDefaults.SCHEME_ID)
                .walletType(Constants.ApiDefaults.WALLET_TYPE)
                .build();

        Types.ApiRequestResult result = client.sendApi(details, null, true);
        return Map.of(
                "raw", result.raw,
                "endpoint", result.endpoint,
                "decryptedResponse", result.decryptedResponse);
    }

    public Map<String, Object> sendPaymentLinkStatic(String amount, String email, String mobile, String successUrl,
            String failureUrl) throws Exception {
        if (merchantId == null) {
            throw new IllegalStateException("merchantId is null!");
        }
        if (client == null) {
            throw new IllegalStateException("client is null!");
        }

        Types.PaymentLinkPlain plain = new Types.PaymentLinkPlain();
        plain.req_user_id = "yagou381";
        plain.me_code = merchantId;
        plain.qr_transaction_amount = amount;
        plain.brandName = "Demo Product";
        plain.status = "ACTIVE";
        plain.storeName = "YP";
        plain.store_email = email;
        plain.mobile_no = mobile;
        plain.successURL = successUrl;
        plain.failureURL = failureUrl;

        Types.PaymentLinkResult result = client.sendPaymentLinkResult(plain, null);

        Map<String, Object> response = new HashMap<>();
        response.put("endpoint", result.endpoint);
        response.put("raw", result.raw);
        response.put("decryptedResponse", result.decryptedResponse);
        return response;
    }

    public Map<String, Object> sendPaymentLinkDynamic(String amount, String orderId, String product, String email,
            String mobile, String expiry, String successUrl, String failureUrl) throws Exception {
        Types.PaymentByLinkPlain plain = new Types.PaymentByLinkPlain();
        plain.req_user_id = "yagou381";
        plain.me_id = merchantId;
        plain.amount = amount;
        plain.order_id = orderId;
        plain.product = product;
        plain.customer_email = email;
        plain.mobile_no = mobile;
        plain.first_name = "Demo";
        plain.last_name = "User";
        plain.dial_code = "+251";
        plain.expiry_date = expiry.isEmpty() ? "2025-10-15" : expiry;
        plain.success_url = successUrl;
        plain.failure_url = failureUrl;
        plain.currency = "ETB";
        plain.country = "ETH";
        plain.media_type = new String[] { "API" };

        Types.PaymentLinkResult result = client.sendPaymentByLinkResult(plain, null);

        Map<String, Object> response = new HashMap<>();
        response.put("endpoint", result.endpoint);
        response.put("raw", result.raw);
        response.put("decryptedResponse", result.decryptedResponse);
        return response;
    }
}
