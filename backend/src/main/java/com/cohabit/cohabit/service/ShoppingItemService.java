package com.cohabit.cohabit.service;

import com.cohabit.cohabit.entity.ShoppingItem;
import com.cohabit.cohabit.repository.ShoppingItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ShoppingItemService {

    private final ShoppingItemRepository shoppingItemRepository;

    @Autowired
    public ShoppingItemService(ShoppingItemRepository shoppingItemRepository) {
        this.shoppingItemRepository = shoppingItemRepository;
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
        return shoppingItemRepository.save(shoppingItem);
    }

    @Transactional
    public ShoppingItem updateShoppingItem(Long id, ShoppingItem shoppingItemDetails) {
        ShoppingItem shoppingItem = shoppingItemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Shopping item not found with id " + id));

        shoppingItem.setName(shoppingItemDetails.getName());
        shoppingItem.setPurchased(shoppingItemDetails.getPurchased());

        return shoppingItemRepository.save(shoppingItem);
    }

    @Transactional
    public void deleteShoppingItem(Long id) {
        shoppingItemRepository.deleteById(id);
    }
}
