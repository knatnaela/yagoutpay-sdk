package com.yagoutpay.sdk;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

/** Hash utilities: canonical hash input and SHA-256 hex. */
final class Hashing {
    private Hashing() {
    }

    /** Returns me_id~order_no~amount~country~currency. */
    static String buildHashInput(Types.TransactionDetails d) {
        return String.join("~", d.merchantId, d.orderNumber, d.amount, d.country, d.currency);
    }

    static String sha256Hex(String input) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : digest)
                sb.append(String.format("%02x", b));
            return sb.toString();
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
