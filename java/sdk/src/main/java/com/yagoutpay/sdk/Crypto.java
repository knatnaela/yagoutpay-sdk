package com.yagoutpay.sdk;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

/** AES-256-CBC with static IV and PKCS7 padding helpers. */
final class Crypto {
    private Crypto() {
    }

    /** Encrypt plain text using AES-256-CBC with PKCS7 padding and static IV. */
    static String aes256CbcEncrypt(String plain, String base64Key) {
        try {
            byte[] key = Base64.getDecoder().decode(base64Key);
            SecretKeySpec keySpec = new SecretKeySpec(key, "AES");
            IvParameterSpec iv = new IvParameterSpec("0123456789abcdef".getBytes(StandardCharsets.UTF_8));
            Cipher cipher = Cipher.getInstance("AES/CBC/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, keySpec, iv);
            byte[] padded = pkcs7Pad(plain.getBytes(StandardCharsets.UTF_8), 16);
            byte[] enc = cipher.doFinal(padded);
            return Base64.getEncoder().encodeToString(enc);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    /** Decrypt base64 cipher using AES-256-CBC with static IV. */
    static String aes256CbcDecrypt(String base64Cipher, String base64Key) {
        try {
            byte[] key = Base64.getDecoder().decode(base64Key);
            SecretKeySpec keySpec = new SecretKeySpec(key, "AES");
            IvParameterSpec iv = new IvParameterSpec("0123456789abcdef".getBytes(StandardCharsets.UTF_8));
            Cipher cipher = Cipher.getInstance("AES/CBC/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, keySpec, iv);
            byte[] dec = cipher.doFinal(Base64.getDecoder().decode(base64Cipher));
            byte[] unpadded = pkcs7Unpad(dec);
            return new String(unpadded, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private static byte[] pkcs7Pad(byte[] input, int blockSize) {
        int padLen = blockSize - (input.length % blockSize);
        byte[] out = new byte[input.length + padLen];
        System.arraycopy(input, 0, out, 0, input.length);
        for (int i = input.length; i < out.length; i++)
            out[i] = (byte) padLen;
        return out;
    }

    private static byte[] pkcs7Unpad(byte[] input) {
        int padLen = input[input.length - 1] & 0xff;
        byte[] out = new byte[input.length - padLen];
        System.arraycopy(input, 0, out, 0, out.length);
        return out;
    }
}
