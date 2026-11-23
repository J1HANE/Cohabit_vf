package com.cohabit.cohabit.service;

import com.cohabit.cohabit.entity.Settlement;
import com.cohabit.cohabit.entity.User;
import com.cohabit.cohabit.repository.SettlementRepository;
import com.cohabit.cohabit.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SettlementServiceTest {

    @Mock private SettlementRepository settlementRepository;
    @Mock private UserRepository userRepository;
    @Mock private NotificationService notificationService;
    @InjectMocks private SettlementService settlementService;

    @Test
    void requestPaymentSuccessfullyNotifiesDebtor() {
        User actor = new User();
        actor.setId(1L);
        actor.setName("Alice");
        actor.setHouseholdId(10L);

        User debtor = new User();
        debtor.setId(2L);
        debtor.setName("Bob");
        debtor.setHouseholdId(10L);

        when(userRepository.findById(1L)).thenReturn(Optional.of(actor));
        when(userRepository.findById(2L)).thenReturn(Optional.of(debtor));

        settlementService.requestPayment(2L, new BigDecimal("45.50"), "Groceries", 1L);

        verify(notificationService).createNotification(
                eq(2L),
                eq(10L),
                eq("Demande de remboursement"),
                contains("Alice vous demande un remboursement de 45.50 MAD (Groceries)"),
                eq("PAYMENT_REQUEST"),
                contains("/settlements/new?mode=pay"),
                any()
        );
    }

    @Test
    void cannotRequestPaymentFromSelf() {
        User actor = new User();
        actor.setId(1L);
        actor.setHouseholdId(10L);

        when(userRepository.findById(1L)).thenReturn(Optional.of(actor));

        assertThrows(IllegalArgumentException.class, () ->
                settlementService.requestPayment(1L, new BigDecimal("10.00"), "", 1L));
    }
}
