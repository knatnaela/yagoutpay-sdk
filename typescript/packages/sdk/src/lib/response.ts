import type { ApiRequestResult } from '../types';

export type ParsedGatewayResponse = {
    raw: string;
    asJson?: unknown;
    asQuery?: Record<string, string>;
    asSections?: string[];
};

/**
 * Try multiple strategies to parse a decrypted gateway response string.
 * - JSON parse
 * - querystring (k=v&...)
 * - sectioned (~ delimited)
 */
export function parseDecryptedResponse(input: string): ParsedGatewayResponse {
    const out: ParsedGatewayResponse = { raw: input };

    // Try JSON
    try {
        out.asJson = JSON.parse(input);
        return out;
    } catch {
        // ignore
    }

    // Try querystring
    if (input.includes('=') && input.includes('&')) {
        try {
            const params = new URLSearchParams(input);
            const obj: Record<string, string> = {};
            params.forEach((v, k) => {
                obj[k] = v;
            });
            out.asQuery = obj;
            return out;
        } catch {
            // ignore
        }
    }

    // Try sectioned
    if (input.includes('~')) {
        out.asSections = input.split('~');
    }

    return out;
}

/**
 * Convenience helper to parse the decryptedResponse from an ApiRequestResult.
 */
export function parseApiResult(result: ApiRequestResult): ParsedGatewayResponse | undefined {
    if (!result.decryptedResponse) return undefined;
    return parseDecryptedResponse(result.decryptedResponse);
}


