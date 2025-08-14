/// YagoutPay Dart SDK (monorepo package)
///
/// Provides helpers to assemble the gateway request payload (spec-accurate
/// section format), generate SHA-256 hash inputs, and encrypt/decrypt using
/// AES-256-CBC with a static IV and PKCS7 padding.
library yagoutpay_sdk;

import 'dart:convert';
import 'package:crypto/crypto.dart' as dcrypto;
import 'package:encrypt/encrypt.dart' as enc;

/// Input model for building a YagoutPay request.
class TransactionDetails {
  /// Aggregator identifier (e.g. 'yagout').
  final String aggregatorId;

  /// Merchant identifier assigned by YagoutPay.
  final String merchantId;

  /// Your order number/reference.
  final String orderNumber;

  /// Amount as a numeric string (e.g. '1' or '100').
  final String amount;

  /// ISO-3166 alpha-3 country (e.g. 'ETH').
  final String country;

  /// ISO-4217 currency (e.g. 'ETB').
  final String currency;

  /// Transaction type (e.g. 'SALE').
  final String transactionType;

  /// Absolute URL invoked by the gateway on success.
  final String successUrl;

  /// Absolute URL invoked by the gateway on failure.
  final String failureUrl;

  /// 'WEB' | 'MOBILE'.
  final String channel;

  /// Optional customer email (kept in the layout even if blank).
  final String? customerEmail;

  /// Optional customer mobile (kept in the layout even if blank).
  final String? customerMobile;

  /// 'Y' | 'N'. Defaults to 'Y' if not provided.
  final String? isLoggedIn;

  const TransactionDetails({
    required this.aggregatorId,
    required this.merchantId,
    required this.orderNumber,
    required this.amount,
    required this.country,
    required this.currency,
    required this.transactionType,
    required this.successUrl,
    required this.failureUrl,
    required this.channel,
    this.customerEmail,
    this.customerMobile,
    this.isLoggedIn,
  });
}

/// Output of building a YagoutPay form payload.
class BuiltRequest {
  /// Merchant identifier.
  final String meId;

  /// Plain (unencrypted) merchant_request string as per specification.
  final String merchantRequestPlain;

  /// Base64 AES-256-CBC encrypted merchant_request.
  final String merchantRequest;

  /// Hash input used for SHA-256 (me_id~order_no~amount~country~currency).
  final String hashInput;

  /// SHA-256 hex digest of [hashInput].
  final String hashHex;

  /// Base64 AES-256-CBC encrypted [hashHex].
  final String hash;

  /// Gateway action URL (defaults to UAT endpoint).
  final String actionUrl;

  const BuiltRequest({
    required this.meId,
    required this.merchantRequestPlain,
    required this.merchantRequest,
    required this.hashInput,
    required this.hashHex,
    required this.hash,
    required this.actionUrl,
  });
}

/// Joins fields with '|' while preserving empty placeholders.
String _joinPipe(List<String?> fields) => fields.map((f) => f ?? '').join('|');

/// Builds the plain merchant_request string.
///
/// Layout: 9 sections joined by '~' in this order:
/// 1) txn_details (10) ag_id|me_id|order_no|amount|country|currency|txn_type|success_url|failure_url|channel
/// 2) pg_details (4)
/// 3) card_details (5)
/// 4) cust_details (5)
/// 5) bill_details (5)
/// 6) ship_details (7)
/// 7) item_details (3)
/// 8) reserved (empty string)
/// 9) udf_details (5)
String buildMerchantRequestPlain(TransactionDetails d) {
  final txnDetails = _joinPipe([
    d.aggregatorId,
    d.merchantId,
    d.orderNumber,
    d.amount,
    d.country,
    d.currency,
    d.transactionType,
    d.successUrl,
    d.failureUrl,
    d.channel,
  ]);

  final pgDetails = _joinPipe(['', '', '', '']);
  final cardDetails = _joinPipe(['', '', '', '', '']);
  final custDetails = _joinPipe(
      ['', d.customerEmail, d.customerMobile, '', d.isLoggedIn ?? 'Y']);
  final billDetails = _joinPipe(['', '', '', '', '']);
  final shipDetails = _joinPipe(['', '', '', '', '', '', '']);
  final itemDetails = _joinPipe(['', '', '']);
  final reserved = '';
  final udfDetails = _joinPipe(['', '', '', '', '']);

  return [
    txnDetails,
    pgDetails,
    cardDetails,
    custDetails,
    billDetails,
    shipDetails,
    itemDetails,
    reserved,
    udfDetails,
  ].join('~');
}

