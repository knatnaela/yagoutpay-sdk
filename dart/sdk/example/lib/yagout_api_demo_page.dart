import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:yagoutpay_sdk/yagoutpay_sdk.dart';

class YagoutApiDemoPage extends StatefulWidget {
  const YagoutApiDemoPage({super.key});

  @override
  State<YagoutApiDemoPage> createState() => _YagoutApiDemoPageState();
}

class _YagoutApiDemoPageState extends State<YagoutApiDemoPage> {
  final TextEditingController _mobileCtrl = TextEditingController();
  final TextEditingController _amountCtrl = TextEditingController(text: '500');
  final TextEditingController _productCtrl = TextEditingController(text: 'Demo Product');
  final TextEditingController _emailCtrl = TextEditingController();
  String _raw = '';
  String _decrypted = '';
  String _error = '';
  bool _loading = false;

  // Demo config (replace with your env variables in real apps)
  static const String _merchantId = '202508080001';
  static const String _encryptionKey = 'IG3CNW5uNrUO2mU2htUOWb9rgXCF7XMAXmL63d7wNZo=';

  Future<void> _sendApi() async {
    setState(() {
      _loading = true;
      _error = '';
      _raw = '';
      _decrypted = '';
    });
    try {
      final client = createYagoutPay(YagoutPayClientConfig(
        merchantId: _merchantId,
        encryptionKey: _encryptionKey,
        environment: Environment.uat,
      ));

      final result = await client.api.send(
        TransactionDetails(
          aggregatorId: 'yagout',
          merchantId: _merchantId,
          orderNumber: 'ORDER${DateTime.now().millisecondsSinceEpoch}',
          amount: '1.00',
          country: 'ETH',
          currency: 'ETB',
          transactionType: 'SALE',
          successUrl: '',
          failureUrl: '',
          channel: 'API',
          customerMobile: _mobileCtrl.text.trim(),
          // Use defaults for pg_details; override if needed
        ),
        options: const SendApiOptions(
          decryptResponse: true,
          allowInsecureTls: true, // UAT only; remove for production
        ),
      );

      setState(() {
        _raw = const JsonEncoder.withIndent('  ').convert({
          'endpoint': result.endpoint,
          'raw': {
            'merchantId': result.raw.merchantId,
            'status': result.raw.status,
            'statusMessage': result.raw.statusMessage,
            'response': result.raw.response,
          }
        });
        _decrypted = result.decryptedResponse ?? '';
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
      });
    } finally {
      setState(() {
        _loading = false;
      });
    }
  }

  Future<void> _sendStaticLink() async {
    setState(() {
      _loading = true;
      _error = '';
      _raw = '';
      _decrypted = '';
    });
    try {
      final plain = PaymentLinkPlain()
        ..req_user_id = 'yagou381'
        ..me_code = _merchantId
        ..qr_transaction_amount = _amountCtrl.text.trim()
        ..brandName = _productCtrl.text.trim()
        ..store_email = _emailCtrl.text.trim()
        ..mobile_no = _mobileCtrl.text.trim();
      final result = await sendPaymentLink(plain, _encryptionKey, environment: Environment.uat, allowInsecureTls: true);
      setState(() {
        _raw = const JsonEncoder.withIndent('  ').convert({'endpoint': result.endpoint, 'raw': result.raw});
        _decrypted = result.decryptedResponse ?? '';
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
      });
    } finally {
      setState(() {
        _loading = false;
      });
    }
  }

  Future<void> _sendDynamicLink() async {
    setState(() {
      _loading = true;
      _error = '';
      _raw = '';
      _decrypted = '';
    });
    try {
      final plain = PaymentByLinkPlain()
        ..req_user_id = 'yagou381'
        ..me_id = _merchantId
        ..amount = _amountCtrl.text.trim()
        ..order_id = 'ORDER_${DateTime.now().millisecondsSinceEpoch}'
        ..product = _productCtrl.text.trim()
        ..customer_email = _emailCtrl.text.trim()
        ..mobile_no = _mobileCtrl.text.trim()
        ..success_url = ''
        ..failure_url = ''
        ..currency = 'ETB'
        ..country = 'ETH';
      final result =
          await sendPaymentByLink(plain, _encryptionKey, environment: Environment.uat, allowInsecureTls: true);
      setState(() {
        _raw = const JsonEncoder.withIndent('  ').convert({'endpoint': result.endpoint, 'raw': result.raw});
        _decrypted = result.decryptedResponse ?? '';
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
      });
    } finally {
      setState(() {
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: ListView(
        children: [
          const Text('Direct API Integration', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
          const SizedBox(height: 12),
          TextField(
            controller: _mobileCtrl,
            decoration: const InputDecoration(
              labelText: 'Mobile (required for API)',
              border: OutlineInputBorder(),
            ),
          ),
          const SizedBox(height: 12),
          ElevatedButton(
            onPressed: _loading ? null : _sendApi,
            child: Text(_loading ? 'Processing…' : 'Send API Request'),
          ),
          const SizedBox(height: 24),
          const Text('Payment Links', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600)),
          const SizedBox(height: 12),
          TextField(
            controller: _amountCtrl,
            decoration: const InputDecoration(labelText: 'Amount', border: OutlineInputBorder()),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _productCtrl,
            decoration: const InputDecoration(labelText: 'Product/Description', border: OutlineInputBorder()),
          ),
          const SizedBox(height: 8),
          TextField(
            controller: _emailCtrl,
            decoration: const InputDecoration(labelText: 'Customer Email (optional)', border: OutlineInputBorder()),
          ),
          const SizedBox(height: 8),
          Row(children: [
            Expanded(
                child: ElevatedButton(
                    onPressed: _loading ? null : _sendDynamicLink, child: const Text('Generate Dynamic Link'))),
            const SizedBox(width: 12),
            Expanded(
                child: ElevatedButton(
                    onPressed: _loading ? null : _sendStaticLink, child: const Text('Generate Static Link'))),
          ]),
          if (_error.isNotEmpty) ...[
            const SizedBox(height: 12),
            Text(_error, style: const TextStyle(color: Colors.red)),
          ],
          const SizedBox(height: 12),
          const Text('Raw Response', style: TextStyle(fontWeight: FontWeight.w600)),
          const SizedBox(height: 6),
          Container(
            decoration:
                BoxDecoration(border: Border.all(color: Colors.black12), borderRadius: BorderRadius.circular(6)),
            padding: const EdgeInsets.all(8),
            child: SingleChildScrollView(scrollDirection: Axis.horizontal, child: Text(_raw)),
          ),
          const SizedBox(height: 12),
          const Text('Decrypted', style: TextStyle(fontWeight: FontWeight.w600)),
          const SizedBox(height: 6),
          Container(
            decoration:
                BoxDecoration(border: Border.all(color: Colors.black12), borderRadius: BorderRadius.circular(6)),
            padding: const EdgeInsets.all(8),
            child: SingleChildScrollView(scrollDirection: Axis.horizontal, child: Text(_decrypted)),
          ),
        ],
      ),
    );
  }
}
