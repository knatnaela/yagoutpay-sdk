package com.yagoutpay.demo.controller;

import com.yagoutpay.demo.dto.ApiResponse;
import com.yagoutpay.demo.dto.CheckoutRequest;
import com.yagoutpay.demo.service.YagoutPayService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Controller
public class CheckoutController {

    @Autowired
    private YagoutPayService yagoutPayService;

    @GetMapping("/")
    public String index(Model model) {
        // Add catalog data to model
        List<Map<String, Object>> catalog = List.of(
                Map.of("id", "coffee", "name", "Yagout Coffee Beans 500g", "priceCents", 8500,
                        "image",
                        "https://images.unsplash.com/photo-1503481766315-7a586b20f66f?q=80&w=800&auto=format&fit=crop"),
                Map.of("id", "mug", "name", "Signature Ceramic Mug", "priceCents", 100,
                        "image",
                        "https://images.unsplash.com/photo-1481349518771-20055b2a7b24?q=80&w=800&auto=format&fit=crop"),
                Map.of("id", "tshirt", "name", "Comfort Tee", "priceCents", 6900,
                        "image",
                        "https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=800&auto=format&fit=crop"),
                Map.of("id", "cap", "name", "Dad Hat", "priceCents", 4500,
                        "image",
                        "https://images.unsplash.com/photo-1521123845560-14093637aa7a?q=80&w=800&auto=format&fit=crop"),
                Map.of("id", "sticker", "name", "Sticker Pack", "priceCents", 900,
                        "image",
                        "https://images.unsplash.com/photo-1622551243908-05f646813e6e?q=80&w=800&auto=format&fit=crop"));

        model.addAttribute("catalog", catalog);
        return "index";
    }

    @PostMapping("/links/dynamic")
    @ResponseBody
    public ApiResponse<Map<String, Object>> generateDynamicLink(@RequestBody Map<String, Object> body,
            HttpServletRequest httpRequest) {
        try {
            String amount = String.valueOf(body.getOrDefault("amount", "")).trim();
            String order = String.valueOf(body.getOrDefault("order", "")).trim();
            String product = String.valueOf(body.getOrDefault("product", "Custom Payment")).trim();
            String email = String.valueOf(body.getOrDefault("email", "")).trim();
            String mobile = String.valueOf(body.getOrDefault("mobile", "")).trim();
            String expiry = String.valueOf(body.getOrDefault("expiry", "")).trim();

            if (amount.isEmpty()) {
                return new ApiResponse<>(false, "amount is required");
            }

            if (order.isEmpty()) {
                order = "ORDER_" + System.currentTimeMillis();
            }

            String baseUrl = httpRequest.getScheme() + "://" + httpRequest.getServerName() +
                    ((httpRequest.getServerPort() != 80 && httpRequest.getServerPort() != 443)
                            ? ":" + httpRequest.getServerPort()
                            : "");

            Map<String, Object> data = new HashMap<>();
            Map<String, Object> result = yagoutPayService.sendPaymentLinkDynamic(
                    amount,
                    order,
                    product,
                    email,
                    mobile,
                    expiry,
                    baseUrl + "/success",
                    baseUrl + "/failure");
            data.putAll(result);
            return new ApiResponse<>(true, data);
        } catch (Exception e) {
            System.err.println("Error: " + e.getClass().getSimpleName() + " - " + e.getMessage());
            e.printStackTrace();
            return new ApiResponse<>(false, e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName());
        }
    }

    @PostMapping("/links/static")
    @ResponseBody
    public ApiResponse<Map<String, Object>> generateStaticLink(@RequestBody Map<String, Object> body,
            HttpServletRequest httpRequest) {
        try {
            String amount = String.valueOf(body.getOrDefault("amount", "")).trim();
            String email = String.valueOf(body.getOrDefault("email", "")).trim();
            String mobile = String.valueOf(body.getOrDefault("mobile", "")).trim();

            if (amount.isEmpty()) {
                return new ApiResponse<>(false, "amount is required");
            }

            String baseUrl = httpRequest.getScheme() + "://" + httpRequest.getServerName() +
                    ((httpRequest.getServerPort() != 80 && httpRequest.getServerPort() != 443)
                            ? ":" + httpRequest.getServerPort()
                            : "");

            Map<String, Object> data = new HashMap<>();
            Map<String, Object> result = yagoutPayService.sendPaymentLinkStatic(
                    amount,
                    email,
                    mobile,
                    baseUrl + "/success",
                    baseUrl + "/failure");
            data.putAll(result);
            return new ApiResponse<>(true, data);
        } catch (Exception e) {
            System.err.println("Error: " + e.getClass().getSimpleName() + " - " + e.getMessage());
            e.printStackTrace();
            return new ApiResponse<>(false, e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName());
        }
    }

