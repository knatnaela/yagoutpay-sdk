# YagoutPay Java SDK

A Java SDK for assembling the gateway request, computing the canonical hash, performing AES‑256‑CBC (static IV, PKCS7) encryption/decryption, and integrating via hosted form or direct API.

## Features
- Spec-accurate `merchant_request` assembly (WEB/API)
- AES-256-CBC + PKCS7 (static IV) encryption/decryption
- SHA-256 hashing (canonical input)
- Hosted form builder and API client in a simple, testable design

## Coordinates (planned)
```gradle
implementation("com.yagoutpay:yagoutpay-sdk:0.1.0")
```
```xml
<dependency>
  <groupId>com.yagoutpay</groupId>
  <artifactId>yagoutpay-sdk</artifactId>
  <version>0.1.0</version>
</dependency>
```

Until published to Maven Central:
- Use this repository directly (includeBuild/flatDir), or
- Run `./gradlew :sdk:publishToMavenLocal` and depend on `com.yagoutpay:yagoutpay-sdk:0.1.0`.

## Quick start (Hosted Form)
```java
import com.yagoutpay.sdk.*;

Client.Config cfg = new Client.Config();
cfg.merchantId = "2025...";
cfg.encryptionKey = "BASE64_32_BYTE_KEY";
cfg.environment = Constants.Environment.UAT;
Client client = new Client(cfg);

Types.TransactionDetails details = Types.TransactionDetails.builder()
    .aggregatorId("yagout")
    .merchantId(cfg.merchantId)
    .orderNumber("ORDER" + System.currentTimeMillis())
    .amount("1.00")
    .country("ETH")
    .currency("ETB")
    .transactionType("SALE")
    .successUrl("http://localhost:3001/success")
    .failureUrl("http://localhost:3001/failure")
    .channel("WEB")
    .build();

Types.BuiltRequest built = client.build(details);
// built.meId, built.merchantRequest, built.hash, built.actionUrl
// Post these fields to built.actionUrl as application/x-www-form-urlencoded
```

## Quick start (Direct API)
```java
Types.TransactionDetails details = Types.TransactionDetails.builder()
    .aggregatorId("yagout")
    .merchantId(cfg.merchantId)
    .orderNumber("ORDER" + System.currentTimeMillis())
    .amount("1.00")
    .country("ETH")
    .currency("ETB")
    .transactionType("SALE")
    .successUrl("")
    .failureUrl("")
    .channel("API")
    .customerMobile("0912345678")
    .build();

Types.ApiRequestResult result = client.sendApi(details, /* endpoint */ null, /* decryptResponse */ true);
System.out.println(result.endpoint);
System.out.println(result.raw.status);
System.out.println(result.decryptedResponse); // may be null if decryption fails
```

Notes:
- API flow defaults `pg_details` to a wallet option; override via `pgId`, `paymode`, `schemeId`, `walletType` as needed.
- Do not bypass TLS in production.

## Security
- Keep merchant keys server‑side; never commit or log secrets.
- Use UAT credentials/data for testing.

## Compatibility
- Built with Java 17 toolchain. You can adjust toolchains and target release in Gradle if needed.

## License
MIT
