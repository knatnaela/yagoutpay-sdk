import type { BuiltRequest } from '../types';

/**
 * Build application/x-www-form-urlencoded body from a BuiltRequest.
 */
export function toFormUrlEncoded(payload: BuiltRequest): string {
    const params = new URLSearchParams();
    params.set('me_id', payload.me_id);
    params.set('merchant_request', payload.merchant_request);
    params.set('hash', payload.hash);
    return params.toString();
}

/**
 * Build a FormData instance from a BuiltRequest (for fetch in browser).
 */
export function toFormData(payload: BuiltRequest): FormData {
    const fd = new FormData();
    fd.set('me_id', payload.me_id);
    fd.set('merchant_request', payload.merchant_request);
    fd.set('hash', payload.hash);
    return fd;
}


