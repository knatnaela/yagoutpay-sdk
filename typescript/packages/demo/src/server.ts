import express from 'express';
import 'dotenv/config';
import { buildFormPayload, aes256CbcDecrypt, createYagoutPay, buildApiRequestBody, sendApiIntegration } from '@yagoutpay/sdk';

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Configure undici to allow insecure TLS if ALLOW_INSECURE_TLS=1
if (process.env.ALLOW_INSECURE_TLS === '1') {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const undici = require('undici');
  const dispatcher = new undici.Agent({ connect: { rejectUnauthorized: false } });
  undici.setGlobalDispatcher(dispatcher);
  // eslint-disable-next-line no-console
  console.warn('[demo] ALLOW_INSECURE_TLS=1: TLS certificate verification is disabled (debug only)');
}

// Demo creds (UAT) via env
const MERCHANT_ID = process.env.YAGOUT_MERCHANT_ID || '';
const MERCHANT_KEY = process.env.YAGOUT_MERCHANT_KEY || '';
const MERCHANT_KEY_API = process.env.YAGOUT_MERCHANT_KEY_API || MERCHANT_KEY;

if (!MERCHANT_ID || !MERCHANT_KEY) {
  // eslint-disable-next-line no-console
  console.error('[YagoutPay Demo] Missing env vars YAGOUT_MERCHANT_ID or YAGOUT_MERCHANT_KEY');
  process.exit(1);
}

const yagout = createYagoutPay({ merchantId: MERCHANT_ID, encryptionKey: MERCHANT_KEY, environment: 'uat' });

