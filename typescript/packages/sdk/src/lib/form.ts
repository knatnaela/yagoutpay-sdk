import type { BuiltRequest } from '../types';

export function renderAutoSubmitForm(payload: BuiltRequest): string {
  const inputs = [
    ['me_id', payload.me_id],
    ['merchant_request', payload.merchant_request],
    ['hash', payload.hash],
  ]
    .map(([name, value]) => `<input type="hidden" name="${name}" value="${escapeHtml(value)}" />`)
    .join('\n');

  return `<!doctype html>
<html>
  <head><meta charset="utf-8" /><title>Redirecting…</title></head>
  <body onload="document.forms[0].submit()">
    <form method="POST" action="${escapeHtml(payload.actionUrl)}" enctype="application/x-www-form-urlencoded">
      ${inputs}
      <noscript><button type="submit">Continue</button></noscript>
    </form>
  </body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

