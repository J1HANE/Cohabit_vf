package com.cohabit.cohabit.repository;

import com.cohabit.cohabit.entity.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface ComplaintRepository extends JpaRepository<Complaint, Long> {
    @Query("SELECT c FROM Complaint c JOIN FETCH c.user ORDER BY c.createdAt DESC")
    List<Complaint> findAllWithUser();

    @Query("SELECT c FROM Complaint c JOIN FETCH c.user WHERE c.user.id = :userId ORDER BY c.createdAt DESC")
    List<Complaint> findByUserIdWithUser(@Param("userId") Long userId);

    @Query("SELECT c FROM Complaint c JOIN FETCH c.user WHERE c.id = :id")
    Optional<Complaint> findWithUserById(@Param("id") Long id);

    long countByStatus(String status);

    long countByCreatedAtAfter(LocalDateTime date);
}