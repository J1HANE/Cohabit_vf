package com.cohabit.cohabit.repository;

import com.cohabit.cohabit.entity.Household;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface HouseholdRepository extends JpaRepository<Household, Long> {
    Optional<Household> findByInviteCode(String inviteCode);

    List<Household> findByNameContainingIgnoreCase(String name);

    long countBySuspendedTrue();

    long countByCreatedAtAfter(LocalDateTime date);
}
