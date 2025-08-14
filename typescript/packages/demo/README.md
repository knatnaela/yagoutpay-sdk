## YagoutPay Demo (TypeScript)

A private demo app that showcases the YagoutPay SDK. Build payloads, preview plain/encrypted values, and submit to the UAT gateway.

### What it does
- Server renders a small UI (Tailwind)
- Builds `merchant_request` and `hash` on the server using `@yagoutpay/sdk`
- Displays:
  - me_id
  - merchant_request (plain)
  - merchant_request (encrypted)
  - hash_input / hash_hex / hash (encrypted)
- Posts a form to the UAT action URL when you click “Pay Now”

### Prerequisites
- Node.js 18+

### Setup
Create a `.env` file in this folder:
```
YAGOUT_MERCHANT_ID=<MERCHANT_ID>
YAGOUT_MERCHANT_KEY=<ENCRYPTION_KEY>
```

### Install & run
```bash
cd typescript/packages/demo
npm install
npm run dev
# Open http://localhost:3000
```

### How to use
1) Enter amount and order number (defaults provided)
2) Click “Build Payload” to generate and preview values
3) Click “Pay Now” to post to the UAT gateway

### Security notes
- Encryption key stays on the server; never expose or log it
- Use non‑production data here
- In production, hide or mask previews and disable debug output

### Relationship to the SDK
Depends on `@yagoutpay/sdk` via local file link. See the SDK README for full API details.

