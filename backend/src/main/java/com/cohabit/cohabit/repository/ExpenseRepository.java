package com.cohabit.cohabit.repository;

import com.cohabit.cohabit.entity.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {

    @Query("SELECT DISTINCT e FROM Expense e LEFT JOIN FETCH e.shares")
    List<Expense> findAllWithShares();

    @Query("SELECT DISTINCT e FROM Expense e LEFT JOIN FETCH e.shares WHERE e.householdId = :householdId")
    List<Expense> findByHouseholdIdWithShares(@Param("householdId") Long householdId);

    @Query("SELECT e FROM Expense e LEFT JOIN FETCH e.shares WHERE e.id = :id")
    Optional<Expense> findByIdWithShares(@Param("id") Long id);
}
