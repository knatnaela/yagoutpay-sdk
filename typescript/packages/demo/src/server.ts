import express from 'express';
import 'dotenv/config';
import { buildFormPayload, aes256CbcDecrypt, createYagoutPay, sendApiIntegration, DEFAULT_PG_OPTIONS, API_DEFAULTS } from '@yagoutpay/sdk';

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

// Simple in-memory catalog (prices in cents)
const CATALOG = [
  { id: 'coffee', name: 'Yagout Coffee Beans 500g', priceCents: 8500, image: 'https://images.unsplash.com/photo-1503481766315-7a586b20f66f?q=80&w=800&auto=format&fit=crop' },
  { id: 'mug', name: 'Signature Ceramic Mug', priceCents: 100, image: 'https://images.unsplash.com/photo-1481349518771-20055b2a7b24?q=80&w=800&auto=format&fit=crop' },
  { id: 'tshirt', name: 'Comfort Tee', priceCents: 6900, image: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=800&auto=format&fit=crop' },
  { id: 'cap', name: 'Dad Hat', priceCents: 4500, image: 'https://images.unsplash.com/photo-1521123845560-14093637aa7a?q=80&w=800&auto=format&fit=crop' },
  { id: 'sticker', name: 'Sticker Pack', priceCents: 900, image: 'https://images.unsplash.com/photo-1622551243908-05f646813e6e?q=80&w=800&auto=format&fit=crop' },
];

function findPriceCents(id: string): number | undefined {
  return CATALOG.find((p) => p.id === id)?.priceCents;
}

function centsToAmountString(cents: number): string {
  return (cents / 100).toFixed(2);
}

app.get('/', (_req: express.Request, res: express.Response) => {
  res.type('html').send(`
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>YagoutPay • Checkout Demo</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
  <body class="bg-slate-50">
    <div class="max-w-5xl mx-auto p-6">
      <header class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-semibold text-slate-800">YagoutPay Checkout</h1>
        <nav class="text-sm text-slate-500">UAT</nav>
      </header>

      <div class="bg-white rounded-2xl shadow p-6">
        <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 class="text-lg font-medium text-slate-800">Make a payment</h2>
            <p class="text-slate-500 text-sm">Choose a mode and enter your details to proceed.</p>
          </div>
          <div class="inline-flex bg-slate-100 rounded-lg p-1">
            <button id="modeForm" class="px-3 py-1.5 text-sm rounded-md bg-white shadow">Hosted Form</button>
            <button id="modeApi" class="px-3 py-1.5 text-sm rounded-md text-slate-600">Direct API</button>
          </div>
        </div>

        <div class="grid md:grid-cols-3 gap-6 mt-6">
          <div class="md:col-span-2">
            <div id="catalog" class="grid sm:grid-cols-2 gap-4"></div>
          </div>
          <div>
            <div class="border rounded-xl p-4">
              <div class="text-sm font-medium text-slate-700 mb-3">Your Cart</div>
              <div id="cart" class="space-y-3"></div>
              <div class="border-t my-3"></div>
              <div class="flex items-center justify-between text-sm mb-1"><span class="text-slate-600">Subtotal</span><span id="subtotal" class="font-medium">ETB 0.00</span></div>
              <div class="flex items-center justify-between text-sm mb-3"><span class="text-slate-500">Shipping</span><span class="text-slate-500">Free</span></div>
              <div class="flex items-center justify-between text-base"><span class="text-slate-700">Total</span><span id="total" class="font-semibold">ETB 0.00</span></div>
              <div class="mt-4 space-y-3">
                <div id="pgRow">
                  <label for="pg" class="block text-sm text-slate-600 mb-1">Payment method</label>
                  <select id="pg" class="w-full border rounded-lg px-3 py-2"></select>
                </div>
                <div id="emailRow">
                  <input id="email" class="w-full border rounded-lg px-3 py-2" type="email" placeholder="Email (optional)" />
                </div>
                <div id="mobileRow">
                  <input id="mobile" class="w-full border rounded-lg px-3 py-2" type="text" placeholder="Mobile (required for API)" />
                </div>
                <button id="continueBtn" class="w-full bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2">Checkout</button>
                <p id="error" class="text-sm text-rose-600 hidden"></p>
              </div>
            </div>
            <div id="apiCard" class="hidden md:block mt-6">
              <div class="border rounded-xl p-4 h-full">
                <div class="text-sm text-slate-600 mb-2">API Response</div>
                <pre id="api_raw" class="bg-slate-50 border rounded p-2 overflow-x-auto text-sm"></pre>
                <div class="text-xs text-slate-500 mt-2">Decrypted</div>
                <pre id="api_decrypted" class="bg-slate-50 border rounded p-2 overflow-x-auto text-sm"></pre>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer class="text-center text-xs text-slate-500 mt-6">
        For demo purposes only • Do not use real card details
      </footer>

      <form id="payForm" method="POST" class="hidden"></form>
    </div>

    <script>
      const CATALOG = ${JSON.stringify(CATALOG)};
      const PG_OPTIONS = ${JSON.stringify(DEFAULT_PG_OPTIONS)};
      let mode = 'form';
      const qs = (s) => document.querySelector(s);
      const show = (id, v='') => (qs('#'+id).textContent = v || '');
      const cart = new Map();
      const btn = qs('#continueBtn');

      function setLoading(isLoading){
        if (isLoading){
          if (!btn.dataset.oldText) btn.dataset.oldText = btn.textContent || 'Checkout';
          btn.disabled = true;
          btn.classList.add('opacity-60','cursor-not-allowed');
          btn.textContent = 'Processing…';
          btn.setAttribute('aria-busy','true');
        } else {
          btn.disabled = false;
          btn.classList.remove('opacity-60','cursor-not-allowed');
          btn.textContent = btn.dataset.oldText || 'Checkout';
          btn.removeAttribute('aria-busy');
        }
      }

      function priceLabel(cents){ return 'ETB ' + (cents/100).toFixed(2); }

      function renderCatalog(){
        const root = qs('#catalog');
        root.innerHTML = '';
        CATALOG.forEach(function(p){
          const div = document.createElement('div');
          div.className = 'border rounded-xl overflow-hidden bg-white';
          div.innerHTML = '' +
            '<div class="aspect-[4/3] bg-slate-100">' +
              '<img src="' + p.image + '" alt="' + p.name + '" class="w-full h-full object-cover"/>' +
            '</div>' +
            '<div class="p-3">' +
              '<div class="text-sm font-medium text-slate-800">' + p.name + '</div>' +
              '<div class="text-sm text-slate-600">' + priceLabel(p.priceCents) + '</div>' +
              '<button data-add="' + p.id + '" class="mt-3 inline-flex items-center justify-center px-3 py-1.5 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700">Add to cart</button>' +
            '</div>';
          root.appendChild(div);
        });
        root.querySelectorAll('[data-add]').forEach(function(btn){
          btn.addEventListener('click', function(){
            const id = btn.getAttribute('data-add');
            const current = cart.get(id) || 0;
            cart.set(id, current + 1);
            renderCart();
          });
        });
      }

      function renderCart(){
        const root = qs('#cart');
        root.innerHTML = '';
        let subtotal = 0;
        cart.forEach(function(qty, id){
          const p = CATALOG.find(function(x){ return x.id===id; });
          if (!p) return;
          const line = p.priceCents * qty;
          subtotal += line;
          const div = document.createElement('div');
          div.className = 'flex items-center justify-between';
          div.innerHTML = '' +
            '<div>' +
              '<div class="text-sm text-slate-800">' + p.name + '</div>' +
              '<div class="text-xs text-slate-500">' + priceLabel(p.priceCents) + ' × ' + qty + '</div>' +
            '</div>' +
            '<div class="flex items-center gap-2">' +
              '<button data-dec="' + id + '" class="px-2 py-1 rounded border">-</button>' +
              '<span class="w-6 text-center">' + qty + '</span>' +
              '<button data-inc="' + id + '" class="px-2 py-1 rounded border">+</button>' +
              '<div class="w-20 text-right text-sm font-medium">' + priceLabel(line) + '</div>' +
            '</div>';
          root.appendChild(div);
        });
        if (cart.size === 0) {
          root.innerHTML = '<div class="text-slate-500 text-sm">Your cart is empty.</div>';
        }
        qs('#subtotal').textContent = priceLabel(subtotal);
        qs('#total').textContent = priceLabel(subtotal);

        root.querySelectorAll('[data-inc]').forEach(function(btn){
          btn.addEventListener('click', function(){
            const id = btn.getAttribute('data-inc');
            const current = cart.get(id) || 0;
            cart.set(id, current + 1);
            renderCart();
          });
        });
        root.querySelectorAll('[data-dec]').forEach(function(btn){
          btn.addEventListener('click', function(){
            const id = btn.getAttribute('data-dec');
            const current = cart.get(id) || 0;
            const next = Math.max(0, current - 1);
            if (next === 0) cart.delete(id); else cart.set(id, next);
            renderCart();
          });
        });
      }

      const setMode = (m) => {
        mode = m;
        if (m === 'form') {
          qs('#modeForm').classList.add('bg-white','shadow');
          qs('#modeForm').classList.remove('text-slate-600');
          qs('#modeApi').classList.remove('bg-white','shadow');
          qs('#modeApi').classList.add('text-slate-600');
          qs('#apiCard').classList.add('hidden');
          // hide inputs not needed for hosted form
          qs('#pgRow').classList.add('hidden');
          qs('#emailRow').classList.add('hidden');
          qs('#mobileRow').classList.add('hidden');
        } else {
          qs('#modeApi').classList.add('bg-white','shadow');
          qs('#modeApi').classList.remove('text-slate-600');
          qs('#modeForm').classList.remove('bg-white','shadow');
          qs('#modeForm').classList.add('text-slate-600');
          qs('#apiCard').classList.remove('hidden');
          // show inputs needed for API
          qs('#pgRow').classList.remove('hidden');
          qs('#emailRow').classList.remove('hidden');
          qs('#mobileRow').classList.remove('hidden');
        }
      };
      qs('#modeForm').addEventListener('click', (e) => { e.preventDefault(); setMode('form'); });
      qs('#modeApi').addEventListener('click', (e) => { e.preventDefault(); setMode('api'); });
      setMode('form');
      renderCatalog();
      renderCart();
      // Populate payment methods
      (function(){
        const sel = qs('#pg');
        sel.innerHTML = '';
        PG_OPTIONS.forEach(function(opt, idx){
          const o = document.createElement('option');
          o.value = opt.id;
          o.textContent = opt.label;
          if (idx === 0) o.selected = true;
          sel.appendChild(o);
        });
      })();

      qs('#continueBtn').addEventListener('click', async (e) => {
        e.preventDefault();
        qs('#error').classList.add('hidden');
        show('api_raw','');
        show('api_decrypted','');

        const body = {
          cart: Array.from(cart.entries()).map(function(entry){ return { id: entry[0], qty: entry[1] }; }),
          email: qs('#email').value.trim(),
          mobile: qs('#mobile').value.trim(),
          pgOptionId: qs('#pg').value,
        };

        if (!body.cart.length) {
          qs('#error').textContent = 'Your cart is empty.';
          qs('#error').classList.remove('hidden');
          return;
        }
        if (mode === 'api' && !body.mobile) {
          qs('#error').textContent = 'Please enter mobile number for API mode.';
          qs('#error').classList.remove('hidden');
          return;
        }

        try {
          setLoading(true);
          if (mode === 'form') {
            const resp = await fetch('/api/build', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            const data = await resp.json();
            if (!data.success) throw new Error(data.error || 'Failed');
            const form = qs('#payForm');
            form.setAttribute('action', data.data.actionUrl);
            form.innerHTML = '';
            const fields = [
              ['me_id', data.data.me_id],
              ['merchant_request', data.data.merchant_request],
              ['hash', data.data.hash],
            ];
            fields.forEach(([name, value]) => {
              const input = document.createElement('input');
              input.type = 'hidden';
              input.name = name;
              input.value = value;
              form.appendChild(input);
            });
            form.submit();
          } else {
            const resp = await fetch('/api/send', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
            const data = await resp.json();
            if (!data.success) throw new Error(data.error || 'Failed');
            show('api_raw', JSON.stringify(data.data.raw, null, 2));
            show('api_decrypted', data.data.decryptedResponse || '');
          }
        } catch (err) {
          qs('#error').textContent = err.message;
          qs('#error').classList.remove('hidden');
        } finally {
          // In form mode, navigation occurs; this runs if still on page
          setLoading(false);
        }
      });
    </script>
  </body>
  </html>
  `);
});

app.post('/api/build', (req: express.Request, res: express.Response) => {
  try {
    const items = Array.isArray(req.body.cart) ? (req.body.cart as Array<{ id: string; qty: number; }>) : [];
    const email = String(req.body.email ?? '').trim();
    const mobile = String(req.body.mobile ?? '').trim();
    const pgOptionId = String(req.body.pgOptionId ?? '').trim();
    if (!items.length) {
      return res.status(400).json({ success: false, error: 'cart is required' });
    }
    const totalCents = items.reduce((sum, it) => {
      const price = findPriceCents(String(it.id) || '');
      const qty = Number(it.qty) || 0;
      return price ? sum + price * Math.max(0, qty) : sum;
    }, 0);
    if (totalCents <= 0) {
      return res.status(400).json({ success: false, error: 'cart is empty' });
    }
    const amount = centsToAmountString(totalCents);
    const order_no = `ORDER${Date.now()}`;
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
      // allow pg selection for demonstration (form flow may ignore these)
      ...(function () {
        const found = (DEFAULT_PG_OPTIONS as ReadonlyArray<any>).find((o: any) => o.id === pgOptionId);
        return found ? { pgId: found.pgId, paymode: found.paymode, schemeId: found.schemeId, walletType: found.walletType } : {};
      })(),
    };

    const built = buildFormPayload(details, MERCHANT_KEY);

    return res.json({ success: true, data: built });
  } catch (err) {
    return res.status(400).json({ success: false, error: (err as Error).message });
  }
});

