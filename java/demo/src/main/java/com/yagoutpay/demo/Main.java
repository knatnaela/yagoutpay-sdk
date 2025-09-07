package com.yagoutpay.demo;

import com.yagoutpay.sdk.Client;
import com.yagoutpay.sdk.Constants;
import com.yagoutpay.sdk.Types;
import io.javalin.Javalin;
import io.javalin.http.Context;

import java.util.Map;

public class Main {
    public static void main(String[] args) {
        String merchantId = System.getenv().getOrDefault("YAGOUT_MERCHANT_ID", "");
        String merchantKey = System.getenv().getOrDefault("YAGOUT_MERCHANT_KEY", "");
        if (merchantId.isEmpty() || merchantKey.isEmpty()) {
            System.err.println("[YagoutPay Java Demo] Missing env YAGOUT_MERCHANT_ID or YAGOUT_MERCHANT_KEY");
            System.exit(1);
        }

        Client.Config cfg = new Client.Config();
        cfg.merchantId = merchantId;
        cfg.encryptionKey = merchantKey;
        cfg.environment = Constants.Environment.UAT;
        Client client = new Client(cfg);

        Javalin app = Javalin.create(config -> {
        }).start(3001);

        app.get("/", ctx -> ctx.html(indexHtml()));

        app.post("/api/build", ctx -> {
            String amount = ctx.formParam("amount");
            if (amount == null || amount.isBlank())
                amount = "1.00";
            String orderNo = "ORDER" + System.currentTimeMillis();
            String baseUrl = ctx.scheme() + "://" + ctx.host();
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
                    .build();

            Types.BuiltRequest built = client.build(details);
            ctx.json(Map.of(
                    "success", true,
                    "data", Map.of(
                            "me_id", built.meId,
                            "merchant_request", built.merchantRequest,
                            "hash", built.hash,
                            "actionUrl", built.actionUrl)));
        });

        app.post("/api/send", ctx -> {
            String amount = ctx.formParam("amount");
            if (amount == null || amount.isBlank())
                amount = "1.00";
            String mobile = ctx.formParam("mobile");
            if (mobile == null)
                mobile = "";
            if (mobile.isEmpty()) {
                ctx.status(400).json(Map.of("success", false, "error", "mobile is required"));
                return;
            }
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
                    .build();

            Types.ApiRequestResult result = client.sendApi(details, null, true);
            ctx.json(Map.of("success", true, "data", Map.of(
                    "raw", result.raw,
                    "endpoint", result.endpoint,
                    "decryptedResponse", result.decryptedResponse)));
        });

        app.post("/success", Main::callback);
        app.get("/failure", Main::callback);
        app.post("/failure", Main::callback);
    }

    private static void callback(Context ctx) {
        ctx.html("<html><body><h3>Callback</h3><pre>" + ctx.body() + "</pre></body></html>");
    }

    private static String indexHtml() {
        return "<!doctype html><html><head><meta charset=\"utf-8\"/><title>YagoutPay Java Demo</title></head>" +
                "<body><h2>YagoutPay Java Demo</h2>" +
                "<form method=\"post\" action=\"/api/build\"><input name=\"amount\" value=\"1.00\"/>" +
                "<button>Build Hosted Form</button></form>" +
                "<form method=\"post\" action=\"/api/send\"><input name=\"amount\" value=\"1.00\"/>" +
                "<input name=\"mobile\" placeholder=\"Mobile for API\"/>" +
                "<button>Send API</button></form>" +
                "</body></html>";
    }

    private String nullable(String s) {
        return s;
    }
}
