package com.cohabit.cohabit.service;

import com.cohabit.cohabit.entity.Settlement;
import com.cohabit.cohabit.repository.SettlementRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SettlementService {

    private final SettlementRepository settlementRepository;

    @Autowired
    public SettlementService(SettlementRepository settlementRepository) {
        this.settlementRepository = settlementRepository;
    }

    @Transactional(readOnly = true)
    public List<Settlement> getAllSettlements() {
        return settlementRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Settlement> getSettlementsByHousehold(Long householdId) {
        return settlementRepository.findByHouseholdIdOrderBySettledAtDesc(householdId);
    }

    @Transactional
    public Settlement createSettlement(Settlement settlement) {
        return settlementRepository.save(settlement);
    }
}
