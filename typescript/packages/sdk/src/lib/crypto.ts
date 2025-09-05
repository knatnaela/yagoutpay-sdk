import crypto from 'crypto';

/**
 * AES-256-CBC with static IV and PKCS7 padding utilities.
 * The gateway expects a static IV of `0123456789abcdef` and manual PKCS7 padding.
 */

const STATIC_IV = Buffer.from('0123456789abcdef', 'utf8');

/**
 * Apply PKCS7 padding to a buffer.
 * @param buffer input data
 * @param blockSize cipher block size in bytes (default 16)
 */
export function pkcs7Pad(buffer: Buffer, blockSize = 16): Buffer {
  const padLength = blockSize - (buffer.length % blockSize);
  const pad = Buffer.alloc(padLength, padLength);
  return Buffer.concat([buffer, pad]);
}

/**
 * Remove PKCS7 padding from a buffer.
 * @param buffer padded data
 */
export function pkcs7Unpad(buffer: Buffer): Buffer {
  const padLength = buffer[buffer.length - 1];
  return buffer.subarray(0, buffer.length - padLength);
}

/**
 * Encrypt a UTF-8 string using AES-256-CBC with PKCS7 padding and return base64.
 * @param plainText UTF-8 string to encrypt
 * @param base64Key 32-byte key provided as base64 string
 */
export function aes256CbcEncrypt(plainText: string, base64Key: string): string {
  const key = Buffer.from(base64Key, 'base64');
  const padded = pkcs7Pad(Buffer.from(plainText, 'utf8'));
  const cipher = crypto.createCipheriv('aes-256-cbc', key, STATIC_IV);
  cipher.setAutoPadding(false);
  const encrypted = Buffer.concat([cipher.update(padded), cipher.final()]);
  return encrypted.toString('base64');
}

/**
 * Decrypt a base64 string using AES-256-CBC with PKCS7 padding and return UTF-8.
 * @param base64CipherText base64 encoded ciphertext
 * @param base64Key 32-byte key provided as base64 string
 */
export function aes256CbcDecrypt(base64CipherText: string, base64Key: string): string {
  const key = Buffer.from(base64Key, 'base64');
  const encrypted = Buffer.from(base64CipherText, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, STATIC_IV);
  decipher.setAutoPadding(false);
  const padded = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return pkcs7Unpad(padded).toString('utf8');
}
