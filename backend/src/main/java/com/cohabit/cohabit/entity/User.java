package com.cohabit.cohabit.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    private String email;

    @Column(name = "password_hash")
    private String passwordHash;

    private String color = "#4F46E5";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id")
    @JsonIgnore
    private Household household;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

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

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
