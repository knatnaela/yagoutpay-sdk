package com.yagoutpay.sdk;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

/** Internal builders for WEB/API merchant_request strings. */
final class Assemble {
    private Assemble() {
    }

    private static String joinPipe(String... fields) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < fields.length; i++) {
            if (i > 0)
                sb.append('|');
            sb.append(fields[i] == null ? "" : fields[i]);
        }
        return sb.toString();
    }

    /** Build the sectioned merchant_request string for WEB/MOBILE flows. */
    static String buildMerchantRequestPlain(Types.TransactionDetails d) {
        String txn = joinPipe(d.aggregatorId, d.merchantId, d.orderNumber, d.amount, d.country, d.currency,
                d.transactionType, d.successUrl, d.failureUrl, d.channel);
        String pg = joinPipe(d.pgId, d.paymode, d.schemeId, d.walletType);
        String card = joinPipe(d.cardNumber, d.expiryMonth, d.expiryYear, d.cvv, d.cardName);
        String cust = joinPipe(d.customerName, d.customerEmail, d.customerMobile, d.uniqueId,
                d.isLoggedIn == null ? "Y" : d.isLoggedIn);
        String bill = joinPipe(d.billAddress, d.billCity, d.billState, d.billCountry, d.billZip);
        String ship = joinPipe(d.shipAddress, d.shipCity, d.shipState, d.shipCountry, d.shipZip, d.shipDays,
                d.addressCount);
        String item = joinPipe(d.itemCount, d.itemValue, d.itemCategory);
        String reserved = "";
        String udf = joinPipe(d.udf1, d.udf2, d.udf3, d.udf4, d.udf5);
        return String.join("~", txn, pg, card, cust, bill, ship, item, reserved, udf);
    }

    /** Build the API JSON string with exact field names. */
    static String buildApiMerchantRequestPlain(Types.TransactionDetails d) {
        try {
            ObjectMapper om = new ObjectMapper();
            ObjectNode root = om.createObjectNode();
            ObjectNode card = root.putObject("card_details");
            card.put("cardNumber", orEmpty(d.cardNumber));
            card.put("expiryMonth", orEmpty(d.expiryMonth));
            card.put("expiryYear", orEmpty(d.expiryYear));
            card.put("cvv", orEmpty(d.cvv));
            card.put("cardName", orEmpty(d.cardName));

            ObjectNode other = root.putObject("other_details");
            other.put("udf1", orEmpty(d.udf1));
            other.put("udf2", orEmpty(d.udf2));
            other.put("udf3", orEmpty(d.udf3));
            other.put("udf4", orEmpty(d.udf4));
            other.put("udf5", orEmpty(d.udf5));
            other.put("udf6", orEmpty(d.udf6));
            other.put("udf7", orEmpty(d.udf7));

            ObjectNode ship = root.putObject("ship_details");
            ship.put("shipAddress", orEmpty(d.shipAddress));
            ship.put("shipCity", orEmpty(d.shipCity));
            ship.put("shipState", orEmpty(d.shipState));
            ship.put("shipCountry", orEmpty(d.shipCountry));
            ship.put("shipZip", orEmpty(d.shipZip));
            ship.put("shipDays", orEmpty(d.shipDays));
            ship.put("addressCount", orEmpty(d.addressCount));

            ObjectNode txn = root.putObject("txn_details");
            txn.put("agId", d.aggregatorId);
            txn.put("meId", d.merchantId);
            txn.put("orderNo", d.orderNumber);
            txn.put("amount", d.amount);
            txn.put("country", d.country);
            txn.put("currency", d.currency);
            txn.put("transactionType", d.transactionType);
            txn.put("sucessUrl", d.successUrl);
            txn.put("failureUrl", d.failureUrl);
            txn.put("channel", "API");

            ObjectNode item = root.putObject("item_details");
            item.put("itemCount", orEmpty(d.itemCount));
            item.put("itemValue", orEmpty(d.itemValue));
            item.put("itemCategory", orEmpty(d.itemCategory));

            ObjectNode cust = root.putObject("cust_details");
            cust.put("customerName", orEmpty(d.customerName));
            cust.put("emailId", orEmpty(d.customerEmail));
            cust.put("mobileNumber", orEmpty(d.customerMobile));
            cust.put("uniqueId", orEmpty(d.uniqueId));
            cust.put("isLoggedIn", orEmpty(d.isLoggedIn == null ? "Y" : d.isLoggedIn));

            ObjectNode pg = root.putObject("pg_details");
            pg.put("pg_Id", orEmpty(d.pgId));
            pg.put("paymode", orEmpty(d.paymode));
            pg.put("scheme_Id", orEmpty(d.schemeId));
            pg.put("wallet_type", orEmpty(d.walletType));

            ObjectNode bill = root.putObject("bill_details");
            bill.put("billAddress", orEmpty(d.billAddress));
            bill.put("billCity", orEmpty(d.billCity));
            bill.put("billState", orEmpty(d.billState));
            bill.put("billCountry", orEmpty(d.billCountry));
            bill.put("billZip", orEmpty(d.billZip));

            return om.writeValueAsString(root);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private static String orEmpty(String v) {
        return v == null ? "" : v;
    }
}
