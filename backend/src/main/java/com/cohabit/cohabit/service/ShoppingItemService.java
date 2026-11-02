package com.cohabit.cohabit.service;

import com.cohabit.cohabit.entity.ShoppingItem;
import com.cohabit.cohabit.repository.ShoppingItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.math.BigDecimal;

@Service
public class ShoppingItemService {

    private final ShoppingItemRepository shoppingItemRepository;
    private final ExpenseService expenseService;

    @Autowired
    public ShoppingItemService(ShoppingItemRepository shoppingItemRepository, ExpenseService expenseService) {
        this.shoppingItemRepository = shoppingItemRepository;
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
    public ShoppingItem createShoppingItem(ShoppingItem shoppingItem) {
        shoppingItem.setPurchased(false);
        return shoppingItemRepository.save(shoppingItem);
    }

    @Transactional
    public ShoppingItem updateShoppingItem(Long id, ShoppingItem shoppingItemDetails) {
        ShoppingItem shoppingItem = shoppingItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Shopping item not found with id " + id));

        if (shoppingItemDetails.getPurchased() != null
                && !shoppingItemDetails.getPurchased().equals(shoppingItem.getPurchased())) {
            throw new IllegalStateException("Use the purchase endpoint to record an item's purchase and price");
        }
        shoppingItem.setName(shoppingItemDetails.getName());

        return shoppingItemRepository.save(shoppingItem);
    }

    @Transactional
    public ShoppingItem purchaseShoppingItem(Long id, BigDecimal price, Long purchaserId) {
        if (price == null || price.signum() <= 0) {
            throw new IllegalArgumentException("Purchase price must be greater than zero");
        }
        if (purchaserId == null) {
            throw new IllegalArgumentException("Purchaser is required");
        }

        ShoppingItem item = shoppingItemRepository.findById(id)
                .orElseThrow(() -> new java.util.NoSuchElementException("Shopping item not found with id " + id));
        if (Boolean.TRUE.equals(item.getPurchased())) {
            throw new IllegalStateException("This shopping item has already been purchased");
        }

        var expense = expenseService.createShoppingExpense(item.getHouseholdId(), purchaserId, item.getName(), price);
        item.setPurchased(true);
        item.setPurchasePrice(expense.getAmount());
        item.setPurchaseExpenseId(expense.getId());
        return shoppingItemRepository.save(item);
    }

    @Transactional
    public void deleteShoppingItem(Long id) {
        shoppingItemRepository.deleteById(id);
    }
}
