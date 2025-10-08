import 'dart:convert';
import 'package:http/http.dart' as http;

import 'types.dart';
import 'constants.dart';
import 'assemble.dart';
import 'crypto.dart';
import 'hash.dart';
import 'http.dart' as http_util;

export 'hash.dart' show buildHashInput, generateSha256Hex;
export 'assemble.dart' show buildMerchantRequestPlain, buildApiMerchantRequestPlain;
export 'crypto.dart' show aes256CbcEncrypt, aes256CbcDecrypt;
export 'constants.dart' show Environment, ApiDefaults, Endpoints;
export 'types.dart'
    show
        TransactionDetails,
        BuiltRequest,
        ApiIntegrationResponse,
        ApiRequestResult,
        PaymentLinkPlain,
        PaymentByLinkPlain,
        PaymentLinkResult;

/// Build the full set of form fields and related debug fields for the WEB flow.
BuiltRequest buildFormPayload(TransactionDetails details, String encryptionKey, {required String actionUrl}) {
  final plain = buildMerchantRequestPlain(details);
  final merchantReq = aes256CbcEncrypt(plain, encryptionKey);
  final hashInput = buildHashInput(details);
  final hashHex = generateSha256Hex(hashInput);
  final hash = aes256CbcEncrypt(hashHex, encryptionKey);
  return BuiltRequest(
    meId: details.merchantId,
    merchantRequestPlain: plain,
    merchantRequest: merchantReq,
    hashInput: hashInput,
    hashHex: hashHex,
    hash: hash,
    actionUrl: actionUrl,
  );
}

/// Client configuration for convenience wrapper.
class YagoutPayClientConfig {
  final String merchantId;
  final String encryptionKey;
  final Environment environment;
  final String? actionUrlOverride;

  const YagoutPayClientConfig({
    required this.merchantId,
    required this.encryptionKey,
    this.environment = Environment.uat,
    this.actionUrlOverride,
  });
}

/// Options for API calls.
class SendApiOptions {
  final String? endpoint;
  final bool decryptResponse;
  final bool allowInsecureTls;
  final http.Client? httpClient;

  const SendApiOptions({
    this.endpoint,
    this.decryptResponse = true,
    this.allowInsecureTls = false,
    this.httpClient,
  });
}

/// Lightweight client offering build() and api.send() like the TS SDK.
class YagoutPayClient {
  final YagoutPayClientConfig _config;

  const YagoutPayClient(this._config);

  BuiltRequest build(TransactionDetails details) {
    final actionUrl = _config.actionUrlOverride ?? Endpoints.actionUrls[_config.environment]!;
    final plain = buildMerchantRequestPlain(details);
    final merchantReq = aes256CbcEncrypt(plain, _config.encryptionKey);
    final hashInput = buildHashInput(details);
    final hashHex = generateSha256Hex(hashInput);
    final hash = aes256CbcEncrypt(hashHex, _config.encryptionKey);
    return BuiltRequest(
      meId: details.merchantId,
      merchantRequestPlain: plain,
      merchantRequest: merchantReq,
      hashInput: hashInput,
      hashHex: hashHex,
      hash: hash,
      actionUrl: actionUrl,
    );
  }

  _ApiFacade get api => _ApiFacade(_config);
}

class _ApiFacade {
  final YagoutPayClientConfig _config;
  const _ApiFacade(this._config);

