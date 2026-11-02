package com.cohabit.cohabit.service;

import com.cohabit.cohabit.entity.Expense;
import com.cohabit.cohabit.repository.ExpenseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final NotificationService notificationService;
    private final com.cohabit.cohabit.repository.UserRepository userRepository;

    @Autowired
    public ExpenseService(ExpenseRepository expenseRepository,
                          NotificationService notificationService,
                          com.cohabit.cohabit.repository.UserRepository userRepository) {
        this.expenseRepository = expenseRepository;
        this.notificationService = notificationService;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<Expense> getAllExpenses() {
        return expenseRepository.findAllWithShares();
    }

    @Transactional(readOnly = true)
    public List<Expense> getExpensesByHousehold(Long householdId) {
        return expenseRepository.findByHouseholdIdWithShares(householdId);
    }

    @Transactional(readOnly = true)
    public Optional<Expense> getExpenseById(Long id) {
        return expenseRepository.findByIdWithShares(id);
    }

    @Transactional
    public Expense createExpense(Expense expense, Long actorId) {
        validateExpense(expense);
        com.cohabit.cohabit.entity.User creator = requireHouseholdMember(expense.getHouseholdId(), actorId);
        expense.setCreatedBy(creator);
        requireHouseholdMember(expense.getHouseholdId(), expense.getPayerId());
        if (expense.getShares() != null) {
            expense.getShares().forEach(share -> {
                requireHouseholdMember(expense.getHouseholdId(), share.getUserId());
                share.setExpense(expense);
                if (share.getUserId() != null && share.getUserId().equals(expense.getPayerId())) {
                    share.setPaidAmount(share.getShareAmount());
                } else {
                    share.setPaidAmount(java.math.BigDecimal.ZERO);
                }
            });
        }
        Expense saved = expenseRepository.save(expense);

        // Keep notification creation in the expense transaction. If it fails,
        // surface the failure instead of silently saving an expense with no alert.
        if (saved.getHouseholdId() != null) {
            String payerName = "Un colocataire";
            if (saved.getPayerId() != null) {
                payerName = userRepository.findById(saved.getPayerId())
                        .map(com.cohabit.cohabit.entity.User::getName)
                        .orElse("Un colocataire");
            }
            String msg = payerName + " a ajouté la dépense '" + saved.getLabel() + "' (" + saved.getAmount() + " MAD)";
            List<MailDetails.Row> mailRows = new ArrayList<>();
            mailRows.add(new MailDetails.Row("Dépense", value(saved.getEmoji(), "💸") + " " + value(saved.getLabel(), "Dépense")));
            mailRows.add(new MailDetails.Row("Date de la dépense", saved.getExpenseDate() == null
                    ? "Non renseignée" : saved.getExpenseDate().format(DateTimeFormatter.ofPattern("d MMMM yyyy", Locale.FRENCH))));
            mailRows.add(new MailDetails.Row("Montant total", money(saved.getAmount()) + " MAD"));
            mailRows.add(new MailDetails.Row("Payée par", payerName));
            mailRows.add(new MailDetails.Row("Ajoutée par", creator.getName()));

            List<com.cohabit.cohabit.entity.ExpenseShare> shares = saved.getShares() == null ? List.of() : saved.getShares();
            Map<Long, String> memberNames = new HashMap<>();
            for (com.cohabit.cohabit.entity.ExpenseShare share : shares) {
                if (share.getUserId() != null) {
                    memberNames.put(share.getUserId(), userRepository.findById(share.getUserId())
                            .map(com.cohabit.cohabit.entity.User::getName).orElse("Colocataire"));
                }
            }
            for (com.cohabit.cohabit.entity.ExpenseShare share : shares) {
                String memberName = memberNames.getOrDefault(share.getUserId(), "Colocataire");
                java.math.BigDecimal shareAmount = share.getShareAmount() == null ? java.math.BigDecimal.ZERO : share.getShareAmount();
                java.math.BigDecimal paidAmount = share.getPaidAmount() == null ? java.math.BigDecimal.ZERO : share.getPaidAmount();
                boolean isPayer = share.getUserId() != null && share.getUserId().equals(saved.getPayerId());
                java.math.BigDecimal remaining = isPayer ? java.math.BigDecimal.ZERO : shareAmount.subtract(paidAmount).max(java.math.BigDecimal.ZERO);
                String status = remaining.signum() == 0 ? "Réglé" : paidAmount.signum() > 0
                        ? "Reste " + money(remaining) + " MAD (" + money(paidAmount) + " MAD réglés)"
                        : "À régler : " + money(remaining) + " MAD";
                mailRows.add(new MailDetails.Row("Part — " + memberName,
                        money(shareAmount) + " MAD · " + status));
            }
            if (saved.getAttachmentUrl() != null && !saved.getAttachmentUrl().isBlank()) {
                String filename = saved.getAttachmentUrl().substring(saved.getAttachmentUrl().lastIndexOf('/') + 1);
                mailRows.add(new MailDetails.Row("Justificatif", "Pièce jointe : " + filename + " (disponible dans la plateforme)"));
            }
            notificationService.notifyHouseholdMembers(
                    saved.getHouseholdId(),
                    null,
                    "Nouvelle dépense",
                    msg,
                    "EXPENSE",
                    "/expenses/" + saved.getId(),
                    new MailDetails(mailRows)
            );
        }

        return saved;
    }

    private String money(java.math.BigDecimal amount) {
        return (amount == null ? java.math.BigDecimal.ZERO : amount).setScale(2, java.math.RoundingMode.HALF_UP).toPlainString();
    }

    private String value(String candidate, String fallback) {
        return candidate == null || candidate.isBlank() ? fallback : candidate;
    }

    @Transactional
    public Expense settleExpenseShare(Long expenseId, Long userId, java.math.BigDecimal amount, Long actorId) {
        Expense expense = expenseRepository.findByIdWithShares(expenseId)
                .orElseThrow(() -> new RuntimeException("Expense not found with id " + expenseId));
        requireHouseholdMember(expense.getHouseholdId(), actorId);
        if (!actorId.equals(userId)) {
            throw new SecurityException("A member can only settle their own share");
        }

        boolean foundShare = false;
        if (expense.getShares() != null) {
            for (com.cohabit.cohabit.entity.ExpenseShare share : expense.getShares()) {
                if (share.getUserId() != null && share.getUserId().equals(userId)) {
                    foundShare = true;
                    java.math.BigDecimal currentPaid = share.getPaidAmount() != null ? share.getPaidAmount() : java.math.BigDecimal.ZERO;
                    java.math.BigDecimal newPaid = currentPaid.add(amount != null ? amount : java.math.BigDecimal.ZERO);
                    if (share.getShareAmount() == null || newPaid.compareTo(share.getShareAmount()) > 0)
                        throw new IllegalArgumentException("Payment exceeds the remaining share");
                    share.setPaidAmount(newPaid);
                    break;
                }
            }
        }
        if (!foundShare) throw new IllegalArgumentException("No expense share exists for this user");
        return expenseRepository.save(expense);
    }

    @jakarta.persistence.PersistenceContext
    private jakarta.persistence.EntityManager entityManager;

    @Transactional
    public Expense updateExpense(Long id, Expense expenseDetails, Long actorId) {
        validateExpense(expenseDetails);
        Expense expense = expenseRepository.findByIdWithShares(id)
                .orElseThrow(() -> new RuntimeException("Expense not found with id " + id));
        requireCreator(expense, actorId);
        if (!expense.getHouseholdId().equals(expenseDetails.getHouseholdId())) {
            throw new IllegalArgumentException("An expense cannot be moved to another household");
        }
        requireHouseholdMember(expense.getHouseholdId(), expenseDetails.getPayerId());

        expense.setPayerId(expenseDetails.getPayerId());
        expense.setLabel(expenseDetails.getLabel());
        expense.setAmount(expenseDetails.getAmount());
        expense.setExpenseDate(expenseDetails.getExpenseDate());
        expense.setEmoji(expenseDetails.getEmoji());
        expense.setAttachmentUrl(expenseDetails.getAttachmentUrl());

        java.util.Map<Long, java.math.BigDecimal> previousPaidAmounts = new java.util.HashMap<>();
        if (expense.getShares() != null) {
            for (com.cohabit.cohabit.entity.ExpenseShare share : expense.getShares()) {
                if (share.getUserId() != null) {
                    previousPaidAmounts.put(share.getUserId(), share.getPaidAmount() == null
                            ? java.math.BigDecimal.ZERO : share.getPaidAmount());
                }
            }
            expense.getShares().clear();
            entityManager.flush();
        }

        if (expenseDetails.getShares() != null) {
            for (com.cohabit.cohabit.entity.ExpenseShare share : expenseDetails.getShares()) {
                requireHouseholdMember(expense.getHouseholdId(), share.getUserId());
                share.setExpense(expense);
                if (share.getUserId() != null && share.getUserId().equals(expense.getPayerId())) {
                    share.setPaidAmount(share.getShareAmount());
                } else {
                    java.math.BigDecimal previousPaid = previousPaidAmounts.getOrDefault(
                            share.getUserId(), java.math.BigDecimal.ZERO);
                    share.setPaidAmount(previousPaid.min(share.getShareAmount()));
                }
                expense.getShares().add(share);
            }
        }

        return expenseRepository.save(expense);
    }

    @Transactional
    public void deleteExpense(Long id, Long actorId) {
        Expense expense = expenseRepository.findByIdWithShares(id)
                .orElseThrow(() -> new RuntimeException("Expense not found with id " + id));
        requireCreator(expense, actorId);
        expenseRepository.delete(expense);
    }

    private com.cohabit.cohabit.entity.User requireHouseholdMember(Long householdId, Long userId) {
        if (householdId == null || userId == null) {
            throw new IllegalArgumentException("A household and user are required");
        }
        com.cohabit.cohabit.entity.User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (!householdId.equals(user.getHouseholdId())) {
            throw new SecurityException("User does not belong to this household");
        }
        return user;
    }

    private void requireCreator(Expense expense, Long actorId) {
        if (actorId == null || !actorId.equals(expense.getCreatedById())) {
            throw new SecurityException("Only the expense creator can modify it");
        }
        requireHouseholdMember(expense.getHouseholdId(), actorId);
    }

    private void validateExpense(Expense expense) {
        if (expense.getLabel() == null || expense.getLabel().isBlank()
                || expense.getAmount() == null || expense.getAmount().compareTo(java.math.BigDecimal.ZERO) <= 0
                || expense.getExpenseDate() == null) {
            throw new IllegalArgumentException("Expense label, date, and positive amount are required");
        }
        if (expense.getShares() == null || expense.getShares().isEmpty()) {
            throw new IllegalArgumentException("At least one expense share is required");
        }
        java.util.Set<Long> shareUserIds = new java.util.HashSet<>();
        if (expense.getShares().stream().anyMatch(share -> share.getUserId() == null
                || !shareUserIds.add(share.getUserId()))) {
            throw new IllegalArgumentException("Each household member can have only one share");
        }
        java.math.BigDecimal totalShares = expense.getShares().stream()
                .map(share -> share.getShareAmount() == null ? java.math.BigDecimal.ZERO : share.getShareAmount())
                .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
        if (expense.getShares().stream().anyMatch(share -> share.getShareAmount() == null
                || share.getShareAmount().compareTo(java.math.BigDecimal.ZERO) < 0)
                || totalShares.compareTo(expense.getAmount()) != 0) {
            throw new IllegalArgumentException("Expense shares must be non-negative and equal the total amount");
        }
    }
}
