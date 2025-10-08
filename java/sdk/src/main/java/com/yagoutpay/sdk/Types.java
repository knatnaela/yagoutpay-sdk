package com.yagoutpay.sdk;

import java.util.Objects;

/** Core data types used by the Java SDK. */
public final class Types {
    private Types() {
    }

    /** Plain payload for static Payment Link requests. */
    public static final class PaymentLinkPlain {
        public String ag_id = "";
        public String ag_code = "";
        public String ag_name = "";
        public String req_user_id = "";
        public String me_code = "";
        public String me_name = "";
        public String qr_code_id = "";
        public String brandName = "";
        public String qr_name = "";
        public String status = "";
        public String storeName = "";
        public String store_id = "";
        public String token = "";
        public String qr_transaction_amount = "";
        public String logo = "";
        public String store_email = "";
        public String mobile_no = "";
        public String udf = "";
        public String udfmerchant = "";
        public String file_name = "";
        public String from_date = "";
        public String to_date = "";
        public String file_extn = "";
        public String file_url = "";
        public String file = "";
        public String original_file_name = "";
        public String successURL = "";
        public String failureURL = "";
        public String addAll = "";
        public String source = "";
    }

    /** Plain payload for dynamic Payment By Link requests. */
    public static final class PaymentByLinkPlain {
        public String req_user_id = "";
        public String me_id = "";
        public String amount = "";
        public String customer_email = "";
        public String mobile_no = "";
        public String expiry_date = "";
        public String[] media_type = new String[0];
        public String order_id = "";
        public String first_name = "";
        public String last_name = "";
        public String product = "";
        public String dial_code = "";
        public String failure_url = "";
        public String success_url = "";
        public String country = "";
        public String currency = "";
    }

    /** Encoded request body format sent to link endpoints. */
    public static final class PaymentLinkEncodedBody {
        public final String request;

        public PaymentLinkEncodedBody(String request) {
            this.request = request;
        }
    }

    /**
     * Canonical transaction input used to build both hosted form and API payloads.
     * Use {@link Builder} to construct immutable instances.
     */
    public static final class TransactionDetails {
        public final String aggregatorId;
        public final String merchantId;
        public final String orderNumber;
        public final String amount;
        public final String country;
        public final String currency;
        public final String transactionType;
        public final String successUrl;
        public final String failureUrl;
        public final String channel;
        public final String customerEmail;
        public final String customerMobile;
        public final String pgId;
        public final String paymode;
        public final String schemeId;
        public final String walletType;
        public final String cardNumber;
        public final String expiryMonth;
        public final String expiryYear;
        public final String cvv;
        public final String cardName;
        public final String customerName;
        public final String uniqueId;
        public final String billAddress;
        public final String billCity;
        public final String billState;
        public final String billCountry;
        public final String billZip;
        public final String shipAddress;
        public final String shipCity;
        public final String shipState;
        public final String shipCountry;
        public final String shipZip;
        public final String shipDays;
        public final String addressCount;
        public final String itemCount;
        public final String itemValue;
        public final String itemCategory;
        public final String udf1, udf2, udf3, udf4, udf5, udf6, udf7;
        public final String isLoggedIn;

        private TransactionDetails(Builder b) {
            this.aggregatorId = b.aggregatorId;
            this.merchantId = b.merchantId;
            this.orderNumber = b.orderNumber;
            this.amount = b.amount;
            this.country = b.country;
            this.currency = b.currency;
            this.transactionType = b.transactionType;
            this.successUrl = b.successUrl;
            this.failureUrl = b.failureUrl;
            this.channel = b.channel;
            this.customerEmail = b.customerEmail;
            this.customerMobile = b.customerMobile;
            this.pgId = b.pgId;
            this.paymode = b.paymode;
            this.schemeId = b.schemeId;
            this.walletType = b.walletType;
            this.cardNumber = b.cardNumber;
            this.expiryMonth = b.expiryMonth;
            this.expiryYear = b.expiryYear;
            this.cvv = b.cvv;
            this.cardName = b.cardName;
            this.customerName = b.customerName;
            this.uniqueId = b.uniqueId;
            this.billAddress = b.billAddress;
            this.billCity = b.billCity;
            this.billState = b.billState;
            this.billCountry = b.billCountry;
            this.billZip = b.billZip;
            this.shipAddress = b.shipAddress;
            this.shipCity = b.shipCity;
            this.shipState = b.shipState;
            this.shipCountry = b.shipCountry;
            this.shipZip = b.shipZip;
            this.shipDays = b.shipDays;
            this.addressCount = b.addressCount;
            this.itemCount = b.itemCount;
            this.itemValue = b.itemValue;
            this.itemCategory = b.itemCategory;
            this.udf1 = b.udf1;
            this.udf2 = b.udf2;
            this.udf3 = b.udf3;
            this.udf4 = b.udf4;
            this.udf5 = b.udf5;
            this.udf6 = b.udf6;
            this.udf7 = b.udf7;
            this.isLoggedIn = b.isLoggedIn;
        }

