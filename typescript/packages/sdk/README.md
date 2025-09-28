## YagoutPay TypeScript SDK

### Highlights
- **Spec-accurate assembly**: Builds `merchant_request` in the exact sectioned format required by the gateway
- **Modern crypto**: SHA‑256 + AES‑256‑CBC (static IV, PKCS7 padding)
- **Forms made easy**: Generate an auto‑submit HTML form in one call
- **Payment Links**: Create static or dynamic payment links via SDK helpers

### Install (monorepo usage)
Add as a local dependency in your app package:
```json
{
  "dependencies": {
    "@yagoutpay/sdk": "file:../sdk"
  }
}
```

### Quick start (WEB form)
```ts
import { buildFormPayload, renderAutoSubmitForm } from '@yagoutpay/sdk';

const built = buildFormPayload({
  aggregatorId: 'yagout',
  merchantId: '202504290002',
  orderNumber: '49340',
  amount: '1',
  country: 'ETH',
  currency: 'ETB',
  transactionType: 'SALE',
  successUrl: 'http://localhost/YagoutPay/transaction//Response.php',
  failureUrl: 'http://localhost/YagoutPay/transaction//Response.php',
  channel: 'WEB',
  isLoggedIn: 'Y',
}, 'ENCRYPTION_KEY');

// Built payload:
// built.me_id
// built.merchant_request_plain
// built.merchant_request
// built.hash_input, built.hash_hex, built.hash
// built.actionUrl

// Optional: auto-submit form markup
const html = renderAutoSubmitForm(built);
```

### Quick start (API integration)
```ts
import { createYagoutPay } from '@yagoutpay/sdk';

const yagout = createYagoutPay({
  merchantId: '202504290002',
  encryptionKey: 'ENCRYPTION_KEY',
  environment: 'uat',
});

const result = await yagout.api.send({
  aggregatorId: 'yagout',
  orderNumber: '49340',
  amount: '1',
  country: 'ETH',
  currency: 'ETB',
  transactionType: 'SALE',
  customerMobile: '0912345678',
  // pg_details are defaulted for convenience but can be overridden
});

console.log(result.endpoint, result.raw.status);
console.log(result.decryptedResponse); // optional plain response
```

### API at a glance
- **buildFormPayload(details, encryptionKey, actionUrl?) → BuiltRequest**
- **createYagoutPay(config).build(details) → BuiltRequest**
- **createYagoutPay(config).api.send(details, options?) → Promise<ApiRequestResult>**
- parseDecryptedResponse(text) → ParsedGatewayResponse
- parseApiResult(result) → ParsedGatewayResponse | undefined
- redactObject(obj), maskTail(value), previewBase64(value)
- toFormUrlEncoded(payload), toFormData(payload)
- buildMerchantRequestPlain(details) → string
- buildHashInput(details) → string
- generateSha256Hex(input) → string
- encryptHashHex(hashHex, encryptionKey) → string
- renderAutoSubmitForm(payload) → string

#### Payment Links
- sendPaymentLink(plain, encryptionKey, opts?) → Promise<PaymentLinkResult>
- createPaymentLinkClient(config).sendStatic(overrides?) → Promise<PaymentLinkResult>
- createPaymentLinkClient(config).sendDynamic(plain) → Promise<PaymentLinkResult>
- buildPaymentLinkBody(plain, encryptionKey) → { request }

### merchant_request layout
Joined with `~` as 9 sections:
1) txn_details (10): ag_id|me_id|order_no|amount|country|currency|txn_type|success_url|failure_url|channel
2) pg_details (4)
3) card_details (5)
4) cust_details (5)
5) bill_details (5)
6) ship_details (7)
7) item_details (3)
8) reserved
9) udf_details (5)

Example (single line):
```
yagout|202504290002|49340|1|ETH|ETB|SALE|http://localhost/YagoutPay/transaction//Response.php|http://localhost/YagoutPay/transaction//Response.php|WEB~|||~||||~||||Y~||||~||||||~||~~||||
```

### Security notes
- Keep keys server‑side; never log secrets
- Use non‑production data in demos/UAT
- Mask email/mobile in previews where applicable

### License
MIT

---

## Payment Links

