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

/// Plain payload for static Payment Link requests.
class PaymentLinkPlain {
  String ag_id = '';
  String ag_code = '';
  String ag_name = '';
  late String req_user_id;
  late String me_code;
  String me_name = '';
  String qr_code_id = '';
  String brandName = '';
  String qr_name = '';
  String status = '';
  String storeName = '';
  String store_id = '';
  String token = '';
  late String qr_transaction_amount;
  String logo = '';
  String store_email = '';
  String mobile_no = '';
  String udf = '';
  String udfmerchant = '';
  String file_name = '';
  String from_date = '';
  String to_date = '';
  String file_extn = '';
  String file_url = '';
  String file = '';
  String original_file_name = '';
  String successURL = '';
  String failureURL = '';
  String addAll = '';
  String source = '';

  Map<String, dynamic> toJson() => {
        'ag_id': ag_id,
        'ag_code': ag_code,
        'ag_name': ag_name,
        'req_user_id': req_user_id,
        'me_code': me_code,
        'me_name': me_name,
        'qr_code_id': qr_code_id,
        'brandName': brandName,
        'qr_name': qr_name,
        'status': status,
        'storeName': storeName,
        'store_id': store_id,
        'token': token,
        'qr_transaction_amount': qr_transaction_amount,
        'logo': logo,
        'store_email': store_email,
        'mobile_no': mobile_no,
        'udf': udf,
        'udfmerchant': udfmerchant,
        'file_name': file_name,
        'from_date': from_date,
        'to_date': to_date,
        'file_extn': file_extn,
        'file_url': file_url,
        'file': file,
        'original_file_name': original_file_name,
        'successURL': successURL,
        'failureURL': failureURL,
        'addAll': addAll,
        'source': source,
      };
}

/// Plain payload for dynamic Payment By Link requests.
class PaymentByLinkPlain {
  late String req_user_id;
  late String me_id;
  late String amount;
  String? customer_email = '';
  String? mobile_no = '';
  String? expiry_date = '';
  List<String>? media_type = const [];
  late String order_id;
  String? first_name = '';
  String? last_name = '';
  late String product;
  String? dial_code = '';
  String? failure_url = '';
  String? success_url = '';
  String? country = '';
  String? currency = '';

  Map<String, dynamic> toJson() => {
        'req_user_id': req_user_id,
        'me_id': me_id,
        'amount': amount,
        'customer_email': customer_email,
        'mobile_no': mobile_no,
        'expiry_date': expiry_date,
        'media_type': media_type,
        'order_id': order_id,
        'first_name': first_name,
        'last_name': last_name,
        'product': product,
        'dial_code': dial_code,
        'failure_url': failure_url,
        'success_url': success_url,
        'country': country,
        'currency': currency,
      };
}

/// Result from Payment Link API calls.
class PaymentLinkResult {
  final dynamic raw;
  final String? decryptedResponse;
  final String endpoint;

  const PaymentLinkResult({
    required this.raw,
    required this.decryptedResponse,
    required this.endpoint,
  });
}
