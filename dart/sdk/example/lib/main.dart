import 'package:flutter/material.dart';
import 'package:yagoutpay_sdk/yagoutpay_sdk.dart';
import 'package:flutter_inappwebview/flutter_inappwebview.dart';
import 'yagout_checkout_page.dart';

void main() => runApp(const ExampleApp());

class ExampleApp extends StatelessWidget {
  const ExampleApp({super.key});
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      home: Scaffold(
        appBar: AppBar(title: const Text('YagoutPay SDK Example')),
        body: const _Body(),
      ),
    );
  }
}

class _Body extends StatefulWidget {
  const _Body();
  @override
  State<_Body> createState() => _BodyState();
}

class _BodyState extends State<_Body> {
  String output = '';
  String _actionUrl = '';
  String? _html;
  final GlobalKey _webViewKey = GlobalKey();
  @override
  void initState() {
    super.initState();
    _actionUrl = 'https://yagoutpay.com/api/v1/payment/yagout/checkout';
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Expanded(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: SingleChildScrollView(child: Text(output)),
          ),
        ),
        const Divider(height: 1),
        SizedBox(
          height: 320,
          child: _html == null
              ? const Center(child: Text('Build payload to load WebView'))
              : InAppWebView(
                  key: _webViewKey,
                  initialData: InAppWebViewInitialData(
                    data: _html!,
                    baseUrl: WebUri(
                      _actionUrl,
                    ),
                    mimeType: 'text/html',
                    encoding: 'utf-8',
                  ),
                  initialSettings:
                      InAppWebViewSettings(javaScriptEnabled: true),
                  shouldOverrideUrlLoading: (controller, nav) async {
                    final url = nav.request.url?.toString() ?? '';
                    if (url.contains('/success') || url.contains('/failure')) {
                      // Handle callback URL in-app
                      if (mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(content: Text('Callback: $url')),
                        );
                      }
                    }
                    return NavigationActionPolicy.ALLOW;
                  },
                ),
        ),
        Padding(
          padding: const EdgeInsets.all(8),
          child: ElevatedButton(
            onPressed: () {
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => const YagoutCheckoutPage(
                    encryptionKey:
                        'IG3CNW5uNrUO2mU2htUOWb9rgXCF7XMAXmL63d7wNZo=',
                    details: TransactionDetails(
                      aggregatorId: 'yagout',
                      merchantId: '202508080001',
                      orderNumber: 'ORDER123',
                      amount: '1',
                      country: 'ETH',
                      currency: 'ETB',
                      transactionType: 'SALE',
                      successUrl: 'http://loca',
                      failureUrl: 'http://local',
                      channel: 'WEB',
                      isLoggedIn: 'Y',
                    ),
                    actionUrl:
                        'https://uatcheckout.yagoutpay.com/ms-transaction-core-1-0/paymentRedirection/checksumGatewayPage',
                  ),
                ),
              );
            },
            child: const Text('Open YagoutCheckoutPage'),
          ),
        ),
      ],
    );
  }
}
