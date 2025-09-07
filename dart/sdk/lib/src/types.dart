/// Core data models used by the YagoutPay Dart SDK.

/// Channel of initiation.
typedef Channel = String; // 'WEB' | 'MOBILE' | 'API'

/// Input model for building a YagoutPay request.
class TransactionDetails {
  final String aggregatorId;
  final String merchantId;
  final String orderNumber;
  final String amount;
  final String country;
  final String currency;
  final String transactionType;
  final String successUrl;
  final String failureUrl;
  final String channel; // 'WEB' | 'MOBILE' | 'API'

  final String? customerEmail;
  final String? customerMobile;

  // pg_details
  final String? pgId;
  final String? paymode;
  final String? schemeId;
  final String? walletType;

  // card_details
  final String? cardNumber;
  final String? expiryMonth;
  final String? expiryYear;
  final String? cvv;
  final String? cardName;

  // cust_details (extended)
  final String? customerName;
  final String? uniqueId;

  // bill_details
  final String? billAddress;
  final String? billCity;
  final String? billState;
  final String? billCountry;
  final String? billZip;

  // ship_details
  final String? shipAddress;
  final String? shipCity;
  final String? shipState;
  final String? shipCountry;
  final String? shipZip;
  final String? shipDays;
  final String? addressCount;

  // item_details
  final String? itemCount;
  final String? itemValue;
  final String? itemCategory;

  // UDFs
  final String? udf1;
  final String? udf2;
  final String? udf3;
  final String? udf4;
  final String? udf5;
  final String? udf6;
  final String? udf7;

  final String? isLoggedIn; // 'Y' | 'N'

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
    this.pgId,
    this.paymode,
    this.schemeId,
    this.walletType,
    this.cardNumber,
    this.expiryMonth,
    this.expiryYear,
    this.cvv,
    this.cardName,
    this.customerName,
    this.uniqueId,
    this.billAddress,
    this.billCity,
    this.billState,
    this.billCountry,
    this.billZip,
    this.shipAddress,
    this.shipCity,
    this.shipState,
    this.shipCountry,
    this.shipZip,
    this.shipDays,
    this.addressCount,
    this.itemCount,
    this.itemValue,
    this.itemCategory,
    this.udf1,
    this.udf2,
    this.udf3,
    this.udf4,
    this.udf5,
    this.udf6,
    this.udf7,
    this.isLoggedIn,
  });
}

/// Fully built WEB form payload and related debug fields.
class BuiltRequest {
  final String meId;
  final String merchantRequestPlain;
  final String merchantRequest;
  final String hashInput;
  final String hashHex;
  final String hash;
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

/// Raw response shape from the API integration endpoint.
class ApiIntegrationResponse {
  final String merchantId;
  final String status;
  final String statusMessage;
  final String? response;

  ApiIntegrationResponse({
    required this.merchantId,
    required this.status,
    required this.statusMessage,
    this.response,
  });

  factory ApiIntegrationResponse.fromJson(Map<String, dynamic> json) => ApiIntegrationResponse(
        merchantId: json['merchantId']?.toString() ?? '',
        status: json['status']?.toString() ?? '',
        statusMessage: json['statusMessage']?.toString() ?? '',
        response: json['response'] as String?,
      );
}

/// Structured result returned by the SDK for API requests.
class ApiRequestResult {
  final ApiIntegrationResponse raw;
  final String? decryptedResponse;
  final String endpoint;

  const ApiRequestResult({
    required this.raw,
    required this.decryptedResponse,
    required this.endpoint,
  });
}