/// Returns the canonical hash input:
/// me_id~order_no~amount~country~currency
String buildHashInput(TransactionDetails d) =>
    [d.merchantId, d.orderNumber, d.amount, d.country, d.currency].join('~');

/// Computes SHA-256 hex digest.
String generateSha256Hex(String input) =>
    dcrypto.sha256.convert(utf8.encode(input)).toString();

/// Encrypts [plain] using AES-256-CBC with PKCS7 padding and static IV.
/// [base64Key] is a 32-byte key encoded in base64.
String aes256CbcEncrypt(String plain, String base64Key) {
  final key = enc.Key.fromBase64(base64Key);
  final iv = enc.IV.fromUtf8('0123456789abcdef');
  final pad = _pkcs7Pad(utf8.encode(plain));
  final encrypter =
      enc.Encrypter(enc.AES(key, mode: enc.AESMode.cbc, padding: null));
  final encrypted = encrypter.encryptBytes(pad, iv: iv);
  return encrypted.base64;
}

/// Decrypts a base64 AES-256-CBC ciphertext using the static IV.
String aes256CbcDecrypt(String base64Cipher, String base64Key) {
  final key = enc.Key.fromBase64(base64Key);
  final iv = enc.IV.fromUtf8('0123456789abcdef');
  final encrypter =
      enc.Encrypter(enc.AES(key, mode: enc.AESMode.cbc, padding: null));
  final bytes =
      encrypter.decryptBytes(enc.Encrypted.fromBase64(base64Cipher), iv: iv);
  final unpadded = _pkcs7Unpad(bytes);
  return utf8.decode(unpadded);
}

/// Manual PKCS7 padding.
List<int> _pkcs7Pad(List<int> input, [int blockSize = 16]) {
  final padLen = blockSize - (input.length % blockSize);
  return [...input, ...List<int>.filled(padLen, padLen)];
}

/// Manual PKCS7 unpadding.
List<int> _pkcs7Unpad(List<int> input) {
  final padLen = input.isNotEmpty ? input.last : 0;
  return input.sublist(0, input.length - padLen);
}

/// Builds a ready-to-post payload for the gateway, including:
/// - plain & encrypted merchant_request
/// - hash input, SHA-256 hex, and encrypted hash
/// - action URL (UAT by default)
BuiltRequest buildFormPayload(
  TransactionDetails d,
  String encryptionKey, {
  required String actionUrl,
}) {
  final plain = buildMerchantRequestPlain(d);
  final merchantReq = aes256CbcEncrypt(plain, encryptionKey);
  final hashInput = buildHashInput(d);
  final hashHex = generateSha256Hex(hashInput);
  final hash = aes256CbcEncrypt(hashHex, encryptionKey);
  return BuiltRequest(
    meId: d.merchantId,
    merchantRequestPlain: plain,
    merchantRequest: merchantReq,
    hashInput: hashInput,
    hashHex: hashHex,
    hash: hash,
    actionUrl: actionUrl,
  );
}

/// Renders a minimal auto-submit HTML form for posting to the gateway.
String renderAutoSubmitForm(BuiltRequest b) {
  String esc(String s) => s
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');

  return '<!doctype html>'
      '<html><head><meta charset="utf-8" /><title>Redirecting…</title></head>'
      '<body onload="document.forms[0].submit()">'
      '<form method="POST" action="${esc(b.actionUrl)}" enctype="application/x-www-form-urlencoded">'
      '<input type="hidden" name="me_id" value="${esc(b.meId)}" />'
      '<input type="hidden" name="merchant_request" value="${esc(b.merchantRequest)}" />'
      '<input type="hidden" name="hash" value="${esc(b.hash)}" />'
      '<noscript><button type="submit">Continue</button></noscript>'
      '</form>'
      '</body></html>';
}
