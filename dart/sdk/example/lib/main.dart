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
    _actionUrl = 'https://uatcheckout.yagoutpay.com/ms-transaction-core-1-0/paymentRedirection/checksumGatewayPage';
  }

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(8),
        child: ElevatedButton(
          onPressed: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => YagoutCheckoutPage(
                  encryptionKey: 'IG3CNW5uNrUO2mU2htUOWb9rgXCF7XMAXmL63d7wNZo=',
                  details: TransactionDetails(
                    aggregatorId: 'yagout',
                    merchantId: '202508080001',
                    orderNumber: 'ORDER123',
                    customerMobile: '0923759362',
                    amount: '1',
                    country: 'ETH',
                    currency: 'ETB',
                    transactionType: 'SALE',
                    successUrl: 'http://localhost:8080/success',
                    failureUrl: 'http://localhost:8080/failure',
                    channel: 'WEB',
                    isLoggedIn: 'Y',
                  ),
                  actionUrl: _actionUrl,
                ),
              ),
            );
          },
          child: const Text('Open YagoutCheckoutPage'),
        ),
      ),
    );
  }
}
