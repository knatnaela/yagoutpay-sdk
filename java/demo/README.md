# YagoutPay Java Demo

A comprehensive Spring Boot demo application showcasing YagoutPay integration using the Java SDK. This demo provides both **Hosted Form** and **Direct API** integration methods with a complete e-commerce checkout experience.

## 🚀 Features

- **Dual Integration Modes**: Toggle between Hosted Form and Direct API integration
- **E-commerce Demo**: Complete shopping cart with product catalog
- **Real-time API Testing**: View raw and decrypted API responses
- **Callback Handling**: Process success/failure callbacks from YagoutPay
- **Modern UI**: Responsive interface with Tailwind CSS
- **Environment Configuration**: Secure credential management

## 🛠️ Prerequisites

- **Java 17+** (OpenJDK recommended)
- **Gradle 7.0+** (wrapper included)
- **YagoutPay Merchant Credentials**:
  - `YAGOUT_MERCHANT_ID`
  - `YAGOUT_MERCHANT_KEY`

## ⚡ Quick Start

1. **Set Environment Variables**:
   ```bash
   export YAGOUT_MERCHANT_ID="your_merchant_id"
   export YAGOUT_MERCHANT_KEY="your_merchant_key"
   ```

2. **Run the Application**:
   ```bash
   cd java
   ./gradlew :demo:run
   ```

3. **Open the Demo**:
   Navigate to [http://localhost:3001](http://localhost:3001)

## 🏗️ Architecture

### Technology Stack
- **Spring Boot 3.2.0** - Main application framework
- **Thymeleaf** - Server-side templating
- **YagoutPay Java SDK** - Payment integration
- **Jackson** - JSON processing
- **Tailwind CSS** - Frontend styling

### Project Structure
```
src/main/java/com/yagoutpay/demo/
├── Main.java                    # Spring Boot application entry point
├── controller/
│   └── CheckoutController.java  # REST endpoints and web controllers
├── service/
│   └── YagoutPayService.java    # YagoutPay SDK integration logic
└── dto/
    ├── CheckoutRequest.java     # Request data transfer objects
    ├── CartItem.java           # Shopping cart item model
    └── ApiResponse.java        # Standardized API response wrapper
```

## 🔄 Integration Methods

### 1. Hosted Form Integration
- **Flow**: Redirects users to YagoutPay's hosted payment form
- **Use Case**: Quick integration with minimal PCI compliance requirements
- **Endpoint**: `POST /api/build`
- **Process**:
  1. Build transaction details
  2. Generate merchant request with encryption
  3. Redirect to YagoutPay hosted form
  4. Handle callback responses

### 2. Direct API Integration
- **Flow**: Sends encrypted requests directly to YagoutPay API
- **Use Case**: Custom payment flows with full control
- **Endpoint**: `POST /api/send`
- **Process**:
  1. Build transaction details with payment gateway options
  2. Encrypt and send request to API
  3. Display raw and decrypted responses
  4. Handle payment processing

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Main demo page with product catalog |
| `POST` | `/api/build` | Build hosted form request |
| `POST` | `/api/send` | Send direct API request |
| `POST` | `/success` | Payment success callback |
| `GET/POST` | `/failure` | Payment failure callback |

## 🛒 Demo Features

### Product Catalog
- **Coffee Beans** - ETB 85.00
- **Ceramic Mug** - ETB 1.00
- **Comfort Tee** - ETB 69.00
- **Dad Hat** - ETB 45.00
- **Sticker Pack** - ETB 9.00

### Shopping Cart
- Add/remove items with quantity controls
- Real-time total calculation
- Empty cart validation

### Payment Modes
- **Hosted Form**: Minimal input required (email optional)
- **Direct API**: Full payment gateway configuration

## ⚙️ Configuration

### Environment Variables
```bash
# Required
YAGOUT_MERCHANT_ID=your_merchant_id
YAGOUT_MERCHANT_KEY=your_merchant_key

# Optional
YAGOUT_ALLOW_INSECURE_TLS=true  # For UAT testing only
```

### Application Properties
```properties
# Server
server.port=3001

# YagoutPay
yagout.merchant.id=${YAGOUT_MERCHANT_ID:202508080001}
yagout.merchant.key=${YAGOUT_MERCHANT_KEY:IG3CNW5uNrUO2mU2htUOWb9rgXCF7XMAXmL63d7wNZo=}
yagout.allow.insecure.tls=${YAGOUT_ALLOW_INSECURE_TLS:true}

# Thymeleaf
spring.thymeleaf.cache=false
spring.thymeleaf.prefix=classpath:/templates/
spring.thymeleaf.suffix=.html
```

## 🔧 Development

### Running in Development Mode
```bash
# With hot reload
./gradlew :demo:bootRun

# With debug logging
./gradlew :demo:bootRun --args="--debug"
```

### Building the Application
```bash
# Build JAR
./gradlew :demo:build

# Run JAR
java -jar demo/build/libs/demo-0.1.0.jar
```

## 🚨 Important Notes

- **UAT Environment Only**: This demo uses UAT credentials and settings
- **TLS Configuration**: Insecure TLS is enabled for UAT testing
- **Production Ready**: Update configuration for production use
- **Security**: Never commit real merchant credentials to version control

## 🐛 Troubleshooting

### Common Issues

1. **IDE Package Highlighting**:
   - Re-import Gradle project from `java/` folder
   - Set source paths to `java/*/src/main/java`

2. **Environment Variables Not Loaded**:
   - Verify variables are set: `echo $YAGOUT_MERCHANT_ID`
   - Restart IDE/terminal after setting variables

3. **Port Already in Use**:
   - Change port in `application.properties`
   - Kill existing process: `lsof -ti:3001 | xargs kill`

4. **TLS/SSL Issues**:
   - Ensure `YAGOUT_ALLOW_INSECURE_TLS=true` for UAT
   - Check Java version compatibility

### Debug Mode
Enable debug logging by adding to `application.properties`:
```properties
logging.level.com.yagoutpay=DEBUG
logging.level.org.springframework.web=DEBUG
```

## 📚 Additional Resources

- [YagoutPay Documentation](https://docs.yagoutpay.com)
- [Java SDK Reference](https://github.com/yagoutpay/yagoutpay-sdk/tree/main/java/sdk)
- [Spring Boot Documentation](https://spring.io/projects/spring-boot)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This demo is provided as-is for educational and testing purposes. See the main project license for details.
