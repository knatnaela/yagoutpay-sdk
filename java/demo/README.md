# YagoutPay Java Demo (Javalin)

Reference demo illustrating Hosted Form and Direct API integrations using the Java SDK.

## Prerequisites
- Java 17+
- Gradle wrapper (included)
- Environment variables:
  - `YAGOUT_MERCHANT_ID`
  - `YAGOUT_MERCHANT_KEY`

## Run
```bash
cd java
./gradlew :demo:run
```
Open `http://localhost:3001/`.

## Flows
- Hosted Form: builds a `merchant_request` and posts to the gateway action URL.
- Direct API: sends an encrypted JSON request to the API endpoint and displays raw and decrypted responses.

## Notes
- UAT only. Do not bypass TLS or use production keys in this demo.
- Callback endpoints:
  - `POST /success`
  - `GET/POST /failure`

## Troubleshooting
- If IDE highlights packages like `main.java.com...`, re-import the Gradle project from the `java/` folder or set source paths to `java/*/src/main/java`.