YagoutPay Payment Links allow generating a pay URL/QR via the SDK using the gateway endpoint. The request payload is JSON, AES‑256‑CBC encrypted using your merchant key, and sent with the `me_id` header.

### Endpoint
- UAT: `https://uatcheckout.yagoutpay.com/ms-transaction-core-1-0/sdk/staticQRPaymentResponse`
- Prod: `https://checkout.yagoutpay.com/ms-transaction-core-1-0/sdk/staticQRPaymentResponse`

Headers:
- `me_id`: your merchant id (e.g. `202508080001`)

Body (encrypted):
```json
{ "request": "<base64 AES-256-CBC of plain JSON>" }
```

### Encryption / Decryption
- The SDK uses the same AES function for encryption and decryption:
  - AES‑256‑CBC
  - Static IV: `0123456789abcdef`
  - PKCS7 padding (manual)
  - Key provided as base64 string

### Static Payment Link
A predefined link for a fixed product/service.

```ts
import { createPaymentLinkClient } from '@yagoutpay/sdk';

const links = createPaymentLinkClient({
  merchantId: '202508080001',
  encryptionKey: process.env.YAGOUT_MERCHANT_KEY!,
  environment: 'uat',
  reqUserId: 'yagou381',
  staticDefaults: {
    amount: '500',
    order_id: 'ORDER_STATIC_001',
    product: 'Premium Subscription',
    currency: 'ETB',
    country: 'ETH',
    success_url: 'http://localhost:3000/success',
    failure_url: 'http://localhost:3000/failure',
    mobile_no: '0965680964',
    dial_code: '+251',
    expiry_date: '2025-12-31',
    media_type: ['API'],
    first_name: 'YagoutPay',
    last_name: 'StaticLink',
  },
});

const result = await links.sendStatic();
console.log(result.endpoint, result.raw);
```

### Dynamic Payment Link
Build links per transaction with flexible parameters.

```ts
import { createPaymentLinkClient } from '@yagoutpay/sdk';

const links = createPaymentLinkClient({
  merchantId: '202508080001',
  encryptionKey: process.env.YAGOUT_MERCHANT_KEY!,
  environment: 'uat',
});

const result = await links.sendDynamic({
  req_user_id: 'yagou381',
  amount: '1500',
  order_id: 'ORDER_' + Date.now(),
  product: 'Custom Invoice',
  currency: 'ETB',
  country: 'ETH',
  success_url: 'http://localhost:3000/success',
  failure_url: 'http://localhost:3000/failure',
  mobile_no: '0965680964',
  dial_code: '+251',
  expiry_date: '2025-12-31',
  media_type: ['API'],
});

console.log(result.endpoint, result.raw, result.decryptedResponse);
```

### Low-level helper
You can also encrypt the plain payload and send it yourself:

```ts
import { buildPaymentLinkBody, sendPaymentLink } from '@yagoutpay/sdk';

const plain = {
  req_user_id: 'yagou381',
  me_id: '202508080001',
  amount: '500',
  order_id: 'ORDER_STATIC_001',
  currency: 'ETB',
  country: 'ETH',
  success_url: 'http://localhost:3000/success',
  failure_url: 'http://localhost:3000/failure',
  mobile_no: '0965680964',
  dial_code: '+251',
  expiry_date: '2025-12-31',
  media_type: ['API'],
};

const body = buildPaymentLinkBody(plain, process.env.YAGOUT_MERCHANT_KEY!);
const result = await sendPaymentLink(plain, process.env.YAGOUT_MERCHANT_KEY!);
```

### Testing steps (UAT)
1. Set environment variables: `YAGOUT_MERCHANT_ID`, `YAGOUT_MERCHANT_KEY`
2. In your app, instantiate `createPaymentLinkClient({...})` with `environment: 'uat'`
3. Call `sendStatic()` or `sendDynamic({...})`
4. Inspect `result.raw` for status/URL fields (provider dependent); if an encrypted `response` field is present, the SDK will try to decrypt it and place plain text in `result.decryptedResponse`.
5. Verify the link or QR in the response opens the hosted payment page.

Notes:
- Do not log your merchant key.
- Use UAT values and test numbers.
