package com.cohabit.cohabit.controller;

import com.cohabit.cohabit.entity.Settlement;
import com.cohabit.cohabit.service.SettlementService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
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
    public List<Settlement> getAllSettlements() {
        return settlementService.getAllSettlements();
    }

    @GetMapping("/household/{householdId}")
    public List<Settlement> getSettlementsByHousehold(@PathVariable Long householdId) {
        return settlementService.getSettlementsByHousehold(householdId);
    }

    @PostMapping
    public Settlement createSettlement(@Valid @RequestBody Settlement settlement) {
        return settlementService.createSettlement(settlement);
    }
}
