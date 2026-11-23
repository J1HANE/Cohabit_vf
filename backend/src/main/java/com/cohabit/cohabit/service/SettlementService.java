package com.cohabit.cohabit.service;

import com.cohabit.cohabit.entity.Settlement;
import com.cohabit.cohabit.entity.User;
import com.cohabit.cohabit.repository.SettlementRepository;
import com.cohabit.cohabit.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;

@Service
public class SettlementService {

    private final SettlementRepository settlementRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Autowired
    public SettlementService(SettlementRepository settlementRepository,
                             UserRepository userRepository,
                             NotificationService notificationService) {
        this.settlementRepository = settlementRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
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

        Settlement saved = settlementRepository.save(settlement);

        // Notify recipient of settlement
        String msg = actor.getName() + " a enregistré un remboursement de " + saved.getAmount() + " MAD en votre faveur.";
        List<MailDetails.Row> mailRows = new ArrayList<>();
        mailRows.add(new MailDetails.Row("Payé par", actor.getName()));
        mailRows.add(new MailDetails.Row("Montant", saved.getAmount() + " MAD"));
        mailRows.add(new MailDetails.Row("Destinataire", recipient.getName()));
        notificationService.createNotification(
                recipient.getId(),
                actor.getHouseholdId(),
                "Dette réglée",
                msg,
                "SETTLEMENT",
                "/settlements",
                new MailDetails(mailRows)
        );

        return saved;
    }

    @Transactional
    public void requestPayment(Long debtorId, BigDecimal amount, String note, Long actorId) {
        if (debtorId == null) {
            throw new IllegalArgumentException("Debtor user id is required");
        }
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("A positive request amount is required");
        }

        User actor = userRepository.findById(actorId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (actor.getHouseholdId() == null) {
            throw new SecurityException("User does not belong to a household");
        }

        User debtor = userRepository.findById(debtorId)
                .orElseThrow(() -> new IllegalArgumentException("Debtor user not found"));
        if (!actor.getHouseholdId().equals(debtor.getHouseholdId())) {
            throw new IllegalArgumentException("Debtor must belong to the same household");
        }
        if (actorId.equals(debtorId)) {
            throw new IllegalArgumentException("You cannot request payment from yourself");
        }

        BigDecimal normalizedAmount = amount.setScale(2, RoundingMode.HALF_UP);
        String noteSuffix = (note != null && !note.isBlank()) ? " (" + note.strip() + ")" : "";
        String msg = actor.getName() + " vous demande un remboursement de " + normalizedAmount.toPlainString() + " MAD" + noteSuffix;

        List<MailDetails.Row> mailRows = new ArrayList<>();
        mailRows.add(new MailDetails.Row("Demandeur", actor.getName()));
        mailRows.add(new MailDetails.Row("Montant demandé", normalizedAmount.toPlainString() + " MAD"));
        if (note != null && !note.isBlank()) {
            mailRows.add(new MailDetails.Row("Motif / Note", note.strip()));
        }
        mailRows.add(new MailDetails.Row("Action", "Régler ce montant sur CoHabit"));

        notificationService.createNotification(
                debtor.getId(),
                actor.getHouseholdId(),
                "Demande de remboursement",
                msg,
                "PAYMENT_REQUEST",
                "/settlements/new?mode=pay&target=" + actor.getId() + "&amount=" + normalizedAmount.toPlainString(),
                new MailDetails(mailRows)
        );
    }
}
