import type { TransactionDetails } from '../types';

/**
 * Join an array of (possibly undefined) strings with a pipe, replacing undefined with empty string.
 */
function joinPipe(fields: Array<string | undefined>): string {
  return fields.map((f) => f ?? '').join('|');
}

/**
 * Build the sectioned merchant_request string for WEB/MOBILE flows.
 */
export function buildMerchantRequestPlain(details: TransactionDetails): string {
  const txn_details = joinPipe([
    details.aggregatorId,
    details.merchantId,
    details.orderNumber,
    details.amount,
    details.country,
    details.currency,
    details.transactionType,
    details.successUrl ?? '',
    details.failureUrl ?? '',
    details.channel,
  ]);

  const pg_details = joinPipe([
    details.pgId,
    details.paymode,
    details.schemeId,
    details.walletType,
  ]);
  const card_details = joinPipe([
    details.cardNumber,
    details.expiryMonth,
    details.expiryYear,
    details.cvv,
    details.cardName,
  ]);

  const cust_details = joinPipe([
    details.customerName ?? '',
    details.customerEmail ?? '',
    details.customerMobile ?? '',
    details.uniqueId ?? '',
    details.isLoggedIn ?? 'Y',
  ]);

  const bill_details = joinPipe([
    details.billAddress,
    details.billCity,
    details.billState,
    details.billCountry,
    details.billZip,
  ]);
  const ship_details = joinPipe([
    details.shipAddress,
    details.shipCity,
    details.shipState,
    details.shipCountry,
    details.shipZip,
    details.shipDays,
    details.addressCount,
  ]);
  const item_details = joinPipe([
    details.itemCount,
    details.itemValue,
    details.itemCategory,
  ]);
  // Section 8 in web flow is reserved empty; API expects fraud_details here (kept empty unless specified)
  const fraud_details = '';
  // Section 9: udf_details (web: 5 fields), API other_details may accept 7
  const udf_details = details.channel === 'API'
    ? joinPipe([
      details.udf1,
      details.udf2,
      details.udf3,
      details.udf4,
      details.udf5,
      details.udf6,
      details.udf7,
    ])
    : joinPipe([
      details.udf1,
      details.udf2,
      details.udf3,
      details.udf4,
      details.udf5,
    ]);

  return [
    txn_details,
    pg_details,
    card_details,
    cust_details,
    bill_details,
    ship_details,
    item_details,
    fraud_details,
    udf_details,
  ].join('~');
}

/**
 * Build the API merchantRequest JSON string with exact field names per spec.
 */
export function buildApiMerchantRequestPlain(details: TransactionDetails): string {
  const apiPayload = {
    card_details: {
      cardNumber: details.cardNumber ?? '',
      expiryMonth: details.expiryMonth ?? '',
      expiryYear: details.expiryYear ?? '',
      cvv: details.cvv ?? '',
      cardName: details.cardName ?? '',
    },
    other_details: {
      udf1: details.udf1 ?? '',
      udf2: details.udf2 ?? '',
      udf3: details.udf3 ?? '',
      udf4: details.udf4 ?? '',
      udf5: details.udf5 ?? '',
      udf6: details.udf6 ?? '',
      udf7: details.udf7 ?? '',
    },
    ship_details: {
      shipAddress: details.shipAddress ?? '',
      shipCity: details.shipCity ?? '',
      shipState: details.shipState ?? '',
      shipCountry: details.shipCountry ?? '',
      shipZip: details.shipZip ?? '',
      shipDays: details.shipDays ?? '',
      addressCount: details.addressCount ?? '',
    },
    txn_details: {
      agId: details.aggregatorId,
      meId: details.merchantId,
      orderNo: details.orderNumber,
      amount: details.amount,
      country: details.country,
      currency: details.currency,
      transactionType: details.transactionType,
      sucessUrl: details.successUrl ?? '',
      failureUrl: details.failureUrl ?? '',
      channel: 'API',
    },
    item_details: {
      itemCount: details.itemCount ?? '',
      itemValue: details.itemValue ?? '',
      itemCategory: details.itemCategory ?? '',
    },
    cust_details: {
      customerName: details.customerName ?? '',
      emailId: details.customerEmail ?? '',
      mobileNumber: details.customerMobile ?? '',
      uniqueId: details.uniqueId ?? '',
      isLoggedIn: details.isLoggedIn ?? 'Y',
    },
    pg_details: {
      pg_Id: details.pgId ?? '',
      paymode: details.paymode ?? '',
      scheme_Id: details.schemeId ?? '',
      wallet_type: details.walletType ?? '',
    },
    bill_details: {
      billAddress: details.billAddress ?? '',
      billCity: details.billCity ?? '',
      billState: details.billState ?? '',
      billCountry: details.billCountry ?? '',
      billZip: details.billZip ?? '',
    },
  };
  return JSON.stringify(apiPayload);
}
