package com.cohabit.cohabit.service;

import com.cohabit.cohabit.entity.Settlement;
import com.cohabit.cohabit.entity.User;
import com.cohabit.cohabit.repository.SettlementRepository;
import com.cohabit.cohabit.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SettlementService {

    private final SettlementRepository settlementRepository;
    private final UserRepository userRepository;

    @Autowired
    public SettlementService(SettlementRepository settlementRepository, UserRepository userRepository) {
        this.settlementRepository = settlementRepository;
        this.userRepository = userRepository;
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
    public Settlement createSettlement(Settlement settlement, Long actorId) {
        User actor = userRepository.findById(actorId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (actor.getHouseholdId() == null || !actor.getHouseholdId().equals(settlement.getHouseholdId())) {
            throw new SecurityException("User does not belong to this household");
        }
        if (!actorId.equals(settlement.getFromUserId())) {
            throw new SecurityException("A settlement must be recorded by the paying user");
        }
        User recipient = userRepository.findById(settlement.getToUserId())
                .orElseThrow(() -> new IllegalArgumentException("Recipient not found"));
        if (!actor.getHouseholdId().equals(recipient.getHouseholdId())) {
            throw new IllegalArgumentException("Recipient must belong to this household");
        }
        if (actorId.equals(recipient.getId()) || settlement.getAmount() == null
                || settlement.getAmount().compareTo(java.math.BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("A different recipient and positive amount are required");
        }
        return settlementRepository.save(settlement);
    }
}
