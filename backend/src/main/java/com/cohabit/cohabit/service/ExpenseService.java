package com.cohabit.cohabit.service;

import com.cohabit.cohabit.entity.Expense;
import com.cohabit.cohabit.entity.ExpenseShare;
import com.cohabit.cohabit.entity.User;
import com.cohabit.cohabit.repository.ExpenseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.ArrayList;
import java.util.List;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

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
    public Expense createExpense(Expense expense) {
        if (expense.getShares() != null) {
            expense.getShares().forEach(share -> {
                share.setExpense(expense);
                if (share.getUserId() != null && share.getUserId().equals(expense.getPayerId())) {
                    share.setPaidAmount(share.getShareAmount());
                } else if (share.getPaidAmount() == null) {
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
            notificationService.notifyHouseholdMembers(
                    saved.getHouseholdId(),
                    null,
                    "Nouvelle dépense",
                    msg,
                    "EXPENSE",
                    "/expenses/" + saved.getId()
            );
        }

        return saved;
    }

    @Transactional
    public Expense createShoppingExpense(Long householdId, Long payerId, String itemName, BigDecimal amount) {
        List<User> members = userRepository.findByHouseholdId(householdId);
        if (members.isEmpty() || members.stream().noneMatch(member -> member.getId().equals(payerId))) {
            throw new IllegalArgumentException("The purchaser must belong to this household");
        }

        BigDecimal total = amount.setScale(2, RoundingMode.HALF_UP);
        if (total.signum() <= 0) {
            throw new IllegalArgumentException("Purchase price must be at least 0.01");
        }
        BigDecimal eachShare = total.divide(BigDecimal.valueOf(members.size()), 2, RoundingMode.DOWN);
        BigDecimal remainder = total.subtract(eachShare.multiply(BigDecimal.valueOf(members.size())));
        List<ExpenseShare> shares = new ArrayList<>();

        for (int i = 0; i < members.size(); i++) {
            User member = members.get(i);
            BigDecimal memberShare = i == 0 ? eachShare.add(remainder) : eachShare;
            ExpenseShare share = new ExpenseShare();
            share.setUserId(member.getId());
            share.setShareAmount(memberShare);
            share.setPaidAmount(member.getId().equals(payerId) ? memberShare : BigDecimal.ZERO);
            shares.add(share);
        }

        Expense expense = new Expense();
        expense.setHouseholdId(householdId);
        expense.setPayerId(payerId);
        expense.setLabel("Shopping: " + itemName);
        expense.setAmount(total);
        expense.setExpenseDate(LocalDate.now());
        expense.setEmoji("🛒");
        expense.setShares(shares);
        return createExpense(expense);
    }

    @Transactional
    public Expense settleExpenseShare(Long expenseId, Long userId, java.math.BigDecimal amount) {
        Expense expense = expenseRepository.findByIdWithShares(expenseId)
                .orElseThrow(() -> new RuntimeException("Expense not found with id " + expenseId));

        if (expense.getShares() != null) {
            for (com.cohabit.cohabit.entity.ExpenseShare share : expense.getShares()) {
                if (share.getUserId() != null && share.getUserId().equals(userId)) {
                    java.math.BigDecimal currentPaid = share.getPaidAmount() != null ? share.getPaidAmount() : java.math.BigDecimal.ZERO;
                    java.math.BigDecimal newPaid = currentPaid.add(amount != null ? amount : java.math.BigDecimal.ZERO);
                    if (share.getShareAmount() != null && newPaid.compareTo(share.getShareAmount()) > 0) {
                        newPaid = share.getShareAmount();
                    }
                    share.setPaidAmount(newPaid);
                    break;
                }
            }
        }
        return expenseRepository.save(expense);
    }

    @jakarta.persistence.PersistenceContext
    private jakarta.persistence.EntityManager entityManager;

    @Transactional
    public Expense updateExpense(Long id, Expense expenseDetails) {
        Expense expense = expenseRepository.findByIdWithShares(id)
                .orElseThrow(() -> new RuntimeException("Expense not found with id " + id));

        expense.setHouseholdId(expenseDetails.getHouseholdId());
        expense.setPayerId(expenseDetails.getPayerId());
        expense.setLabel(expenseDetails.getLabel());
        expense.setAmount(expenseDetails.getAmount());
        expense.setExpenseDate(expenseDetails.getExpenseDate());
        expense.setEmoji(expenseDetails.getEmoji());
        expense.setAttachmentUrl(expenseDetails.getAttachmentUrl());

        if (expense.getShares() != null) {
            expense.getShares().clear();
            entityManager.flush();
        }

        if (expenseDetails.getShares() != null) {
            for (com.cohabit.cohabit.entity.ExpenseShare share : expenseDetails.getShares()) {
                share.setExpense(expense);
                if (share.getUserId() != null && share.getUserId().equals(expense.getPayerId())) {
                    share.setPaidAmount(share.getShareAmount());
                } else if (share.getPaidAmount() == null) {
                    share.setPaidAmount(java.math.BigDecimal.ZERO);
                }
                expense.getShares().add(share);
            }
        }

        return expenseRepository.save(expense);
    }

    @Transactional
    public void deleteExpense(Long id) {
        expenseRepository.deleteById(id);
    }
}