        public static Builder builder() {
            return new Builder();
        }

        /** Builder for {@link TransactionDetails}. */
        public static final class Builder {
            private String aggregatorId, merchantId, orderNumber, amount, country, currency, transactionType,
                    successUrl, failureUrl, channel;
            private String customerEmail = "";
            private String customerMobile = "";
            private String pgId = "";
            private String paymode = "";
            private String schemeId = "";
            private String walletType = "";
            private String cardNumber = "";
            private String expiryMonth = "";
            private String expiryYear = "";
            private String cvv = "";
            private String cardName = "";
            private String customerName = "";
            private String uniqueId = "";
            private String billAddress = "";
            private String billCity = "";
            private String billState = "";
            private String billCountry = "";
            private String billZip = "";
            private String shipAddress = "";
            private String shipCity = "";
            private String shipState = "";
            private String shipCountry = "";
            private String shipZip = "";
            private String shipDays = "";
            private String addressCount = "";
            private String itemCount = "";
            private String itemValue = "";
            private String itemCategory = "";
            private String udf1 = "";
            private String udf2 = "";
            private String udf3 = "";
            private String udf4 = "";
            private String udf5 = "";
            private String udf6 = "";
            private String udf7 = "";
            private String isLoggedIn = "Y";

            public Builder aggregatorId(String v) {
                this.aggregatorId = v;
                return this;
            }

            public Builder merchantId(String v) {
                this.merchantId = v;
                return this;
            }

            public Builder orderNumber(String v) {
                this.orderNumber = v;
                return this;
            }

            public Builder amount(String v) {
                this.amount = v;
                return this;
            }

            public Builder country(String v) {
                this.country = v;
                return this;
            }

            public Builder currency(String v) {
                this.currency = v;
                return this;
            }

            public Builder transactionType(String v) {
                this.transactionType = v;
                return this;
            }

            public Builder successUrl(String v) {
                this.successUrl = v;
                return this;
            }

            public Builder failureUrl(String v) {
                this.failureUrl = v;
                return this;
            }

            public Builder channel(String v) {
                this.channel = v;
                return this;
            }

            public Builder customerEmail(String v) {
                this.customerEmail = v;
                return this;
            }

            public Builder customerMobile(String v) {
                this.customerMobile = v;
                return this;
            }

            public Builder pgId(String v) {
                this.pgId = v;
                return this;
            }

            public Builder paymode(String v) {
                this.paymode = v;
                return this;
            }

            public Builder schemeId(String v) {
                this.schemeId = v;
                return this;
            }

            public Builder walletType(String v) {
                this.walletType = v;
                return this;
            }

            public Builder cardNumber(String v) {
                this.cardNumber = v;
                return this;
            }

            public Builder expiryMonth(String v) {
                this.expiryMonth = v;
                return this;
            }

            public Builder expiryYear(String v) {
                this.expiryYear = v;
                return this;
            }

            public Builder cvv(String v) {
                this.cvv = v;
                return this;
            }

            public Builder cardName(String v) {
                this.cardName = v;
                return this;
            }

            public Builder customerName(String v) {
                this.customerName = v;
                return this;
            }

            public Builder uniqueId(String v) {
                this.uniqueId = v;
                return this;
            }

