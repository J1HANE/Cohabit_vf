package com.cohabit.cohabit.repository;

import com.cohabit.cohabit.entity.ShoppingItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ShoppingItemRepository extends JpaRepository<ShoppingItem, Long> {

    @Query("SELECT s FROM ShoppingItem s WHERE s.household.id = :householdId ORDER BY s.createdAt DESC")
    List<ShoppingItem> findByHouseholdIdOrderByCreatedAtDesc(@Param("householdId") Long householdId);
}
