/**
 * Mask a value keeping only last n characters visible.
 */
export function maskTail(value: string, visible = 4, maskChar = '*'): string {
    if (value.length <= visible) return value;
    return maskChar.repeat(Math.max(0, value.length - visible)) + value.slice(-visible);
}

/**
 * Redact common sensitive fields in a key-value object.
 * Returns a shallow-cloned object with masked values.
 */
export function redactObject<T extends Record<string, unknown>>(obj: T): T {
    const keysToMask = new Set([
        'cardNumber', 'cvv', 'expiryMonth', 'expiryYear', 'encryptionKey',
        'merchant_request', 'merchantRequest', 'hash', 'response',
    ]);
    const out: Record<string, unknown> = { ...obj };
    for (const [k, v] of Object.entries(out)) {
        if (typeof v === 'string' && keysToMask.has(k)) {
            out[k] = maskTail(v);
        }
    }
    return out as T;
}

/**
 * Safely preview a long base64 string (e.g., cipher, hash) for logs.
 */
export function previewBase64(value: string, head = 8, tail = 8): string {
    if (value.length <= head + tail) return value;
    return `${value.slice(0, head)}…${value.slice(-tail)}`;
}


