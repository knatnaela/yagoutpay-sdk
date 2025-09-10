package com.yagoutpay.demo.service;

import com.yagoutpay.sdk.Client;
import com.yagoutpay.sdk.Constants;
import com.yagoutpay.sdk.Types;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
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
        if (merchantId.isEmpty() || merchantKey.isEmpty()) {
            throw new IllegalStateException("Missing YAGOUT_MERCHANT_ID or YAGOUT_MERCHANT_KEY environment variables");
        }

        Client.Config cfg = new Client.Config();
        cfg.merchantId = merchantId;
        cfg.encryptionKey = merchantKey;
        cfg.environment = Constants.Environment.UAT;
        cfg.allowInsecureTls = allowInsecureTls; // Use configuration property
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
}
