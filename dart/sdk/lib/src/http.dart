import 'dart:io' show HttpClient, X509Certificate;
import 'package:http/http.dart' as http;
import 'package:http/io_client.dart' as http_io;

http.Client createHttpClient({required bool allowInsecureTls}) {
  if (!allowInsecureTls) return http.Client();
  final io = HttpClient();
  io.badCertificateCallback = _insecureCertCallback;
  return http_io.IOClient(io);
}

bool _insecureCertCallback(X509Certificate cert, String host, int port) {
  // Restrict bypass to known UAT host only
  return host == 'uatcheckout.yagoutpay.com';
}
