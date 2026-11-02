package com.cohabit.cohabit.controller;

import com.cohabit.cohabit.entity.Settlement;
import com.cohabit.cohabit.entity.User;
import com.cohabit.cohabit.service.SettlementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("/api/settlements")
public class SettlementController {

    private final SettlementService settlementService;

    @Autowired
    public SettlementController(SettlementService settlementService) {
        this.settlementService = settlementService;
    }

    @GetMapping
    public List<Settlement> getAllSettlements(@AuthenticationPrincipal User actor) {
        return actor.getHouseholdId() == null ? List.of()
                : settlementService.getSettlementsByHousehold(actor.getHouseholdId());
    }

    @GetMapping("/household/{householdId}")
    public ResponseEntity<?> getSettlementsByHousehold(@PathVariable Long householdId,
                                                       @AuthenticationPrincipal User actor) {
        if (!householdId.equals(actor.getHouseholdId()) && !"ADMIN".equals(actor.getRole())) {
            return ResponseEntity.status(403).body(java.util.Map.of("error", "Access denied"));
        }
        return ResponseEntity.ok(settlementService.getSettlementsByHousehold(householdId));
    }

    @PostMapping
    public ResponseEntity<?> createSettlement(@Valid @RequestBody Settlement settlement,
                                              @AuthenticationPrincipal User actor) {
        try {
            return ResponseEntity.ok(settlementService.createSettlement(settlement, actor.getId()));
        } catch (SecurityException e) {
            return ResponseEntity.status(403).body(java.util.Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }
}
