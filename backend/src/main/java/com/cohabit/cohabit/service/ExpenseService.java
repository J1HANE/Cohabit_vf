package com.cohabit.cohabit.service;

import com.cohabit.cohabit.entity.Expense;
import com.cohabit.cohabit.repository.ExpenseRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;

    @Autowired
    public ExpenseService(ExpenseRepository expenseRepository) {
        this.expenseRepository = expenseRepository;
    }

    @Transactional(readOnly = true)
    public List<Expense> getAllExpenses() {
        return expenseRepository.findAllWithShares();
    }

    @Transactional(readOnly = true)
    public List<Expense> getExpensesByHousehold(Long householdId) {
        return expenseRepository.findByHouseholdIdWithShares(householdId);
    }

    @Transactional(readOnly = true)
    public Optional<Expense> getExpenseById(Long id) {
        return expenseRepository.findByIdWithShares(id);
    }

    @Transactional
    public Expense createExpense(Expense expense) {
        if (expense.getShares() != null) {
            expense.getShares().forEach(share -> share.setExpense(expense));
        }
        return expenseRepository.save(expense);
    }

    @Transactional
    public Expense updateExpense(Long id, Expense expenseDetails) {
        return expenseRepository.findByIdWithShares(id).map(expense -> {
            expense.setHouseholdId(expenseDetails.getHouseholdId());
            expense.setPayerId(expenseDetails.getPayerId());
            expense.setLabel(expenseDetails.getLabel());
            expense.setAmount(expenseDetails.getAmount());
            expense.setExpenseDate(expenseDetails.getExpenseDate());
            expense.setEmoji(expenseDetails.getEmoji());
            
            if (expense.getShares() != null) {
                expense.getShares().clear();
                if (expenseDetails.getShares() != null) {
                    expenseDetails.getShares().forEach(share -> {
                        share.setExpense(expense);
                        expense.getShares().add(share);
                    });
                }
            } else if (expenseDetails.getShares() != null) {
                expenseDetails.getShares().forEach(share -> share.setExpense(expense));
                expense.setShares(expenseDetails.getShares());
            }

            return expenseRepository.save(expense);
        }).orElseThrow(() -> new RuntimeException("Expense not found with id " + id));
    }

    @Transactional
    public void deleteExpense(Long id) {
        expenseRepository.deleteById(id);
    }
}
