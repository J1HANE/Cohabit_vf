package com.cohabit.cohabit.controller;

import com.cohabit.cohabit.entity.Expense;
import com.cohabit.cohabit.service.ExpenseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {

    private final ExpenseService expenseService;

    @Autowired
    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @GetMapping
    public List<Expense> getAllExpenses(@AuthenticationPrincipal com.cohabit.cohabit.entity.User actor) {
        return actor.getHouseholdId() == null ? List.of() : expenseService.getExpensesByHousehold(actor.getHouseholdId());
    }

    @GetMapping("/household/{householdId}")
    public ResponseEntity<?> getExpensesByHousehold(@PathVariable Long householdId,
                                                    @AuthenticationPrincipal com.cohabit.cohabit.entity.User actor) {
        if (!householdId.equals(actor.getHouseholdId()) && !"ADMIN".equals(actor.getRole())) {
            return ResponseEntity.status(403).body(java.util.Map.of("error", "Access denied"));
        }
        return ResponseEntity.ok(expenseService.getExpensesByHousehold(householdId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getExpenseById(@PathVariable Long id,
                                            @AuthenticationPrincipal com.cohabit.cohabit.entity.User actor) {
        return expenseService.getExpenseById(id)
                .filter(expense -> expense.getHouseholdId().equals(actor.getHouseholdId()) || "ADMIN".equals(actor.getRole()))
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<?> createExpense(@Valid @RequestBody Expense expense,
                                           @AuthenticationPrincipal com.cohabit.cohabit.entity.User actor) {
        try {
            return ResponseEntity.ok(expenseService.createExpense(expense, actor.getId()));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(java.util.Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateExpense(@PathVariable Long id, @Valid @RequestBody Expense expense,
                                          @AuthenticationPrincipal com.cohabit.cohabit.entity.User actor) {
        try {
            return ResponseEntity.ok(expenseService.updateExpense(id, expense, actor.getId()));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(java.util.Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            e.printStackTrace();
            return ResponseEntity.status(404).body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{id}/settle")
    public ResponseEntity<?> settleExpense(@PathVariable Long id, @RequestBody java.util.Map<String, Object> payload,
                                           @AuthenticationPrincipal com.cohabit.cohabit.entity.User actor) {
        try {
            java.math.BigDecimal amount = null;
            if (payload.get("amount") != null) {
                amount = new java.math.BigDecimal(payload.get("amount").toString());
            }
            if (amount == null || amount.compareTo(java.math.BigDecimal.ZERO) <= 0) {
                return ResponseEntity.badRequest().body(java.util.Map.of("error", "A valid positive amount is required"));
            }
            Expense updated = expenseService.settleExpenseShare(id, actor.getId(), amount, actor.getId());
            return ResponseEntity.ok(updated);
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(java.util.Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteExpense(@PathVariable Long id,
                                           @AuthenticationPrincipal com.cohabit.cohabit.entity.User actor) {
        try {
            expenseService.deleteExpense(id, actor.getId());
            return ResponseEntity.noContent().build();
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(java.util.Map.of("error", e.getMessage()));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}

