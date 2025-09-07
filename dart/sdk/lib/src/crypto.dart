import 'dart:convert';
import 'package:encrypt/encrypt.dart' as enc;

String aes256CbcEncrypt(String plain, String base64Key) {
  final key = enc.Key.fromBase64(base64Key);
  final iv = enc.IV.fromUtf8('0123456789abcdef');
  final pad = _pkcs7Pad(utf8.encode(plain));
  final encrypter = enc.Encrypter(enc.AES(key, mode: enc.AESMode.cbc, padding: null));
  final encrypted = encrypter.encryptBytes(pad, iv: iv);
  return encrypted.base64;
}

String aes256CbcDecrypt(String base64Cipher, String base64Key) {
  final key = enc.Key.fromBase64(base64Key);
  final iv = enc.IV.fromUtf8('0123456789abcdef');
  final encrypter = enc.Encrypter(enc.AES(key, mode: enc.AESMode.cbc, padding: null));
  final bytes = encrypter.decryptBytes(enc.Encrypted.fromBase64(base64Cipher), iv: iv);
  final unpadded = _pkcs7Unpad(bytes);
  return utf8.decode(unpadded);
}

List<int> _pkcs7Pad(List<int> input, [int blockSize = 16]) {
  final padLen = blockSize - (input.length % blockSize);
  return [...input, ...List<int>.filled(padLen, padLen)];
}

List<int> _pkcs7Unpad(List<int> input) {
  final padLen = input.isNotEmpty ? input.last : 0;
  return input.sublist(0, input.length - padLen);
}
