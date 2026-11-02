package com.cohabit.cohabit.service;

import com.cohabit.cohabit.entity.Expense;
import com.cohabit.cohabit.entity.User;
import com.cohabit.cohabit.repository.ExpenseRepository;
import com.cohabit.cohabit.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ExpenseServiceTest {

    @Mock private ExpenseRepository expenseRepository;
    @Mock private NotificationService notificationService;
    @Mock private UserRepository userRepository;
    @InjectMocks private ExpenseService expenseService;

    @Test
    void onlyCreatorCanUpdateExpense() {
        User creator = new User();
        creator.setId(12L);
        Expense existing = new Expense();
        existing.setHouseholdId(3L);
        existing.setCreatedBy(creator);
        when(expenseRepository.findByIdWithShares(5L)).thenReturn(Optional.of(existing));

        Expense update = new Expense();
        update.setHouseholdId(3L);
        update.setLabel("Updated");
        update.setAmount(new BigDecimal("8.00"));
        update.setExpenseDate(LocalDate.now());
        update.setShares(new java.util.ArrayList<>());
        com.cohabit.cohabit.entity.ExpenseShare share = new com.cohabit.cohabit.entity.ExpenseShare();
        share.setUserId(12L);
        share.setShareAmount(new BigDecimal("8.00"));
        update.getShares().add(share);

        assertThrows(SecurityException.class, () -> expenseService.updateExpense(5L, update, 99L));
    }
}