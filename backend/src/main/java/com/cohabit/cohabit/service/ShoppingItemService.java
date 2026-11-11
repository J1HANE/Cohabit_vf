package com.cohabit.cohabit.service;

import com.cohabit.cohabit.entity.ShoppingItem;
import com.cohabit.cohabit.entity.Expense;
import com.cohabit.cohabit.entity.ExpenseShare;
import com.cohabit.cohabit.entity.User;
import com.cohabit.cohabit.repository.ShoppingItemRepository;
import com.cohabit.cohabit.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;

@Service
public class ShoppingItemService {

    private final ShoppingItemRepository shoppingItemRepository;
    private final UserRepository userRepository;
    private final ExpenseService expenseService;

    @Autowired
    public ShoppingItemService(ShoppingItemRepository shoppingItemRepository, UserRepository userRepository,
                               ExpenseService expenseService) {
        this.shoppingItemRepository = shoppingItemRepository;
        this.userRepository = userRepository;
        this.expenseService = expenseService;
    }

    @Transactional(readOnly = true)
    public List<ShoppingItem> getAllShoppingItems() {
        return shoppingItemRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<ShoppingItem> getShoppingItemsByHousehold(Long householdId) {
        return shoppingItemRepository.findByHouseholdIdOrderByCreatedAtDesc(householdId);
    }

    @Transactional
    public ShoppingItem createShoppingItem(ShoppingItem shoppingItem, Long actorId) {
        requireMember(shoppingItem.getHouseholdId(), actorId);
        shoppingItem.setAddedBy(userRepository.findById(actorId).orElseThrow());
        shoppingItem.setPurchased(false);
        return shoppingItemRepository.save(shoppingItem);
    }

    @Transactional
    public ShoppingItem updateShoppingItem(Long id, ShoppingItem shoppingItemDetails, Long actorId) {
        ShoppingItem shoppingItem = shoppingItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Shopping item not found with id " + id));
        requireMember(shoppingItem.getHouseholdId(), actorId);
        if (Boolean.TRUE.equals(shoppingItemDetails.getPurchased()) && !Boolean.TRUE.equals(shoppingItem.getPurchased())) {
            throw new IllegalArgumentException("Provide a price using the purchase action");
        }

        shoppingItem.setName(shoppingItemDetails.getName());
        return shoppingItemRepository.save(shoppingItem);
    }

    @Transactional
    public ShoppingItem purchaseShoppingItem(Long id, BigDecimal price, Long actorId) {
        ShoppingItem item = shoppingItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Shopping item not found with id " + id));
        User purchaser = requireMember(item.getHouseholdId(), actorId);
        if (Boolean.TRUE.equals(item.getPurchased())) {
            throw new IllegalStateException("This item has already been purchased");
        }
        if (price == null || price.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("A positive purchase price is required");
        }

        BigDecimal normalizedPrice = price.setScale(2, RoundingMode.HALF_UP);
        List<User> members = userRepository.findByHouseholdId(item.getHouseholdId());
        Expense expense = new Expense();
        expense.setHouseholdId(item.getHouseholdId());
        expense.setPayerId(purchaser.getId());
        expense.setLabel("Achat : " + item.getName());
        expense.setCategory(Expense.Category.GROCERIES);
        expense.setAmount(normalizedPrice);
        expense.setExpenseDate(LocalDate.now());
        expense.setEmoji("🛒");

        BigDecimal baseShare = normalizedPrice.divide(BigDecimal.valueOf(members.size()), 2, RoundingMode.DOWN);
        int extraCents = normalizedPrice.subtract(baseShare.multiply(BigDecimal.valueOf(members.size())))
                .movePointRight(2).intValueExact();
        List<ExpenseShare> shares = new java.util.ArrayList<>();
        for (int index = 0; index < members.size(); index++) {
            ExpenseShare share = new ExpenseShare();
            share.setUserId(members.get(index).getId());
            share.setShareAmount(baseShare.add(index < extraCents ? new BigDecimal("0.01") : BigDecimal.ZERO));
            shares.add(share);
        }
        expense.setShares(shares);
        Expense savedExpense = expenseService.createExpense(expense, purchaser.getId());

        item.setPurchased(true);
        item.setPurchasedPrice(normalizedPrice);
        item.setPurchasedBy(purchaser);
        item.setExpense(savedExpense);
        return shoppingItemRepository.save(item);
    }

    @Transactional
    public void deleteShoppingItem(Long id, Long actorId) {
        ShoppingItem item = shoppingItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Shopping item not found with id " + id));
        requireMember(item.getHouseholdId(), actorId);
        shoppingItemRepository.delete(item);
    }

    private User requireMember(Long householdId, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));
        if (householdId == null || !householdId.equals(user.getHouseholdId())) {
            throw new SecurityException("User does not belong to this household");
        }
        return user;
    }
}
