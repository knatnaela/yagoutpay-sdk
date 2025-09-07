import 'types.dart';

String renderAutoSubmitForm(BuiltRequest b) {
  String esc(String s) => s
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');

  return '''<!doctype html>
<html>
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Redirecting to Payment Gateway...</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding: 50px; 
            background: #f5f5f5; 
        }
        .loading { 
            color: #666; 
            margin: 20px 0; 
        }
        .fallback-btn { 
            background: #007bff; 
            color: white; 
            border: none; 
            padding: 12px 24px; 
            border-radius: 6px; 
            cursor: pointer; 
            font-size: 16px; 
            margin: 20px 0; 
        }
        .fallback-btn:hover { 
            background: #0056b3; 
        }
    </style>
</head>
<body>
    <div class="loading">Redirecting to payment gateway...</div>
    
    <form id="paymentForm" method="POST" action="${esc(b.actionUrl)}" enctype="application/x-www-form-urlencoded">
        <input type="hidden" name="me_id" value="${esc(b.meId)}" />
        <input type="hidden" name="merchant_request" value="${esc(b.merchantRequest)}" />
        <input type="hidden" name="hash" value="${esc(b.hash)}" />
    </form>
    
    <button class="fallback-btn" onclick="submitForm()">Continue to Payment</button>
    
    <script>
        function submitForm() {
            console.log('Attempting to submit form...');
            const form = document.getElementById('paymentForm');
            if (form) {
                try {
                    form.submit();
                    console.log('Form submitted successfully');
                } catch (e) {
                    console.error('Error submitting form:', e);
                    setTimeout(() => {
                        try { form.submit(); } catch (e2) {}
                    }, 100);
                }
            }
        }
        function autoSubmit() {
            setTimeout(submitForm, 100);
            setTimeout(submitForm, 500);
            setTimeout(submitForm, 1000);
        }
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', autoSubmit);
        } else {
            autoSubmit();
        }
        window.addEventListener('load', function() { setTimeout(submitForm, 200); });
        if (document.attachEvent) {
            document.attachEvent('onreadystatechange', function() {
                if (document.readyState === 'complete') autoSubmit();
            });
        }
    </script>
</body>
</html>''';
}