app.get('/', (_req: express.Request, res: express.Response) => {
  const orderDefault = `ORDER${Date.now()}`;
  res.type('html').send(`
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>YagoutPay Demo</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="bg-slate-50">
    <div class="max-w-4xl mx-auto p-6">
      <h1 class="text-2xl font-semibold text-slate-800">YagoutPay Checkout Demo</h1>
      <p class="text-slate-500 mb-6">Build doc-accurate payloads, preview plain/encrypted values, and submit to gateway.</p>

      <div class="grid md:grid-cols-2 gap-6">
        <div class="bg-white rounded-xl shadow p-5">
          <h2 class="font-medium text-slate-700 mb-4">Payment Details</h2>
          <div class="space-y-4">
            <div>
              <label class="block text-sm text-slate-600 mb-1">Amount (ETB)</label>
              <input id="amount" class="w-full border rounded-lg px-3 py-2" type="text" value="10" />
            </div>
            <div>
              <label class="block text-sm text-slate-600 mb-1">Order No</label>
              <input id="order_no" class="w-full border rounded-lg px-3 py-2" type="text" value="${orderDefault}" />
            </div>
            <div>
              <label class="block text-sm text-slate-600 mb-1">Email</label>
              <input id="email" class="w-full border rounded-lg px-3 py-2" type="email" value="buyer@example.com" />
            </div>
            <div>
              <label class="block text-sm text-slate-600 mb-1">Mobile</label>
              <input id="mobile" class="w-full border rounded-lg px-3 py-2" type="text" value="0912345678" />
            </div>

            <div class="flex gap-3 pt-2">
              <button id="buildBtn" class="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2">Build Payload</button>
              <button id="payBtn" class="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2" disabled>Pay Now</button>
              <button id="apiBtn" class="bg-sky-600 hover:bg-sky-700 text-white rounded-lg px-4 py-2">Send API Request</button>
            </div>
            <p id="error" class="text-sm text-rose-600 hidden"></p>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow p-5">
          <h2 class="font-medium text-slate-700 mb-4">Preview</h2>
          <div class="space-y-3 text-sm">
            <div>
              <div class="flex items-center justify-between">
                <span class="text-slate-600">me_id</span>
                <button data-copy="me_id" class="text-indigo-600 text-xs">Copy</button>
              </div>
              <pre id="me_id" class="bg-slate-50 border rounded p-2 overflow-x-auto"></pre>
            </div>
            <div>
              <div class="flex items-center justify-between">
                <span class="text-slate-600">merchant_request (plain)</span>
                <button data-copy="plain" class="text-indigo-600 text-xs">Copy</button>
              </div>
              <pre id="plain" class="bg-slate-50 border rounded p-2 overflow-x-auto"></pre>
            </div>
            <div>
              <div class="flex items-center justify-between">
                <span class="text-slate-600">merchant_request (encrypted)</span>
                <button data-copy="merchant_request" class="text-indigo-600 text-xs">Copy</button>
              </div>
              <pre id="merchant_request" class="bg-slate-50 border rounded p-2 overflow-x-auto"></pre>
            </div>
            <div>
              <div class="flex items-center justify-between">
                <span class="text-slate-600">hash_input</span>
                <button data-copy="hash_input" class="text-indigo-600 text-xs">Copy</button>
              </div>
              <pre id="hash_input" class="bg-slate-50 border rounded p-2 overflow-x-auto"></pre>
            </div>
            <div>
              <div class="flex items-center justify-between">
                <span class="text-slate-600">hash_hex</span>
                <button data-copy="hash_hex" class="text-indigo-600 text-xs">Copy</button>
              </div>
              <pre id="hash_hex" class="bg-slate-50 border rounded p-2 overflow-x-auto"></pre>
            </div>
            <div>
              <div class="flex items-center justify-between">
                <span class="text-slate-600">hash (encrypted)</span>
                <button data-copy="hash" class="text-indigo-600 text-xs">Copy</button>
              </div>
              <pre id="hash" class="bg-slate-50 border rounded p-2 overflow-x-auto"></pre>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow p-5">
          <h2 class="font-medium text-slate-700 mb-4">API Response</h2>
          <div class="space-y-3 text-sm">
            <div>
              <div class="flex items-center justify-between">
                <span class="text-slate-600">Raw</span>
                <button data-copy="api_raw" class="text-indigo-600 text-xs">Copy</button>
              </div>
              <pre id="api_raw" class="bg-slate-50 border rounded p-2 overflow-x-auto"></pre>
            </div>
            <div>
              <div class="flex items-center justify-between">
                <span class="text-slate-600">Decrypted</span>
                <button data-copy="api_decrypted" class="text-indigo-600 text-xs">Copy</button>
              </div>
              <pre id="api_decrypted" class="bg-slate-50 border rounded p-2 overflow-x-auto"></pre>
            </div>
          </div>
        </div>
      </div>

      <form id="payForm" method="POST" class="hidden"></form>
    </div>

    <script>
      let lastPayload = null;
      const qs = (s) => document.querySelector(s);
      const show = (id, v='') => (qs('#'+id).textContent = v || '');
      const copy = (id) => navigator.clipboard.writeText(qs('#'+id).textContent || '');

      document.querySelectorAll('[data-copy]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          copy(btn.getAttribute('data-copy'));
        });
      });

      qs('#buildBtn').addEventListener('click', async () => {
        qs('#error').classList.add('hidden');
        try {
          const body = {
            amount: qs('#amount').value,
            order_no: qs('#order_no').value,
            email: qs('#email').value,
            mobile: qs('#mobile').value,
          };
          const resp = await fetch('/api/build', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
          const data = await resp.json();
          if (!data.success) throw new Error(data.error || 'Failed');
          lastPayload = data.data;
          show('me_id', data.data.me_id);
          show('plain', data.data.merchant_request_plain);
          show('merchant_request', data.data.merchant_request);
          show('hash_input', data.data.hash_input);
          show('hash_hex', data.data.hash_hex);
          show('hash', data.data.hash);
          qs('#payBtn').disabled = false;
        } catch (err) {
          qs('#error').textContent = err.message;
          qs('#error').classList.remove('hidden');
        }
      });

      qs('#payBtn').addEventListener('click', () => {
        if (!lastPayload) return;
        const form = qs('#payForm');
        form.setAttribute('action', lastPayload.actionUrl);
        form.innerHTML = '';
        const fields = [
          ['me_id', lastPayload.me_id],
          ['merchant_request', lastPayload.merchant_request],
          ['hash', lastPayload.hash],
        ];
        fields.forEach(([name, value]) => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = name;
          input.value = value;
          form.appendChild(input);
        });
        form.submit();
      });

      qs('#apiBtn').addEventListener('click', async () => {
        qs('#error').classList.add('hidden');
        show('api_raw', '');
        show('api_decrypted', '');
        try {
          const body = {
            amount: qs('#amount').value,
            order_no: qs('#order_no').value,
            email: qs('#email').value,
            mobile: qs('#mobile').value,
          };
          const resp = await fetch('/api/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
          const data = await resp.json();
          if (!data.success) throw new Error(data.error || 'Failed');
          show('api_raw', JSON.stringify(data.data.raw, null, 2));
          show('api_decrypted', data.data.decryptedResponse || '');
        } catch (err) {
          qs('#error').textContent = err.message;
          qs('#error').classList.remove('hidden');
        }
      });
    </script>
  </body>
  </html>
  `);
});

