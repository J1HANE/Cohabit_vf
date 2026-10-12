package com.cohabit.cohabit.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id")
    @JsonIgnore
    private Household household;

    @NotBlank(message = "Name is mandatory")
    @Size(max = 100)
    private String name;

    @Column(name = "frequency_days")
    private Integer frequencyDays;

    @Column(name = "due_date")
    private LocalDate dueDate;

    private String status;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "assigned_user_id")
    @JsonIgnore
    private User assignedUser;

    @Column(name = "rotation_index")
    private Integer rotationIndex;

    @Column(name = "last_completed_at")
    private LocalDateTime lastCompletedAt;

    public Task() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Household getHousehold() { return household; }
    public void setHousehold(Household household) { this.household = household; }

    public Long getHouseholdId() {
        return household != null ? household.getId() : null;
    }
    public void setHouseholdId(Long householdId) {
        if (householdId != null) {
            Household h = new Household();
            h.setId(householdId);
            this.household = h;
        } else {
            this.household = null;
        }
    }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getFrequencyDays() { return frequencyDays; }
    public void setFrequencyDays(Integer frequencyDays) { this.frequencyDays = frequencyDays; }

    public LocalDate getDueDate() { return dueDate; }
    public void setDueDate(LocalDate dueDate) { this.dueDate = dueDate; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public User getAssignedUser() { return assignedUser; }
    public void setAssignedUser(User assignedUser) { this.assignedUser = assignedUser; }

    public Long getAssignedUserId() {
        return assignedUser != null ? assignedUser.getId() : null;
    }
    public void setAssignedUserId(Long assignedUserId) {
        if (assignedUserId != null) {
            User u = new User();
            u.setId(assignedUserId);
            this.assignedUser = u;
        } else {
            this.assignedUser = null;
        }
    }

    public Integer getRotationIndex() { return rotationIndex; }
    public void setRotationIndex(Integer rotationIndex) { this.rotationIndex = rotationIndex; }

    public LocalDateTime getLastCompletedAt() { return lastCompletedAt; }
    public void setLastCompletedAt(LocalDateTime lastCompletedAt) { this.lastCompletedAt = lastCompletedAt; }
}
