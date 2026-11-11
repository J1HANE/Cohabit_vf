ALTER TABLE expenses
    ADD COLUMN category VARCHAR(24) NOT NULL DEFAULT 'UNCATEGORIZED';

UPDATE expenses e
JOIN shopping_items item ON item.expense_id = e.id
SET e.category = 'GROCERIES';
