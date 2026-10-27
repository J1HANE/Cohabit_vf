# CoHabit - Entity Relationships

## Overview

The CoHabit application follows a **three-tier architecture**:
1. **Entity Layer** - JPA entities representing database tables
2. **Repository Layer** - Spring Data JPA interfaces for data access
3. **Service Layer** - Business logic layer
4. **Controller Layer** - REST API endpoints

---

## Entity Relationships Diagram

```
┌─────────────────┐
│   Household     │
│  (Central)      │
└────────┬────────┘
         │
         ├──────────────────┬──────────────────┐
         │                  │                  │
         ▼                  ▼                  ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│     User        │ │    Expense      │ │      Task       │
│   (Members)     │ │  (Spending)     │ │   (Chores)      │
└────────┬────────┘ └────────┬────────┘ └─────────────────┘
         │                  │
         │                  │
         └──────────┬───────┘
                    │
                    ▼
            ┌─────────────────┐
            │  ExpenseShare  │
            │  (Splitting)   │
            └─────────────────┘
```

---

## Detailed Relationships

### 1. Household ↔ User (One-to-Many)

**Relationship:** One Household has many Users, one User belongs to one Household (optional)

```java
// In Household entity
@OneToMany(mappedBy = "household")
private List<User> members = new ArrayList<>();

// In User entity
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "household_id")
private Household household;
```

**Database:**
- `users.household_id` → Foreign Key → `households.id`
- Constraint: `ON DELETE SET NULL` (user remains if household deleted)

**Business Logic:**
- A user can exist without a household
- Deleting a household sets all users' household to null
- Users can join/leave households

---

### 2. Household ↔ Expense (One-to-Many)

**Relationship:** One Household has many Expenses, one Expense belongs to one Household

```java
// In Household entity
@OneToMany(mappedBy = "household")
private List<Expense> expenses = new ArrayList<>();

// In Expense entity
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "household_id")
private Household household;
```

**Database:**
- `expenses.household_id` → Foreign Key → `households.id`
- Constraint: `ON DELETE CASCADE` (expenses deleted when household deleted)

**Business Logic:**
- All expenses are tied to a household
- Deleting a household deletes all its expenses
- Expenses are shared among household members

---

### 3. Household ↔ Task (One-to-Many)

**Relationship:** One Household has many Tasks, one Task belongs to one Household

```java
// In Household entity
@OneToMany(mappedBy = "household")
private List<Task> tasks = new ArrayList<>();

// In Task entity
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "household_id")
private Household household;
```

**Database:**
- `tasks.household_id` → Foreign Key → `households.id`
- Constraint: `ON DELETE CASCADE` (tasks deleted when household deleted)

**Business Logic:**
- All tasks are tied to a household
- Deleting a household deletes all its tasks
- Tasks can be rotated among members

---

### 4. User ↔ Expense (Many-to-Many via Payer)

**Relationship:** One User can pay many Expenses, one Expense is paid by one User

```java
// In Expense entity
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "payer_id")
private User payer;
```

**Database:**
- `expenses.payer_id` → Foreign Key → `users.id`
- Constraint: No cascade (user remains if expense deleted)

**Business Logic:**
- Tracks who paid for each expense
- Used for balance calculations
- A user can pay multiple expenses over time

---

### 5. Expense ↔ ExpenseShare (One-to-Many)

**Relationship:** One Expense has many ExpenseShares, one ExpenseShare belongs to one Expense

```java
// In Expense entity
@OneToMany(mappedBy = "expense", cascade = CascadeType.ALL, orphanRemoval = true)
private List<ExpenseShare> shares;

// In ExpenseShare entity
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "expense_id")
private Expense expense;
```

**Database:**
- `expense_shares.expense_id` → Foreign Key → `expenses.id`
- Constraint: `ON DELETE CASCADE` (shares deleted when expense deleted)
- Unique constraint: `(expense_id, user_id)` - one share per user per expense

**Business Logic:**
- Enables cost splitting among multiple users
- Each user has one share per expense
- Tracks how much each user owes (shareAmount)
- Tracks how much each user has paid (paidAmount)

---

### 6. User ↔ ExpenseShare (Many-to-Many via userId)

**Relationship:** One User can have many ExpenseShares, one ExpenseShare is for one User

```java
// In ExpenseShare entity
@Column(name = "user_id")
private Long userId;
```

**Database:**
- `expense_shares.user_id` → Foreign Key → `users.id`
- Constraint: `ON DELETE CASCADE` (shares deleted when user deleted)

**Business Logic:**
- Indicates which user owes the share
- Used to calculate balances
- Supports partial payments (paidAmount vs shareAmount)

---

### 7. User ↔ Task (Many-to-Many via Assigned User)

