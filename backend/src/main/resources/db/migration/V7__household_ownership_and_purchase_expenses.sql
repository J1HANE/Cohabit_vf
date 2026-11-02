ALTER TABLE households ADD COLUMN administrator_id BIGINT NULL;
UPDATE households h
SET administrator_id = (SELECT MIN(u.id) FROM users u WHERE u.household_id = h.id);
ALTER TABLE households
    ADD CONSTRAINT fk_households_administrator FOREIGN KEY (administrator_id)
        REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE expenses ADD COLUMN created_by BIGINT NULL;
UPDATE expenses SET created_by = payer_id;
ALTER TABLE expenses MODIFY COLUMN created_by BIGINT NOT NULL;
ALTER TABLE expenses
    ADD CONSTRAINT fk_expenses_creator FOREIGN KEY (created_by)
        REFERENCES users(id) ON DELETE RESTRICT;

ALTER TABLE shopping_items ADD COLUMN purchased_price DECIMAL(12, 2) NULL;
ALTER TABLE shopping_items ADD COLUMN purchased_by BIGINT NULL;
ALTER TABLE shopping_items ADD COLUMN expense_id BIGINT NULL;
ALTER TABLE shopping_items
    ADD CONSTRAINT fk_shopping_purchaser FOREIGN KEY (purchased_by)
        REFERENCES users(id) ON DELETE SET NULL,
    ADD CONSTRAINT fk_shopping_expense FOREIGN KEY (expense_id)
        REFERENCES expenses(id) ON DELETE SET NULL;

ALTER TABLE complaints ADD COLUMN reported_user_id BIGINT NULL;
ALTER TABLE complaints
    ADD CONSTRAINT fk_complaints_reported_user FOREIGN KEY (reported_user_id)
        REFERENCES users(id) ON DELETE SET NULL;