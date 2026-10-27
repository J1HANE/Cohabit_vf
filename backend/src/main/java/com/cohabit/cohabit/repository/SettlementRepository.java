package com.cohabit.cohabit.repository;

import com.cohabit.cohabit.entity.Settlement;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SettlementRepository extends JpaRepository<Settlement, Long> {

    @Query("SELECT s FROM Settlement s WHERE s.household.id = :householdId ORDER BY s.settledAt DESC")
    List<Settlement> findByHouseholdIdOrderBySettledAtDesc(@Param("householdId") Long householdId);
}