    @PostMapping("/api/build")
    @ResponseBody
    public ApiResponse<Map<String, Object>> buildHostedForm(@RequestBody CheckoutRequest request,
            HttpServletRequest httpRequest) {
        try {
            if (request.getCart() == null || request.getCart().isEmpty()) {
                return new ApiResponse<>(false, "Cart is required");
            }

            // Calculate total amount
            int totalCents = request.getCart().stream()
                    .mapToInt(item -> getPriceCents(item.getId()) * item.getQty())
                    .sum();

            if (totalCents <= 0) {
                return new ApiResponse<>(false, "Cart is empty");
            }

            String amount = String.format("%.2f", totalCents / 100.0);
            String baseUrl = httpRequest.getScheme() + "://" + httpRequest.getServerName() +
                    (httpRequest.getServerPort() != 80 && httpRequest.getServerPort() != 443
                            ? ":" + httpRequest.getServerPort()
                            : "");

            Map<String, Object> data = yagoutPayService.buildHostedForm(
                    amount,
                    baseUrl,
                    request.getEmail() != null ? request.getEmail() : "",
                    request.getMobile() != null ? request.getMobile() : "");

            return new ApiResponse<>(true, data);
        } catch (Exception e) {
            System.err.println("Error: " + e.getClass().getSimpleName() + " - " + e.getMessage());
            e.printStackTrace();
            return new ApiResponse<>(false, e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName());
        }
    }

    @PostMapping("/api/send")
    @ResponseBody
    public ApiResponse<Map<String, Object>> sendApiRequest(@RequestBody CheckoutRequest request) {
        try {
            if (request.getCart() == null || request.getCart().isEmpty()) {
                return new ApiResponse<>(false, "Cart is required");
            }

            if (request.getMobile() == null || request.getMobile().trim().isEmpty()) {
                return new ApiResponse<>(false, "Mobile is required for API mode");
            }

            // Calculate total amount
            int totalCents = request.getCart().stream()
                    .mapToInt(item -> getPriceCents(item.getId()) * item.getQty())
                    .sum();

            if (totalCents <= 0) {
                return new ApiResponse<>(false, "Cart is empty");
            }

            String amount = String.format("%.2f", totalCents / 100.0);

            Map<String, Object> data = yagoutPayService.sendApiRequest(
                    amount,
                    request.getMobile(),
                    request.getEmail() != null ? request.getEmail() : "");

            return new ApiResponse<>(true, data);
        } catch (Exception e) {
            System.err.println("Error: " + e.getClass().getSimpleName() + " - " + e.getMessage());
            e.printStackTrace();
            return new ApiResponse<>(false, e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName());
        }
    }

    @PostMapping("/success")
    public String success(@RequestParam Map<String, String> params, Model model) {
        model.addAttribute("title", "Payment Success");
        model.addAttribute("tone", "success");
        model.addAttribute("raw", params);
        return "callback";
    }

    @GetMapping("/failure")
    public String failureGet(@RequestParam Map<String, String> params, Model model) {
        model.addAttribute("title", "Payment Failed");
        model.addAttribute("tone", "failure");
        model.addAttribute("raw", params);
        return "callback";
    }

    @PostMapping("/failure")
    public String failurePost(@RequestParam Map<String, String> params, Model model) {
        model.addAttribute("title", "Payment Failed");
        model.addAttribute("tone", "failure");
        model.addAttribute("raw", params);
        return "callback";
    }

    private int getPriceCents(String id) {
        return switch (id) {
            case "coffee" -> 8500;
            case "mug" -> 100;
            case "tshirt" -> 6900;
            case "cap" -> 4500;
            case "sticker" -> 900;
            default -> 0;
        };
    }
}
