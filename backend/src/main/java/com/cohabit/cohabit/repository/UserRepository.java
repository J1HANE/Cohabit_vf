package com.cohabit.cohabit.repository;

import com.cohabit.cohabit.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    
    @Query("SELECT u FROM User u WHERE u.household.id = :householdId")
    List<User> findByHouseholdId(@Param("householdId") Long householdId);
}
