import 'dart:convert';
import 'package:crypto/crypto.dart' as dcrypto;
import 'types.dart';

String buildHashInput(TransactionDetails d) => [d.merchantId, d.orderNumber, d.amount, d.country, d.currency].join('~');

String generateSha256Hex(String input) => dcrypto.sha256.convert(utf8.encode(input)).toString();
