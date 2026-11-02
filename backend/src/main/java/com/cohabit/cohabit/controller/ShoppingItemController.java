package com.cohabit.cohabit.controller;

import com.cohabit.cohabit.entity.ShoppingItem;
import com.cohabit.cohabit.service.ShoppingItemService;
import com.cohabit.cohabit.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

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
    public List<ShoppingItem> getAllShoppingItems(@AuthenticationPrincipal User actor) {
        return actor.getHouseholdId() == null ? List.of()
                : shoppingItemService.getShoppingItemsByHousehold(actor.getHouseholdId());
    }

    @GetMapping("/household/{householdId}")
    public ResponseEntity<?> getShoppingItemsByHousehold(@PathVariable Long householdId,
                                                         @AuthenticationPrincipal User actor) {
        if (!householdId.equals(actor.getHouseholdId()) && !"ADMIN".equals(actor.getRole())) {
            return ResponseEntity.status(403).body(java.util.Map.of("error", "Access denied"));
        }
        return ResponseEntity.ok(shoppingItemService.getShoppingItemsByHousehold(householdId));
    }

    @PostMapping
    public ResponseEntity<?> createShoppingItem(@Valid @RequestBody ShoppingItem shoppingItem,
                                                @AuthenticationPrincipal User actor) {
        try {
            return ResponseEntity.ok(shoppingItemService.createShoppingItem(shoppingItem, actor.getId()));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(java.util.Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateShoppingItem(@PathVariable Long id, @Valid @RequestBody ShoppingItem shoppingItem,
                                                @AuthenticationPrincipal User actor) {
        try {
            return ResponseEntity.ok(shoppingItemService.updateShoppingItem(id, shoppingItem, actor.getId()));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(java.util.Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/purchase")
    public ResponseEntity<?> purchaseItem(@PathVariable Long id, @RequestBody java.util.Map<String, Object> payload,
                                          @AuthenticationPrincipal User actor) {
        try {
            java.math.BigDecimal price = new java.math.BigDecimal(payload.get("price").toString());
            return ResponseEntity.ok(shoppingItemService.purchaseShoppingItem(id, price, actor.getId()));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(java.util.Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException | IllegalStateException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteShoppingItem(@PathVariable Long id, @AuthenticationPrincipal User actor) {
        try {
            shoppingItemService.deleteShoppingItem(id, actor.getId());
            return ResponseEntity.noContent().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(java.util.Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}