app.post('/api/build', (req: express.Request, res: express.Response) => {
  try {
    const amount = String(req.body.amount ?? '10');
    const order_no = String(req.body.order_no ?? `ORDER${Date.now()}`);
    const email = String(req.body.email);
    const mobile = String(req.body.mobile);
    const baseUrl = `${req.protocol}://${req.get('host')}`;

    const details = {
      aggregatorId: 'yagout',
      merchantId: MERCHANT_ID,
      orderNumber: order_no,
      amount,
      country: 'ETH',
      currency: 'ETB',
      transactionType: 'SALE',
      successUrl: `${baseUrl}/success`,
      failureUrl: `${baseUrl}/failure`,
      channel: 'WEB' as const,
      customerEmail: email,
      customerMobile: mobile,
      isLoggedIn: 'Y' as const,

    };

    const built = buildFormPayload(details, MERCHANT_KEY);

    return res.json({ success: true, data: built });
  } catch (err) {
    return res.status(400).json({ success: false, error: (err as Error).message });
  }
});

app.post('/api/send', async (req: express.Request, res: express.Response) => {
  try {
    const amount = String(req.body.amount ?? '10');
    const order_no = String(req.body.order_no ?? `ORDER${Date.now()}`);
    const email = String(req.body.email);
    const mobile = String(req.body.mobile);

    const details = {
      aggregatorId: 'yagout',
      orderNumber: order_no,
      amount,
      country: 'ETH',
      currency: 'ETB',
      transactionType: 'SALE',
      customerEmail: email,
      customerMobile: mobile,
      // API required pg_details
      pgId: '67ee846571e740418d688c3f',
      paymode: 'WA',
      schemeId: '7',
      walletType: 'telebirr',
      successUrl: '',
      failureUrl: '',
    } as const;

    // Build and preview API merchant_request_plain for diagnostics
    const preview = buildApiRequestBody({ merchantId: MERCHANT_ID, ...details, channel: 'API' }, MERCHANT_KEY_API);
    // eslint-disable-next-line no-console
    console.log('[demo] API merchant_request_plain length:', preview.merchantRequestPlain.length);
    // eslint-disable-next-line no-console
    console.log('[demo] API merchant_request_plain snippet:', preview.merchantRequestPlain.slice(0, 400));
    // eslint-disable-next-line no-console
    console.log('[demo] Sending API request with details:', JSON.stringify(details));

    const result = await sendApiIntegration({ merchantId: MERCHANT_ID, ...details, channel: 'API' }, MERCHANT_KEY_API, { fetchImpl: loggedFetch as unknown as typeof fetch });

    // eslint-disable-next-line no-console
    console.log('[demo] API response status:', result.raw?.status, 'message:', result.raw?.statusMessage);

    return res.json({ success: true, data: result });
  } catch (err) {
    // eslint-disable-next-line no-console
    const e = err as Error & { cause?: unknown };
    // eslint-disable-next-line no-console
    console.error('[demo] API request failed:', e.name, e.message);
    if (e.cause) {
      const c = e.cause as Record<string, unknown>;
      // eslint-disable-next-line no-console
      console.error('[demo] API error cause:', {
        name: (c?.name as string) || undefined,
        code: (c?.code as string) || undefined,
        message: (c?.message as string) || undefined,
      });
    }
    return res.status(400).json({ success: false, error: (err as Error).message });
  }
});

