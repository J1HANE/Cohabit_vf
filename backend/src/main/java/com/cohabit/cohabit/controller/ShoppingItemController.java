package com.cohabit.cohabit.controller;

import com.cohabit.cohabit.entity.ShoppingItem;
import com.cohabit.cohabit.service.ShoppingItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

import java.util.List;

@RestController
@RequestMapping("/api/shopping")
public class ShoppingItemController {

    private final ShoppingItemService shoppingItemService;

    @Autowired
    public ShoppingItemController(ShoppingItemService shoppingItemService) {
        this.shoppingItemService = shoppingItemService;
    }

    @GetMapping
    public List<ShoppingItem> getAllShoppingItems() {
        return shoppingItemService.getAllShoppingItems();
    }

    @GetMapping("/household/{householdId}")
    public List<ShoppingItem> getShoppingItemsByHousehold(@PathVariable Long householdId) {
        return shoppingItemService.getShoppingItemsByHousehold(householdId);
    }

    @PostMapping
    public ShoppingItem createShoppingItem(@Valid @RequestBody ShoppingItem shoppingItem) {
        return shoppingItemService.createShoppingItem(shoppingItem);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateShoppingItem(@PathVariable Long id, @Valid @RequestBody ShoppingItem shoppingItem) {
        try {
            return ResponseEntity.ok(shoppingItemService.updateShoppingItem(id, shoppingItem));
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/purchase")
    public ResponseEntity<?> purchaseShoppingItem(@PathVariable Long id,
                                                   @Valid @RequestBody PurchaseRequest request) {
        try {
            return ResponseEntity.ok(shoppingItemService.purchaseShoppingItem(
                    id, request.price(), request.purchaserId()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(java.util.Map.of("error", e.getMessage()));
        } catch (java.util.NoSuchElementException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteShoppingItem(@PathVariable Long id) {
        shoppingItemService.deleteShoppingItem(id);
        return ResponseEntity.noContent().build();
    }

    public record PurchaseRequest(
            @NotNull @DecimalMin(value = "0.01") BigDecimal price,
            @NotNull Long purchaserId) {}
}
