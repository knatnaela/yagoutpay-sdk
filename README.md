# YagoutPay SDK Monorepo

Multi-language SDKs and demos for integrating with YagoutPay via hosted form and direct API flows.

## Contents
- Dart SDK (`dart/sdk`)
- TypeScript SDK (`typescript/packages/sdk`) and demo (`typescript/packages/demo`)
- Java SDK (`java/sdk`) and demo (`java/demo`)

## Features
- Spec-accurate assembly of `merchant_request` (WEB/API)
- AES-256-CBC with PKCS7 (static IV) encryption/decryption
- Canonical SHA-256 hash input and hex digest
- Hosted form auto-submit helpers and direct API clients

## Quick Start
- Dart: see `dart/sdk/README.md`
- TypeScript: see `typescript/packages/sdk/README.md`
- Java: see `java/sdk/README.md`

Each SDK README includes language-specific installation and usage examples for:
- Hosted Form (build fields and POST to the gateway action URL)
- Direct API (send encrypted JSON to the API endpoint and optionally decrypt response)

## Demos
- Flutter demo (Dart): `dart/sdk/example`
- Node demo (TypeScript): `typescript/packages/demo`
- Javalin demo (Java): `java/demo`

Demos are intended for UAT only. Do not use production keys or bypass TLS in production.

## Environments
- UAT: `https://uatcheckout.yagoutpay.com/...`
- Production: `https://checkout.yagoutpay.com/...`

SDKs select the appropriate action/API endpoints based on configuration.

## Security Guidance
- Keep merchant encryption keys server-side; never commit or log them.
- Use non-production data in demos/UAT.
- Review your platform’s secure storage and network TLS settings.

## Development
This is a polyglot monorepo. Work within the respective language folder:
- Dart: `cd dart/sdk`
- TypeScript: `cd typescript/packages/sdk`
- Java: `cd java`

Follow each SDK’s README for build, test, and lint instructions.

## License
MIT