**Relationship:** One User can be assigned many Tasks, one Task is assigned to one User (optional)

```java
// In Task entity
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "assigned_user_id")
private User assignedUser;
```

**Database:**
- `tasks.assigned_user_id` → Foreign Key → `users.id`
- Constraint: `ON DELETE SET NULL` (task remains if user deleted)

**Business Logic:**
- Tasks can be assigned to specific users
- Tasks can be unassigned (null)
- Supports task rotation among members

---

## Cascade Operations Summary

| Entity | Relationship | On Delete | On Update |
|--------|--------------|-----------|-----------|
| Household → User | One-to-Many | SET NULL | CASCADE |
| Household → Expense | One-to-Many | CASCADE | CASCADE |
| Household → Task | One-to-Many | CASCADE | CASCADE |
| Expense → ExpenseShare | One-to-Many | CASCADE | CASCADE |
| ExpenseShare → User | Many-to-One | CASCADE | CASCADE |
| Task → User (assigned) | Many-to-One | SET NULL | CASCADE |

---

## Database Schema Relationships

```sql
-- Household - User relationship
CREATE TABLE households (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    invite_code VARCHAR(12) NOT NULL UNIQUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    color VARCHAR(7) NOT NULL DEFAULT '#4F46E5',
    household_id BIGINT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_household FOREIGN KEY (household_id)
        REFERENCES households(id) ON DELETE SET NULL
);

-- Household - Expense relationship
CREATE TABLE expenses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    household_id BIGINT NOT NULL,
    payer_id BIGINT NOT NULL,
    label VARCHAR(150) NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    expense_date DATE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    emoji VARCHAR(255),
    CONSTRAINT fk_expenses_household FOREIGN KEY (household_id)
        REFERENCES households(id) ON DELETE CASCADE,
    CONSTRAINT fk_expenses_payer FOREIGN KEY (payer_id)
        REFERENCES users(id)
);

-- Expense - ExpenseShare relationship
CREATE TABLE expense_shares (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    expense_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    share_amount DECIMAL(12, 2) NOT NULL,
    paid_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
    UNIQUE (expense_id, user_id),
    CONSTRAINT fk_shares_expense FOREIGN KEY (expense_id)
        REFERENCES expenses(id) ON DELETE CASCADE,
    CONSTRAINT fk_shares_user FOREIGN KEY (user_id)
        REFERENCES users(id)
);

-- Household - Task relationship
CREATE TABLE tasks (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    household_id BIGINT NOT NULL,
    name VARCHAR(150) NOT NULL,
    frequency_days INT NOT NULL,
    due_date DATE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    assigned_user_id BIGINT NULL,
    rotation_index INT NOT NULL DEFAULT 0,
    last_completed_at TIMESTAMP NULL,
    CONSTRAINT fk_tasks_household FOREIGN KEY (household_id)
        REFERENCES households(id) ON DELETE CASCADE,
    CONSTRAINT fk_tasks_user FOREIGN KEY (assigned_user_id)
        REFERENCES users(id) ON DELETE SET NULL
);
```

---

## Business Rules

### Household Management
1. A household must have a unique invite code
2. A user can belong to only one household at a time
3. Invite codes are 6-character alphanumeric strings
4. Deleting a household detaches all users (sets household to null)

### Expense Management
1. Every expense must belong to a household
2. Every expense must have a payer (user)
3. Expenses can be split among multiple users
4. Each user can have only one share per expense
5. Paid amount cannot exceed share amount
6. Deleting an expense deletes all its shares

### Task Management
1. Every task must belong to a household
2. Tasks can be assigned to a user or left unassigned
3. Tasks have a frequency (in days) for recurring tasks
4. Tasks have a status (pending/completed)
5. Tasks support rotation among household members

### User Management
1. Users must have a unique email
2. Users can exist without a household
3. Users can join a household via invite code
4. Users can leave a household (sets household to null)
5. Users have a color for UI identification

---

## Data Flow Example

### Creating an Expense
1. User submits expense via Frontend
2. ExpenseController receives POST /api/expenses
3. ExpenseService creates Expense entity
4. ExpenseService creates ExpenseShare entities for each user
5. ExpenseRepository saves to database
6. Response returned to Frontend

### Task Rotation
1. Task has rotationIndex
2. When task is completed, increment rotationIndex
3. Assign next user based on: `members[rotationIndex % members.size()]`
4. Update task in database
5. Frontend displays newly assigned user

### Balance Calculation
1. For each user, sum all paid amounts (where user = payer)
2. For each user, sum all owed amounts (from expense_shares)
3. Balance = paid - owed
4. Positive balance = user is owed money
5. Negative balance = user owes money
