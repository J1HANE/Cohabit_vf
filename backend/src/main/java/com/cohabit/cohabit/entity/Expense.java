package com.cohabit.cohabit.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.math.BigDecimal;

@Entity
@Table(name = "expenses")
public class Expense {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id")
    @JsonIgnore
    private Household household;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "payer_id")
    @JsonIgnore
    private User payer;

    @NotBlank(message = "Label is mandatory")
    private String label;

    private BigDecimal amount;

    @Column(name = "expense_date")
    private LocalDate expenseDate;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    private String emoji;

    @Column(name = "attachment_url")
    private String attachmentUrl;

    @OneToMany(mappedBy = "expense", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ExpenseShare> shares;

    public Expense() {}

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

    public User getPayer() { return payer; }
    public void setPayer(User payer) { this.payer = payer; }

    public Long getPayerId() {
        return payer != null ? payer.getId() : null;
    }
    public void setPayerId(Long payerId) {
        if (payerId != null) {
            User u = new User();
            u.setId(payerId);
            this.payer = u;
        } else {
            this.payer = null;
        }
    }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }

    public LocalDate getExpenseDate() { return expenseDate; }
    public void setExpenseDate(LocalDate expenseDate) { this.expenseDate = expenseDate; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public String getEmoji() { return emoji; }
    public void setEmoji(String emoji) { this.emoji = emoji; }

    public String getAttachmentUrl() { return attachmentUrl; }
    public void setAttachmentUrl(String attachmentUrl) { this.attachmentUrl = attachmentUrl; }

    public List<ExpenseShare> getShares() { return shares; }
    public void setShares(List<ExpenseShare> shares) { this.shares = shares; }
}
