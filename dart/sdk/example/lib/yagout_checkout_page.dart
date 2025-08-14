import 'dart:convert';

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
  InAppWebViewController? _webViewController;
  bool _formSubmitted = false;

  @override
  void initState() {
    super.initState();
    final built = buildFormPayload(
      widget.details,
      widget.encryptionKey,
      actionUrl: widget.actionUrl,
    );
    _html = renderAutoSubmitForm(built);

    // Debug: Print the generated HTML
    print('Generated HTML: $_html');

    // Set up a timer as a fallback for auto-submission
    Future.delayed(const Duration(seconds: 3), () {
      if (!_formSubmitted && mounted) {
        print('Timer-based fallback submission triggered');
        _ensureFormSubmission();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Pay with YagoutPay')),
      body: _html == null
          ? const Center(child: CircularProgressIndicator())
          : InAppWebView(
              key: GlobalKey(),
              initialData: InAppWebViewInitialData(
                data: _html!,
                mimeType: 'text/html',
                encoding: 'utf-8',
              ),
              initialSettings: InAppWebViewSettings(
                javaScriptEnabled: true,
                domStorageEnabled: true,
                databaseEnabled: true,
                clearCache: true,
                cacheEnabled: false,
              ),
              onWebViewCreated: (controller) {
                _webViewController = controller;
                print('WebView created');
              },
              onLoadStart: (controller, url) {
                print('WebView load started: $url');
              },
              onLoadStop: (controller, url) {
                print('WebView load stopped: $url');
                // Force form submission if JavaScript didn't work
                _ensureFormSubmission();
              },
              onConsoleMessage: (controller, consoleMessage) {
                print('WebView console: ${consoleMessage.message}');
              },
              onLoadError: (controller, url, code, message) {
                print('WebView load error: $code - $message');
              },
              onLoadHttpError: (controller, url, statusCode, description) {
                print('WebView HTTP error: $statusCode - $description');
              },
              shouldOverrideUrlLoading: (controller, nav) async {
                final url = nav.request.url?.toString() ?? '';
                print('Navigation attempt: $url');

                // Check if we're navigating to the payment gateway
                if (url.contains(widget.actionUrl) || url.contains('yagoutpay.com')) {
                  print('Navigating to payment gateway: $url');
                  _formSubmitted = true;
                }

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

  void _ensureFormSubmission() async {
    if (_webViewController != null && !_formSubmitted) {
      try {
        // Check if form exists first
        final formCheck = await _webViewController!.evaluateJavascript(source: '''
          (function() {
            const form = document.querySelector('form');
            if (form) {
              console.log('Form found with action:', form.action);
              console.log('Form method:', form.method);
              console.log('Form fields count:', form.elements.length);
              return 'Form found: ' + form.action;
            } else {
              console.log('No form found in document');
              return 'No form found';
            }
          })();
        ''');
        print('Form check result: $formCheck');

        // Try to execute JavaScript to submit the form
        final result = await _webViewController!.evaluateJavascript(source: '''
          (function() {
            try {
              const form = document.getElementById('paymentForm');
              if (form) {
                console.log('Form found, submitting...');
                console.log('Form action:', form.action);
                console.log('Form method:', form.method);
                
                // Check if all required fields are present
                const meId = form.querySelector('input[name="me_id"]');
                const merchantRequest = form.querySelector('input[name="merchant_request"]');
                const hash = form.querySelector('input[name="hash"]');
                
                console.log('me_id field:', meId ? 'present' : 'missing');
                console.log('merchant_request field:', merchantRequest ? 'present' : 'missing');
                console.log('hash field:', hash ? 'present' : 'missing');
                
                if (meId && merchantRequest && hash) {
                  form.submit();
                  return 'Form submitted successfully';
                } else {
                  return 'Missing required fields';
                }
              } else {
                console.log('No form found');
                return 'No form found';
              }
            } catch (e) {
              console.error('Error submitting form:', e);
              return 'Error: ' + e.message;
            }
          })();
        ''');
        print('JavaScript execution result: $result');

        if (result == 'Form submitted successfully') {
          _formSubmitted = true;
          print('Form submitted successfully, marking as submitted');
        }

        // If JavaScript submission failed, try a different approach
        if (result != 'Form submitted successfully') {
          print('JavaScript submission failed, trying alternative method...');
          final alternativeResult = await _webViewController!.evaluateJavascript(source: '''
            (function() {
              try {
                const form = document.getElementById('paymentForm');
                if (form) {
                  // Create and dispatch a submit event
                  const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
                  form.dispatchEvent(submitEvent);
                  return 'Submit event dispatched';
                }
                return 'No form to dispatch event to';
              } catch (e) {
                return 'Error dispatching event: ' + e.message;
              }
            })();
          ''');
          print('Alternative submission result: $alternativeResult');
        }
      } catch (e) {
        print('Error executing JavaScript: $e');
      }
    } else if (_formSubmitted) {
      print('Form already submitted, skipping submission attempt');
    } else {
      print('WebView controller not ready yet');
    }
  }
}
