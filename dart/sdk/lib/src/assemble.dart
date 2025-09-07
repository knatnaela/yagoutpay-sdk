import 'dart:convert';
import 'types.dart';

String _joinPipe(List<String?> fields) => fields.map((f) => f ?? '').join('|');

/// Build the sectioned merchant_request string for WEB/MOBILE flows.
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

  final pgDetails = _joinPipe([d.pgId, d.paymode, d.schemeId, d.walletType]);
  final cardDetails = _joinPipe([d.cardNumber, d.expiryMonth, d.expiryYear, d.cvv, d.cardName]);
  final custDetails = _joinPipe([d.customerName, d.customerEmail, d.customerMobile, d.uniqueId, d.isLoggedIn ?? 'Y']);
  final billDetails = _joinPipe([d.billAddress, d.billCity, d.billState, d.billCountry, d.billZip]);
  final shipDetails =
      _joinPipe([d.shipAddress, d.shipCity, d.shipState, d.shipCountry, d.shipZip, d.shipDays, d.addressCount]);
  final itemDetails = _joinPipe([d.itemCount, d.itemValue, d.itemCategory]);
  final reserved = '';
  final udfDetails = _joinPipe([d.udf1, d.udf2, d.udf3, d.udf4, d.udf5]);

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

/// Build the API JSON string with exact field names per spec.
String buildApiMerchantRequestPlain(TransactionDetails d) {
  final payload = {
    'card_details': {
      'cardNumber': d.cardNumber ?? '',
      'expiryMonth': d.expiryMonth ?? '',
      'expiryYear': d.expiryYear ?? '',
      'cvv': d.cvv ?? '',
      'cardName': d.cardName ?? '',
    },
    'other_details': {
      'udf1': d.udf1 ?? '',
      'udf2': d.udf2 ?? '',
      'udf3': d.udf3 ?? '',
      'udf4': d.udf4 ?? '',
      'udf5': d.udf5 ?? '',
      'udf6': d.udf6 ?? '',
      'udf7': d.udf7 ?? '',
    },
    'ship_details': {
      'shipAddress': d.shipAddress ?? '',
      'shipCity': d.shipCity ?? '',
      'shipState': d.shipState ?? '',
      'shipCountry': d.shipCountry ?? '',
      'shipZip': d.shipZip ?? '',
      'shipDays': d.shipDays ?? '',
      'addressCount': d.addressCount ?? '',
    },
    'txn_details': {
      'agId': d.aggregatorId,
      'meId': d.merchantId,
      'orderNo': d.orderNumber,
      'amount': d.amount,
      'country': d.country,
      'currency': d.currency,
      'transactionType': d.transactionType,
      'sucessUrl': d.successUrl,
      'failureUrl': d.failureUrl,
      'channel': 'API',
    },
    'item_details': {
      'itemCount': d.itemCount ?? '',
      'itemValue': d.itemValue ?? '',
      'itemCategory': d.itemCategory ?? '',
    },
    'cust_details': {
      'customerName': d.customerName ?? '',
      'emailId': d.customerEmail ?? '',
      'mobileNumber': d.customerMobile ?? '',
      'uniqueId': d.uniqueId ?? '',
      'isLoggedIn': d.isLoggedIn ?? 'Y',
    },
    'pg_details': {
      'pg_Id': d.pgId ?? '',
      'paymode': d.paymode ?? '',
      'scheme_Id': d.schemeId ?? '',
      'wallet_type': d.walletType ?? '',
    },
    'bill_details': {
      'billAddress': d.billAddress ?? '',
      'billCity': d.billCity ?? '',
      'billState': d.billState ?? '',
      'billCountry': d.billCountry ?? '',
      'billZip': d.billZip ?? '',
    },
  };
  return jsonEncode(payload);
}
