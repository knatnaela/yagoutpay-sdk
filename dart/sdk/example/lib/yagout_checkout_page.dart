import 'package:flutter/material.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';
import 'package:yagoutpay_sdk/yagoutpay_sdk.dart';

class YagoutCheckoutPage extends StatefulWidget {
  final String encryptionKey; // base64
  final TransactionDetails details;
  final String actionUrl;

  const YagoutCheckoutPage({
    super.key,
    required this.encryptionKey,
    required this.details,
    required this.actionUrl,
  });

  @override
  State<YagoutCheckoutPage> createState() => _YagoutCheckoutPageState();
}

class _YagoutCheckoutPageState extends State<YagoutCheckoutPage> {
  String? _html;

  @override
  void initState() {
    super.initState();
    final built = buildFormPayload(
      widget.details,
      widget.encryptionKey,
      actionUrl: widget.actionUrl,
    );
    _html = renderAutoSubmitForm(built);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Pay with YagoutPay')),
      body: _html == null
          ? const Center(child: CircularProgressIndicator())
          : InAppWebView(
              initialData: InAppWebViewInitialData(
                data: _html!,
                baseUrl: WebUri(widget.actionUrl),
                mimeType: 'text/html',
                encoding: 'utf-8',
              ),
              initialSettings: InAppWebViewSettings(javaScriptEnabled: true),
              shouldOverrideUrlLoading: (controller, nav) async {
                final url = nav.request.url?.toString() ?? '';
                if (url.contains('/success') || url.contains('/failure')) {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Callback: $url')),
                    );
                  }
                }
                return NavigationActionPolicy.ALLOW;
              },
            ),
    );
  }
}
