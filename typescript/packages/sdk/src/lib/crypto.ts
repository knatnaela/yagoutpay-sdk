import crypto from 'crypto';

const STATIC_IV = Buffer.from('0123456789abcdef', 'utf8');

export function pkcs7Pad(buffer: Buffer, blockSize = 16): Buffer {
  const padLength = blockSize - (buffer.length % blockSize);
  const pad = Buffer.alloc(padLength, padLength);
  return Buffer.concat([buffer, pad]);
}

export function pkcs7Unpad(buffer: Buffer): Buffer {
  const padLength = buffer[buffer.length - 1];
  return buffer.subarray(0, buffer.length - padLength);
}

export function aes256CbcEncrypt(plainText: string, base64Key: string): string {
  const key = Buffer.from(base64Key, 'base64');
  const padded = pkcs7Pad(Buffer.from(plainText, 'utf8'));
  const cipher = crypto.createCipheriv('aes-256-cbc', key, STATIC_IV);
  cipher.setAutoPadding(false);
  const encrypted = Buffer.concat([cipher.update(padded), cipher.final()]);
  return encrypted.toString('base64');
}

export function aes256CbcDecrypt(base64CipherText: string, base64Key: string): string {
  const key = Buffer.from(base64Key, 'base64');
  const encrypted = Buffer.from(base64CipherText, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, STATIC_IV);
  decipher.setAutoPadding(false);
  const padded = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return pkcs7Unpad(padded).toString('utf8');
}
