package com.cohabit.cohabit.entity;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;
import java.math.BigDecimal;

@Entity
@Table(name = "expense_shares")
public class ExpenseShare {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "expense_id")
    @JsonIgnore
    private Expense expense;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    @JsonIgnore
    private User user;

    @Column(name = "share_amount")
    private BigDecimal shareAmount;

    @Column(name = "paid_amount")
    private BigDecimal paidAmount = BigDecimal.ZERO;

    public ExpenseShare() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Expense getExpense() { return expense; }
    public void setExpense(Expense expense) { this.expense = expense; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Long getUserId() {
        return user != null ? user.getId() : null;
    }
    public void setUserId(Long userId) {
        if (userId != null) {
            User u = new User();
            u.setId(userId);
            this.user = u;
        } else {
            this.user = null;
        }
    }

    public BigDecimal getShareAmount() { return shareAmount; }
    public void setShareAmount(BigDecimal shareAmount) { this.shareAmount = shareAmount; }

    public BigDecimal getPaidAmount() { return paidAmount; }
    public void setPaidAmount(BigDecimal paidAmount) { this.paidAmount = paidAmount; }
}

