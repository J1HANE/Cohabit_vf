package com.cohabit.cohabit.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "tasks")
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "household_id")
    private Long householdId;

    @NotBlank(message = "Name is mandatory")
    @Size(max = 100)
    private String name;

    @Column(name = "frequency_days")
    private Integer frequencyDays;

    @Column(name = "due_date")
    private LocalDate dueDate;

    private String status;

    @Column(name = "assigned_user_id")
    private Long assignedUserId;

    @Column(name = "rotation_index")
    private Integer rotationIndex;

    @Column(name = "last_completed_at")
    private LocalDateTime lastCompletedAt;

    public Task() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getHouseholdId() { return householdId; }
    public void setHouseholdId(Long householdId) { this.householdId = householdId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getFrequencyDays() { return frequencyDays; }
    public void setFrequencyDays(Integer frequencyDays) { this.frequencyDays = frequencyDays; }

    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Long getAssignedUserId() { return assignedUserId; }
    public void setAssignedUserId(Long assignedUserId) { this.assignedUserId = assignedUserId; }

    public Integer getRotationIndex() { return rotationIndex; }
    public void setRotationIndex(Integer rotationIndex) { this.rotationIndex = rotationIndex; }

    public LocalDateTime getLastCompletedAt() { return lastCompletedAt; }
    public void setLastCompletedAt(LocalDateTime lastCompletedAt) { this.lastCompletedAt = lastCompletedAt; }
}
