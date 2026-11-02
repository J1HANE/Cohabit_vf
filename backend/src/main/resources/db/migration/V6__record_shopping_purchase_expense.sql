ALTER TABLE shopping_items
    ADD COLUMN purchase_price DECIMAL(12, 2) NULL,
    ADD COLUMN purchase_expense_id BIGINT NULL,
    ADD CONSTRAINT fk_shopping_purchase_expense
        FOREIGN KEY (purchase_expense_id) REFERENCES expenses(id) ON DELETE SET NULL;
