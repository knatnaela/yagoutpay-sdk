# YagoutPay Dart SDK (Monorepo Package)

Helpers for assembling YagoutPay requests (spec‑accurate), hashing, and AES‑256‑CBC encryption.

## Features
- Sectioned merchant_request assembly per spec
- SHA‑256 hex + encrypted hash
- AES‑256‑CBC (static IV 0123456789abcdef, PKCS7)
- Render auto‑submit HTML form
- Optional decrypt helper

## Install (local path)
In your Flutter/Dart app:
```yaml
dependencies:
  yagoutpay_sdk:
    path: ../sdk  # adjust path
```

## Quick start (Dart)
```dart
import 'package:yagoutpay_sdk/yagoutpay_sdk.dart';

final built = buildFormPayload(
  TransactionDetails(
    aggregatorId: 'yagout',
    merchantId: '<MERCHANT_ID>',
    orderNumber: '<ORDER_NO>',
    amount: '1',
    country: 'ETH',
    currency: 'ETB',
    transactionType: 'SALE',
    successUrl: '<SUCCESS_URL>',
    failureUrl: '<FAILURE_URL>',
    channel: 'WEB',
    isLoggedIn: 'Y',
  ),
  '<ENCRYPTION_KEY_BASE64>',
  actionUrl: '<ACTION_URL>'
);

print(built.merchantRequestPlain);
print(built.merchantRequest);
print(built.hashInput);
print(built.hashHex);
print(built.hash);
```

## Flutter InAppWebView example
Use the example app under `example/`:
- Builds the payload with buildFormPayload
- Uses renderAutoSubmitForm to create an auto‑submit form
- Loads it in an in‑app WebView and watches for success/failure URLs

```dart
final details = TransactionDetails(
  aggregatorId: 'yagout',
  merchantId: '<MERCHANT_ID>',
  orderNumber: '<ORDER_NO>',
  amount: '1',
  country: 'ETH',
  currency: 'ETB',
  transactionType: 'SALE',
  successUrl: '<SUCCESS_URL>',
  failureUrl: '<FAILURE_URL>',
  channel: 'WEB',
  isLoggedIn: 'Y',
);

Navigator.push(context, MaterialPageRoute(
  builder: (_) => YagoutCheckoutPage(
    encryptionKey: '<ENCRYPTION_KEY_BASE64>',
    details: details,
  ),
));
```

## Security
- Keep the encryption key secure; prefer server‑side assembly when possible
- Use non‑production data in demos
- Mask PII in UIs

## License
MIT