// Wrapper around global fetch to log request/response and errors
async function loggedFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = typeof input === 'string' ? input : (input instanceof URL ? input.toString() : (input as Request).url);
  const method = init?.method || 'POST';
  const headers = init?.headers ? Object.fromEntries(new Headers(init.headers as HeadersInit).entries()) : {};
  const bodyPreview = typeof init?.body === 'string' ? (init?.body as string).slice(0, 512) : '[non-string body]';
  // eslint-disable-next-line no-console
  console.log('[demo] fetch →', method, url, 'headers:', headers, 'body:', bodyPreview);
  try {
    const resp = await fetch(url, init);
    const text = await resp.clone().text().catch(() => '');
    // eslint-disable-next-line no-console
    console.log('[demo] fetch ←', resp.status, resp.statusText, 'body:', text.slice(0, 512));
    return resp;
  } catch (e) {
    // eslint-disable-next-line no-console
    const err = e as Error & { cause?: unknown };
    console.error('[demo] fetch threw:', err.name, err.message);
    if (err.cause) {
      const c = err.cause as Record<string, unknown>;
      console.error('[demo] fetch cause:', {
        name: (c?.name as string) || undefined,
        code: (c?.code as string) || undefined,
        message: (c?.message as string) || undefined,
      });
    }
    throw e;
  }
}


// Success and Failure callback endpoints to receive gateway responses
app.post('/success', (req: express.Request, res: express.Response) => {
  const raw = { method: req.method, query: req.query, body: req.body } as const;
  const decrypted = decryptKnownFields(req.body, MERCHANT_KEY);
  res.type('html').send(renderCallbackPage({
    title: 'Payment Success',
    tone: 'success',
    raw,
    decrypted,
  }));
});

app.all('/failure', (req: express.Request, res: express.Response) => {
  const raw = { method: req.method, query: req.query, body: req.body } as const;
  const decrypted = decryptKnownFields(req.body, MERCHANT_KEY);
  res.type('html').send(renderCallbackPage({
    title: 'Payment Failed',
    tone: 'failure',
    raw,
    decrypted,
  }));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Demo listening on http://localhost:${PORT}`);
});

function escapeHtml(value: string): string {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

type DecryptedMap = Record<string, string>;

function decryptKnownFields(body: Record<string, unknown>, encryptionKey: string): DecryptedMap {
  const fields = [
    'txn_response',
    'pg_details',
    'txn_details',
    'other_details',
    'fraud_details',
    'card_details',
    'cust_details',
    'bill_details',
    'ship_details',
  ];
  const out: DecryptedMap = {};
  for (const key of fields) {
    const val = body?.[key];
    if (typeof val === 'string' && val.length > 0) {
      try {
        out[key] = aes256CbcDecrypt(val, encryptionKey);
      } catch {
        out[key] = '(unable to decrypt)';
      }
    }
  }
  return out;
}

function renderCallbackPage(params: { title: string; tone: 'success' | 'failure'; raw: unknown; decrypted: DecryptedMap; }): string {
  const toneClass = params.tone === 'success' ? 'text-emerald-700' : 'text-rose-700';
  const decryptedList = Object.keys(params.decrypted).length
    ? Object.entries(params.decrypted)
      .map(([k, v]) => `<div class=\"mb-3\"><div class=\"text-xs text-slate-500\">${escapeHtml(k)}</div><pre class=\"bg-slate-50 border rounded p-2 overflow-x-auto text-sm\">${escapeHtml(v)}</pre></div>`)
      .join('')
    : '<div class="text-slate-500">No decryptable fields found.</div>';

  return `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(params.title)}</title>
      <script src="https://cdn.tailwindcss.com"></script>
    </head>
    <body class="bg-slate-50">
      <div class="max-w-5xl mx-auto p-6">
        <h2 class="text-xl font-semibold ${toneClass}">${escapeHtml(params.title)}</h2>
        <div class="grid md:grid-cols-2 gap-6 mt-4">
          <div class="bg-white rounded-xl shadow p-5">
            <h3 class="font-medium text-slate-700 mb-3">Gateway Data (Raw)</h3>
            <pre class="bg-slate-50 border rounded p-3 overflow-x-auto text-sm">${escapeHtml(JSON.stringify(params.raw, null, 2))}</pre>
          </div>
          <div class="bg-white rounded-xl shadow p-5">
            <h3 class="font-medium text-slate-700 mb-3">Decrypted Sections</h3>
            ${decryptedList}
          </div>
        </div>
        <a href="/" class="inline-block mt-6 text-indigo-600">Back</a>
      </div>
    </body>
  </html>`;
}

