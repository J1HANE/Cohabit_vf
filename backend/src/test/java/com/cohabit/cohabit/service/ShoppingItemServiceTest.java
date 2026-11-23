package com.cohabit.cohabit.service;

import com.cohabit.cohabit.entity.Expense;
import com.cohabit.cohabit.entity.ShoppingItem;
import com.cohabit.cohabit.entity.User;
import com.cohabit.cohabit.repository.ShoppingItemRepository;
import com.cohabit.cohabit.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ShoppingItemServiceTest {

    @Mock private ShoppingItemRepository shoppingItemRepository;
    @Mock private UserRepository userRepository;
    @Mock private ExpenseService expenseService;
    @InjectMocks private ShoppingItemService shoppingItemService;

    @Test
    void purchaseShoppingItemCreatesExpenseAndMarksPurchased() {
        Long householdId = 5L;
        Long userId = 1L;

        User user = new User();
        user.setId(userId);
        user.setName("Sarah");
        user.setHouseholdId(householdId);

        ShoppingItem item = new ShoppingItem();
        item.setId(10L);
        item.setName("Lait");
        item.setHouseholdId(householdId);
        item.setPurchased(false);

        when(shoppingItemRepository.findById(10L)).thenReturn(Optional.of(item));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.findByHouseholdId(householdId)).thenReturn(List.of(user));

        Expense createdExpense = new Expense();
        createdExpense.setId(99L);
        when(expenseService.createExpense(any(Expense.class), eq(userId))).thenReturn(createdExpense);
        when(shoppingItemRepository.save(any(ShoppingItem.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ShoppingItem purchased = shoppingItemService.purchaseShoppingItem(10L, new BigDecimal("15.00"), userId);

        assertTrue(purchased.getPurchased());
        assertEquals(new BigDecimal("15.00"), purchased.getPurchasedPrice());
        assertEquals(userId, purchased.getPurchasedById());
        assertEquals(99L, purchased.getExpenseId());
    }

    @Test
    void cannotPurchaseAlreadyPurchasedItem() {
        Long householdId = 5L;
        Long userId = 1L;

        User user = new User();
        user.setId(userId);
        user.setHouseholdId(householdId);

        ShoppingItem item = new ShoppingItem();
        item.setId(10L);
        item.setHouseholdId(householdId);
        item.setPurchased(true);

        when(shoppingItemRepository.findById(10L)).thenReturn(Optional.of(item));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        assertThrows(IllegalStateException.class, () ->
                shoppingItemService.purchaseShoppingItem(10L, new BigDecimal("10.00"), userId));
    }
}
