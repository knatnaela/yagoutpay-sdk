/// SDK environment options.
enum Environment { uat, prod }

/// Gateway endpoints for hosted form and API.
class Endpoints {
  static const Map<Environment, String> actionUrls = {
    Environment.uat: 'https://uatcheckout.yagoutpay.com/ms-transaction-core-1-0/paymentRedirection/checksumGatewayPage',
    Environment.prod: 'https://checkout.yagoutpay.com/ms-transaction-core-1-0/paymentRedirection/checksumGatewayPage',
  };
  static const Map<Environment, String> apiUrls = {
    Environment.uat: 'https://uatcheckout.yagoutpay.com/ms-transaction-core-1-0/apiRedirection/apiIntegration',
    Environment.prod: 'https://checkout.yagoutpay.com/ms-transaction-core-1-0/apiRedirection/apiIntegration',
  };
}

/// Default pg_details used for API flow.
class ApiDefaults {
  static const String pgId = '67ee846571e740418d688c3f';
  static const String paymode = 'WA';
  static const String schemeId = '7';
  static const String walletType = 'telebirr';
}
