package com.yagoutpay.demo.dto;

import java.util.List;

public class CheckoutRequest {
    private List<CartItem> cart;
    private String email;
    private String mobile;
    private String pgOptionId;

    public CheckoutRequest() {
    }

    public List<CartItem> getCart() {
        return cart;
    }

    public void setCart(List<CartItem> cart) {
        this.cart = cart;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getMobile() {
        return mobile;
    }

    public void setMobile(String mobile) {
        this.mobile = mobile;
    }

    public String getPgOptionId() {
        return pgOptionId;
    }

    public void setPgOptionId(String pgOptionId) {
        this.pgOptionId = pgOptionId;
    }
}
