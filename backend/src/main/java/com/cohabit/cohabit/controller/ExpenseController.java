package com.cohabit.cohabit.controller;

import com.cohabit.cohabit.entity.Expense;
import com.cohabit.cohabit.service.ExpenseService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
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
    public List<Expense> getAllExpenses() {
        return expenseService.getAllExpenses();
    }

    @GetMapping("/household/{householdId}")
    public List<Expense> getExpensesByHousehold(@PathVariable Long householdId) {
        return expenseService.getExpensesByHousehold(householdId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Expense> getExpenseById(@PathVariable Long id) {
        return expenseService.getExpenseById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public Expense createExpense(@Valid @RequestBody Expense expense) {
        return expenseService.createExpense(expense);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Expense> updateExpense(@PathVariable Long id, @Valid @RequestBody Expense expense) {
        try {
            return ResponseEntity.ok(expenseService.updateExpense(id, expense));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/settle")
    public ResponseEntity<?> settleExpense(@PathVariable Long id, @RequestBody java.util.Map<String, Object> payload) {
        try {
            Long userId = null;
            if (payload.get("userId") != null) {
                userId = Long.valueOf(payload.get("userId").toString());
            }
            java.math.BigDecimal amount = null;
            if (payload.get("amount") != null) {
                amount = new java.math.BigDecimal(payload.get("amount").toString());
            }
            if (userId == null || amount == null || amount.compareTo(java.math.BigDecimal.ZERO) <= 0) {
                return ResponseEntity.badRequest().body(java.util.Map.of("error", "Valid userId and amount are required"));
            }
            Expense updated = expenseService.settleExpenseShare(id, userId, amount);
            return ResponseEntity.ok(updated);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExpense(@PathVariable Long id) {
        expenseService.deleteExpense(id);
        return ResponseEntity.noContent().build();
    }
}

