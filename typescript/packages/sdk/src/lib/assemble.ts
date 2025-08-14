import type { TransactionDetails } from '../types';

function joinPipe(fields: Array<string | undefined>): string {
  return fields.map((f) => f ?? '').join('|');
}

export function buildMerchantRequestPlain(details: TransactionDetails): string {
  const txn_details = joinPipe([
    details.aggregatorId,
    details.merchantId,
    details.orderNumber,
    details.amount,
    details.country,
    details.currency,
    details.transactionType,
    details.successUrl,
    details.failureUrl,
    details.channel,
  ]);

  const pg_details = joinPipe(['', '', '', '']);
  const card_details = joinPipe(['', '', '', '', '']);

  const cust_details = joinPipe([
    '',
    details.customerEmail ?? '',
    details.customerMobile ?? '',
    '',
    details.isLoggedIn ?? 'Y',
  ]);

  const bill_details = joinPipe(['', '', '', '', '']);
  const ship_details = joinPipe(['', '', '', '', '', '', '']);
  const item_details = joinPipe(['', '', '']);
  const reserved_empty = '';
  const udf_details = joinPipe(['', '', '', '', '']);

  return [
    txn_details,
    pg_details,
    card_details,
    cust_details,
    bill_details,
    ship_details,
    item_details,
    reserved_empty,
    udf_details,
  ].join('~');
}
