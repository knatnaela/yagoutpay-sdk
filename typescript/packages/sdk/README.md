## YagoutPay TypeScript SDK

### Highlights
- **Spec-accurate assembly**: Builds `merchant_request` in the exact sectioned format required by the gateway
- **Modern crypto**: SHA‑256 + AES‑256‑CBC (static IV, PKCS7 padding)
- **Validation**: Clear, typed input checks with actionable messages
- **Forms made easy**: Generate an auto‑submit HTML form in one call

### Install (monorepo usage)
Add as a local dependency in your app package:
```json
{
  "dependencies": {
    "@yagoutpay/sdk": "file:../sdk"
  }
}
```

### Quick start
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

### API at a glance
- **buildFormPayload(details, encryptionKey, actionUrl?) → BuiltRequest**
- **createYagoutPay(config).build(details) → BuiltRequest**
- buildMerchantRequestPlain(details) → string
- buildHashInput(details) → string
- generateSha256Hex(input) → string
- encryptHashHex(hashHex, encryptionKey) → string
- renderAutoSubmitForm(payload) → string
- validateTransactionDetails(details) → void

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