            public Builder billAddress(String v) {
                this.billAddress = v;
                return this;
            }

            public Builder billCity(String v) {
                this.billCity = v;
                return this;
            }

            public Builder billState(String v) {
                this.billState = v;
                return this;
            }

            public Builder billCountry(String v) {
                this.billCountry = v;
                return this;
            }

            public Builder billZip(String v) {
                this.billZip = v;
                return this;
            }

            public Builder shipAddress(String v) {
                this.shipAddress = v;
                return this;
            }

            public Builder shipCity(String v) {
                this.shipCity = v;
                return this;
            }

            public Builder shipState(String v) {
                this.shipState = v;
                return this;
            }

            public Builder shipCountry(String v) {
                this.shipCountry = v;
                return this;
            }

            public Builder shipZip(String v) {
                this.shipZip = v;
                return this;
            }

            public Builder shipDays(String v) {
                this.shipDays = v;
                return this;
            }

            public Builder addressCount(String v) {
                this.addressCount = v;
                return this;
            }

            public Builder itemCount(String v) {
                this.itemCount = v;
                return this;
            }

            public Builder itemValue(String v) {
                this.itemValue = v;
                return this;
            }

            public Builder itemCategory(String v) {
                this.itemCategory = v;
                return this;
            }

            public Builder udf1(String v) {
                this.udf1 = v;
                return this;
            }

            public Builder udf2(String v) {
                this.udf2 = v;
                return this;
            }

            public Builder udf3(String v) {
                this.udf3 = v;
                return this;
            }

            public Builder udf4(String v) {
                this.udf4 = v;
                return this;
            }

            public Builder udf5(String v) {
                this.udf5 = v;
                return this;
            }

            public Builder udf6(String v) {
                this.udf6 = v;
                return this;
            }

            public Builder udf7(String v) {
                this.udf7 = v;
                return this;
            }

            public Builder isLoggedIn(String v) {
                this.isLoggedIn = v;
                return this;
            }

            public TransactionDetails build() {
                Objects.requireNonNull(aggregatorId, "aggregatorId");
                Objects.requireNonNull(merchantId, "merchantId");
                Objects.requireNonNull(orderNumber, "orderNumber");
                Objects.requireNonNull(amount, "amount");
                Objects.requireNonNull(country, "country");
                Objects.requireNonNull(currency, "currency");
                Objects.requireNonNull(transactionType, "transactionType");
                Objects.requireNonNull(successUrl, "successUrl");
                Objects.requireNonNull(failureUrl, "failureUrl");
                Objects.requireNonNull(channel, "channel");
                return new TransactionDetails(this);
            }
        }
    }

    public static final class BuiltRequest {
        public final String meId;
        public final String merchantRequestPlain;
        public final String merchantRequest;
        public final String hashInput;
        public final String hashHex;
        public final String hash;
        public final String actionUrl;

        public BuiltRequest(String meId, String merchantRequestPlain, String merchantRequest, String hashInput,
                String hashHex, String hash, String actionUrl) {
            this.meId = meId;
            this.merchantRequestPlain = merchantRequestPlain;
            this.merchantRequest = merchantRequest;
            this.hashInput = hashInput;
            this.hashHex = hashHex;
            this.hash = hash;
            this.actionUrl = actionUrl;
        }
    }

    public static final class ApiIntegrationResponse {
        public String merchantId;
        public String status;
        public String statusMessage;
        public String response;
    }

    public static final class ApiRequestResult {
        public final Object raw;
        public final String decryptedResponse;
        public final String endpoint;

        public ApiRequestResult(Object raw, String decryptedResponse, String endpoint) {
            this.raw = raw;
            this.decryptedResponse = decryptedResponse;
            this.endpoint = endpoint;
        }
    }

    /** Result from Payment Link API calls. */
    public static final class PaymentLinkResult {
        public final Object raw;
        public final String decryptedResponse;
        public final String endpoint;

        public PaymentLinkResult(Object raw, String decryptedResponse, String endpoint) {
            this.raw = raw;
            this.decryptedResponse = decryptedResponse;
            this.endpoint = endpoint;
        }
    }
}
