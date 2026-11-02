package com.cohabit.cohabit.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.math.BigDecimal;

@Entity
@Table(name = "shopping_items")
public class ShoppingItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id")
    @JsonIgnore
    private Household household;

    @Size(max = 140)
    private String name;

    private Boolean purchased;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "added_by")
    @JsonIgnore
    private User addedBy;

    @Column(name = "purchased_price")
    private BigDecimal purchasedPrice;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "purchased_by")
    @JsonIgnore
    private User purchasedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expense_id")
    @JsonIgnore
    private Expense expense;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    public ShoppingItem() {}

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

    public Boolean getPurchased() { return purchased; }
    public void setPurchased(Boolean purchased) { this.purchased = purchased; }

    public User getAddedBy() { return addedBy; }
    public void setAddedBy(User addedBy) { this.addedBy = addedBy; }

    public Long getAddedById() {
        return addedBy != null ? addedBy.getId() : null;
    }
    public void setAddedById(Long addedById) {
        if (addedById != null) {
            User u = new User();
            u.setId(addedById);
            this.addedBy = u;
        } else {
            this.addedBy = null;
        }
    }

    public BigDecimal getPurchasedPrice() { return purchasedPrice; }
    public void setPurchasedPrice(BigDecimal purchasedPrice) { this.purchasedPrice = purchasedPrice; }
    public User getPurchasedBy() { return purchasedBy; }
    public void setPurchasedBy(User purchasedBy) { this.purchasedBy = purchasedBy; }
    public Long getPurchasedById() { return purchasedBy != null ? purchasedBy.getId() : null; }
    public Expense getExpense() { return expense; }
    public void setExpense(Expense expense) { this.expense = expense; }
    public Long getExpenseId() { return expense != null ? expense.getId() : null; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
