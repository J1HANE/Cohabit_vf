CREATE TABLE households (
                            id          BIGINT AUTO_INCREMENT PRIMARY KEY,
                            name        VARCHAR(100) NOT NULL,
                            invite_code VARCHAR(12)  NOT NULL UNIQUE,
                            created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE users (
                       id            BIGINT AUTO_INCREMENT PRIMARY KEY,
                       name          VARCHAR(100) NOT NULL,
                       email         VARCHAR(150) NOT NULL UNIQUE,
                       password_hash VARCHAR(255) NOT NULL,
                       color         VARCHAR(7)   NOT NULL DEFAULT '#4F46E5',
                       household_id  BIGINT NULL,
                       created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
                       CONSTRAINT fk_users_household FOREIGN KEY (household_id)
                           REFERENCES households(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE expenses (
                          id           BIGINT AUTO_INCREMENT PRIMARY KEY,
                          household_id BIGINT         NOT NULL,
                          payer_id     BIGINT         NOT NULL,
                          label        VARCHAR(150)   NOT NULL,
                          amount       DECIMAL(12, 2) NOT NULL,
                          expense_date DATE           NOT NULL,
                          created_at   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
                          emoji        VARCHAR(255)   CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
                          CONSTRAINT chk_expense_amount CHECK (amount > 0),
                          CONSTRAINT fk_expenses_household FOREIGN KEY (household_id)
                              REFERENCES households(id) ON DELETE CASCADE,
                          CONSTRAINT fk_expenses_payer FOREIGN KEY (payer_id)
                              REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- One row per beneficiary: what each person owes for this expense
CREATE TABLE expense_shares (
                                id           BIGINT AUTO_INCREMENT PRIMARY KEY,
                                expense_id   BIGINT         NOT NULL,
                                user_id      BIGINT         NOT NULL,
                                share_amount DECIMAL(12, 2) NOT NULL,
                                UNIQUE (expense_id, user_id),
                                CONSTRAINT chk_share_amount CHECK (share_amount >= 0),
                                CONSTRAINT fk_shares_expense FOREIGN KEY (expense_id)
                                    REFERENCES expenses(id) ON DELETE CASCADE,
                                CONSTRAINT fk_shares_user FOREIGN KEY (user_id)
                                    REFERENCES users(id)
) ENGINE=InnoDB;

-- "Debt marked as settled": a recorded payment that offsets balances
CREATE TABLE settlements (
                             id           BIGINT AUTO_INCREMENT PRIMARY KEY,
                             household_id BIGINT         NOT NULL,
                             from_user_id BIGINT         NOT NULL,
                             to_user_id   BIGINT         NOT NULL,
                             amount       DECIMAL(12, 2) NOT NULL,
                             settled_at   TIMESTAMP      NOT NULL DEFAULT CURRENT_TIMESTAMP,
                             CONSTRAINT chk_settlement_amount CHECK (amount > 0),
                             CONSTRAINT chk_settlement_users CHECK (from_user_id <> to_user_id),
                             CONSTRAINT fk_settle_household FOREIGN KEY (household_id)
                                 REFERENCES households(id) ON DELETE CASCADE,
                             CONSTRAINT fk_settle_from FOREIGN KEY (from_user_id) REFERENCES users(id),
                             CONSTRAINT fk_settle_to FOREIGN KEY (to_user_id) REFERENCES users(id)
) ENGINE=InnoDB;

CREATE TABLE tasks (
                       id                BIGINT AUTO_INCREMENT PRIMARY KEY,
                       household_id      BIGINT       NOT NULL,
                       name              VARCHAR(150) NOT NULL,
                       frequency_days    INT          NOT NULL,
                       due_date          DATE         NOT NULL,
                       status            VARCHAR(20)  NOT NULL DEFAULT 'PENDING',
                       assigned_user_id  BIGINT NULL,
                       rotation_index    INT          NOT NULL DEFAULT 0,
                       last_completed_at TIMESTAMP NULL,
                       CONSTRAINT chk_task_frequency CHECK (frequency_days > 0),
                       CONSTRAINT fk_tasks_household FOREIGN KEY (household_id)
                           REFERENCES households(id) ON DELETE CASCADE,
                       CONSTRAINT fk_tasks_user FOREIGN KEY (assigned_user_id)
                           REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE shopping_items (
                                id           BIGINT AUTO_INCREMENT PRIMARY KEY,
                                household_id BIGINT       NOT NULL,
                                name         VARCHAR(150) NOT NULL,
                                purchased    BOOLEAN      NOT NULL DEFAULT FALSE,
                                added_by     BIGINT NULL,
                                created_at   TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                CONSTRAINT fk_shopping_household FOREIGN KEY (household_id)
                                    REFERENCES households(id) ON DELETE CASCADE,
                                CONSTRAINT fk_shopping_user FOREIGN KEY (added_by)
                                    REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;