app.post('/api/send', async (req: express.Request, res: express.Response) => {
  try {
    const items = Array.isArray(req.body.cart) ? (req.body.cart as Array<{ id: string; qty: number; }>) : [];
    const email = String(req.body.email ?? '').trim();
    const mobile = String(req.body.mobile ?? '').trim();
    const pgOptionId = String(req.body.pgOptionId ?? '').trim();
    if (!items.length) {
      return res.status(400).json({ success: false, error: 'cart is required' });
    }
    if (!mobile) {
      return res.status(400).json({ success: false, error: 'mobile is required for API mode' });
    }

    const totalCents = items.reduce((sum, it) => {
      const price = findPriceCents(String(it.id) || '');
      const qty = Number(it.qty) || 0;
      return price ? sum + price * Math.max(0, qty) : sum;
    }, 0);
    if (totalCents <= 0) {
      return res.status(400).json({ success: false, error: 'cart is empty' });
    }
    const amount = centsToAmountString(totalCents);
    const order_no = `ORDER${Date.now()}`;

    const details = {
      aggregatorId: 'yagout',
      orderNumber: order_no,
      amount,
      country: 'ETH',
      currency: 'ETB',
      transactionType: 'SALE',
      customerEmail: email,
      customerMobile: mobile,
      // API required pg_details (select from exposed defaults)
      ...(function () {
        const found = (DEFAULT_PG_OPTIONS as ReadonlyArray<any>).find((o: any) => o.id === pgOptionId);
        if (found) return { pgId: found.pgId, paymode: found.paymode, schemeId: found.schemeId, walletType: found.walletType };
        // fallback to hard default if not chosen
        return { pgId: API_DEFAULTS.pgId, paymode: API_DEFAULTS.paymode, schemeId: API_DEFAULTS.schemeId, walletType: API_DEFAULTS.walletType };
      })(),
      successUrl: '',
      failureUrl: '',
    } as const;

    const result = await sendApiIntegration({ merchantId: MERCHANT_ID, ...details, channel: 'API' }, MERCHANT_KEY_API, { fetchImpl: loggedFetch as unknown as typeof fetch });

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

