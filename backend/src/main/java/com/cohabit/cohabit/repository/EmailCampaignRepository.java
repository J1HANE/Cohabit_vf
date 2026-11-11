package com.cohabit.cohabit.repository;

import com.cohabit.cohabit.entity.EmailCampaign;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface EmailCampaignRepository extends JpaRepository<EmailCampaign, Long> {

    @Query("SELECT e FROM EmailCampaign e ORDER BY e.createdAt DESC")
    List<EmailCampaign> findAllOrderByCreatedAtDesc();

    @Query("SELECT e FROM EmailCampaign e WHERE e.status = :status ORDER BY e.createdAt DESC")
    List<EmailCampaign> findByStatusOrderByCreatedAtDesc(@Param("status") String status);

    @Query("SELECT e.id FROM EmailCampaign e WHERE e.status = 'SCHEDULED' AND e.scheduledAt <= :now ORDER BY e.scheduledAt")
    List<Long> findDueCampaignIds(@Param("now") LocalDateTime now);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT e FROM EmailCampaign e WHERE e.id = :id")
    Optional<EmailCampaign> findByIdForUpdate(@Param("id") Long id);
}
