ALTER TABLE expense_shares ADD COLUMN paid_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00;

-- Existing payer shares should be marked as paid
UPDATE expense_shares es
JOIN expenses e ON es.expense_id = e.id
SET es.paid_amount = es.share_amount
WHERE es.user_id = e.payer_id;