  Future<ApiRequestResult> send(TransactionDetails details, {SendApiOptions? options}) async {
    final endpoint = options?.endpoint ?? Endpoints.apiUrls[_config.environment]!;
    final decryptResponse = options?.decryptResponse ?? true;
    final allowInsecureTls = options?.allowInsecureTls ?? false;
    final httpClient = options?.httpClient ?? http_util.createHttpClient(allowInsecureTls: allowInsecureTls);

    final withDefaults = TransactionDetails(
      aggregatorId: details.aggregatorId,
      merchantId: details.merchantId,
      orderNumber: details.orderNumber,
      amount: details.amount,
      country: details.country,
      currency: details.currency,
      transactionType: details.transactionType,
      successUrl: '',
      failureUrl: '',
      channel: 'API',
      customerEmail: details.customerEmail,
      customerMobile: details.customerMobile,
      isLoggedIn: details.isLoggedIn ?? 'Y',
      pgId: details.pgId ?? ApiDefaults.pgId,
      paymode: details.paymode ?? ApiDefaults.paymode,
      schemeId: details.schemeId ?? ApiDefaults.schemeId,
      walletType: details.walletType ?? ApiDefaults.walletType,
      cardNumber: details.cardNumber,
      expiryMonth: details.expiryMonth,
      expiryYear: details.expiryYear,
      cvv: details.cvv,
      cardName: details.cardName,
      customerName: details.customerName,
      uniqueId: details.uniqueId,
      billAddress: details.billAddress,
      billCity: details.billCity,
      billState: details.billState,
      billCountry: details.billCountry,
      billZip: details.billZip,
      shipAddress: details.shipAddress,
      shipCity: details.shipCity,
      shipState: details.shipState,
      shipCountry: details.shipCountry,
      shipZip: details.shipZip,
      shipDays: details.shipDays,
      addressCount: details.addressCount,
      itemCount: details.itemCount,
      itemValue: details.itemValue,
      itemCategory: details.itemCategory,
      udf1: details.udf1,
      udf2: details.udf2,
      udf3: details.udf3,
      udf4: details.udf4,
      udf5: details.udf5,
      udf6: details.udf6,
      udf7: details.udf7,
    );

    final plain = buildApiMerchantRequestPlain(withDefaults);
    final merchantRequest = aes256CbcEncrypt(plain, _config.encryptionKey);

    final body = jsonEncode({
      'merchantId': withDefaults.merchantId,
      'merchantRequest': merchantRequest,
    });

    final resp = await httpClient.post(
      Uri.parse(endpoint),
      headers: const {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: body,
    );

    if (resp.statusCode < 200 || resp.statusCode >= 300) {
      throw Exception('API request failed (${resp.statusCode}): ${resp.body}');
    }

    final Map<String, dynamic> jsonResp = jsonDecode(resp.body) as Map<String, dynamic>;
    final parsed = ApiIntegrationResponse.fromJson(jsonResp);

    String? decrypted;
    if (decryptResponse && parsed.response != null && parsed.response!.isNotEmpty) {
      try {
        decrypted = aes256CbcDecrypt(parsed.response!, _config.encryptionKey);
      } catch (_) {
        decrypted = null;
      }
    }

    return ApiRequestResult(raw: parsed, decryptedResponse: decrypted, endpoint: endpoint);
  }
}

YagoutPayClient createYagoutPay(YagoutPayClientConfig config) => YagoutPayClient(config);

/// Build the Payment Link encoded body from the plain payload (AES-256-CBC).
Map<String, String> buildPaymentLinkBody(PaymentLinkPlain plain, String encryptionKey) {
  final json = jsonEncode(plain.toJson());
  final enc = aes256CbcEncrypt(json, encryptionKey);
  return {'request': enc};
}

/// Build the Payment By Link encoded body from the plain payload (AES-256-CBC).
Map<String, String> buildPaymentByLinkBody(PaymentByLinkPlain plain, String encryptionKey) {
  final json = jsonEncode(plain.toJson());
  final enc = aes256CbcEncrypt(json, encryptionKey);
  return {'request': enc};
}

/// Send a static Payment Link request.
Future<PaymentLinkResult> sendPaymentLink(
  PaymentLinkPlain plain,
  String encryptionKey, {
  Environment environment = Environment.uat,
  String? endpointOverride,
  bool allowInsecureTls = false,
  http.Client? httpClient,
}) async {
  final endpoint = endpointOverride ?? Endpoints.paymentLinkUrls[environment]!;
  final body = buildPaymentLinkBody(plain, encryptionKey);
  final client = httpClient ?? http_util.createHttpClient(allowInsecureTls: allowInsecureTls);
  final resp = await client.post(
    Uri.parse(endpoint),
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'me_id': plain.me_code,
    },
    body: jsonEncode(body),
  );
  if (resp.statusCode < 200 || resp.statusCode >= 300) {
    throw Exception('Payment Link request failed (${resp.statusCode}): ${resp.body}');
  }
  final raw = _parseMaybeJson(resp.body);
  final decrypted = _decryptKnownOrWhole(raw, encryptionKey);
  return PaymentLinkResult(
    raw: raw,
    decryptedResponse: decrypted,
    endpoint: endpoint,
  );
}

/// Send a dynamic Payment By Link request.
Future<PaymentLinkResult> sendPaymentByLink(
  PaymentByLinkPlain plain,
  String encryptionKey, {
  Environment environment = Environment.uat,
  String? endpointOverride,
  bool allowInsecureTls = false,
  http.Client? httpClient,
}) async {
  final endpoint = endpointOverride ?? Endpoints.paymentByLinkUrls[environment]!;
  final body = buildPaymentByLinkBody(plain, encryptionKey);
  final client = httpClient ?? http_util.createHttpClient(allowInsecureTls: allowInsecureTls);
  final resp = await client.post(
    Uri.parse(endpoint),
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'me_id': plain.me_id,
    },
    body: jsonEncode(body),
  );
  if (resp.statusCode < 200 || resp.statusCode >= 300) {
    throw Exception('Payment By Link request failed (${resp.statusCode}): ${resp.body}');
  }
  final raw = _parseMaybeJson(resp.body);
  final decrypted = _decryptKnownOrWhole(raw, encryptionKey);
  return PaymentLinkResult(
    raw: raw,
    decryptedResponse: decrypted,
    endpoint: endpoint,
  );
}

dynamic _parseMaybeJson(String body) {
  try {
    return jsonDecode(body);
  } catch (_) {
    return body;
  }
}

String? _decryptKnownOrWhole(dynamic raw, String encryptionKey) {
  try {
    String? enc;
    if (raw is Map<String, dynamic>) {
      enc = (raw['response'] ?? raw['data'] ?? raw['payload'] ?? raw['responseData'])?.toString();
    }
    enc ??= raw is String ? raw : null;
    if (enc != null && enc.isNotEmpty) {
      return aes256CbcDecrypt(enc, encryptionKey);
    }
  } catch (_) {}
  return null;
}
