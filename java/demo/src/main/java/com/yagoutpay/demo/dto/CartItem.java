package com.yagoutpay.demo.dto;

public class CartItem {
    private String id;
    private int qty;

    public CartItem() {
    }

    public CartItem(String id, int qty) {
        this.id = id;
        this.qty = qty;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public int getQty() {
        return qty;
    }

    public void setQty(int qty) {
        this.qty = qty;
    }
}
