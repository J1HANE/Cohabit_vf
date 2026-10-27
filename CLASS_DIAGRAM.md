# CoHabit Class Diagram

## Entity Layer

```mermaid
classDiagram
    class User {
        -Long id
        -String name
        -String email
        -String passwordHash
        -String color
        -Household household
        -LocalDateTime createdAt
        +getters and setters
    }

    class Household {
        -Long id
        -String name
        -String inviteCode
        -LocalDateTime createdAt
        -List~User~ members
        -List~Expense~ expenses
        -List~Task~ tasks
        +getters and setters
    }

    class Expense {
        -Long id
        -Household household
        -User payer
        -String label
        -BigDecimal amount
        -LocalDate expenseDate
        -LocalDateTime createdAt
        -String emoji
        -List~ExpenseShare~ shares
        +getters and setters
    }

    class ExpenseShare {
        -Long id
        -Expense expense
        -Long userId
        -BigDecimal shareAmount
        -BigDecimal paidAmount
        +getters and setters
    }

    class Task {
        -Long id
        -Household household
        -String name
        -Integer frequencyDays
        -LocalDate dueDate
        -String status
        -User assignedUser
        -Integer rotationIndex
        -LocalDateTime lastCompletedAt
        +getters and setters
    }

    Household "1" --> "0..*" User : has
    User "0..1" --> "1" Household : belongs to
    Household "1" --> "0..*" Expense : has
    Expense "0..*" --> "1" Household : belongs to
    User "0..*" --> "0..*" Expense : pays
    Expense "1" --> "0..*" ExpenseShare : has
    ExpenseShare "0..*" --> "1" Expense : belongs to
    Household "1" --> "0..*" Task : has
    Task "0..*" --> "1" Household : belongs to
    User "0..*" --> "0..*" Task : assigned to
```

## Repository Layer

```mermaid
classDiagram
    class UserRepository {
        <<interface>>
        +Optional~User~ findByEmail(String email)
        +List~User~ findByHouseholdId(Long householdId)
    }

    class HouseholdRepository {
        <<interface>>
        +Optional~Household~ findByInviteCode(String inviteCode)
    }

    class ExpenseRepository {
        <<interface>>
        +List~Expense~ findAllWithShares()
        +List~Expense~ findByHouseholdIdWithShares(Long householdId)
        +Optional~Expense~ findByIdWithShares(Long id)
    }

    class TaskRepository {
        <<interface>>
        +List~Task~ findByHouseholdId(Long householdId)
    }

    UserRepository ..|> User : manages
    HouseholdRepository ..|> Household : manages
    ExpenseRepository ..|> Expense : manages
    TaskRepository ..|> Task : manages
```

## Service Layer

```mermaid
classDiagram
    class HouseholdService {
        -HouseholdRepository householdRepository
        -UserRepository userRepository
        +List~Household~ getAllHouseholds()
        +Optional~Household~ getHouseholdById(Long id)
        +List~User~ getHouseholdMembers(Long householdId)
        +Household createHousehold(String name, Long userId)
        +Household updateHousehold(Long id, String name)
        +void deleteHousehold(Long id)
        +Household joinHousehold(String inviteCode, Long userId)
        +void leaveHousehold(Long userId)
        +Household regenerateInviteCode(Long householdId)
    }

    class ExpenseService {
        -ExpenseRepository expenseRepository
        -EntityManager entityManager
        +List~Expense~ getAllExpenses()
        +List~Expense~ getExpensesByHousehold(Long householdId)
        +Optional~Expense~ getExpenseById(Long id)
        +Expense createExpense(Expense expense)
        +Expense settleExpenseShare(Long expenseId, Long userId, BigDecimal amount)
        +Expense updateExpense(Long id, Expense expenseDetails)
        +void deleteExpense(Long id)
    }

    class TaskService {
        -TaskRepository taskRepository
        +List~Task~ getAllTasks()
        +Optional~Task~ getTaskById(Long id)
        +Task createTask(Task task)
        +Task updateTask(Long id, Task taskDetails)
        +void deleteTask(Long id)
    }

    HouseholdService --> HouseholdRepository : uses
    HouseholdService --> UserRepository : uses
    ExpenseService --> ExpenseRepository : uses
    TaskService --> TaskRepository : uses
```

## Controller Layer

```mermaid
classDiagram
    class AuthController {
        -UserRepository userRepository
        -PasswordEncoder passwordEncoder
        +ResponseEntity~?~ register(Map~String, String~ payload)
        +ResponseEntity~?~ login(Map~String, String~ payload)
    }

    class HouseholdController {
        -HouseholdService householdService
        +List~Map~String, Object~~ getAllHouseholds()
        +ResponseEntity~?~ getHousehold(Long householdId)
        +List~Map~String, Object~~ getMembers(Long householdId)
        +ResponseEntity~?~ createHousehold(Map~String, Object~ payload)
        +ResponseEntity~?~ updateHousehold(Long householdId, Map~String, Object~ payload)
        +ResponseEntity~?~ deleteHousehold(Long householdId)
        +ResponseEntity~?~ joinHousehold(Map~String, Object~ payload)
        +ResponseEntity~?~ leaveHousehold(Map~String, Object~ payload)
        +ResponseEntity~?~ regenerateInviteCode(Long householdId, Map~String, Object~ payload)
    }

    class ExpenseController {
        -ExpenseService expenseService
        +List~Expense~ getAllExpenses()
        +List~Expense~ getExpensesByHousehold(Long householdId)
        +ResponseEntity~Expense~ getExpenseById(Long id)
        +Expense createExpense(@Valid Expense expense)
        +ResponseEntity~?~ updateExpense(Long id, @Valid Expense expense)
        +ResponseEntity~?~ settleExpense(Long id, Map~String, Object~ payload)
        +ResponseEntity~Void~ deleteExpense(Long id)
    }

    class TaskController {
        -TaskService taskService
        +List~Task~ getAllTasks()
        +ResponseEntity~Task~ getTaskById(Long id)
        +Task createTask(@Valid Task task)
        +ResponseEntity~Task~ updateTask(Long id, @Valid Task task)
        +ResponseEntity~Void~ deleteTask(Long id)
    }

    AuthController --> UserRepository : uses
    HouseholdController --> HouseholdService : uses
    ExpenseController --> ExpenseService : uses
    TaskController --> TaskService : uses
```

## Complete Architecture Overview

```mermaid
classDiagram
    %% Entity Layer
    class User {
        -Long id
        -String name
        -String email
        -String passwordHash
        -String color
        -Household household
        -LocalDateTime createdAt
    }

    class Household {
        -Long id
        -String name
        -String inviteCode
        -LocalDateTime createdAt
        -List~User~ members
        -List~Expense~ expenses
        -List~Task~ tasks
    }

    class Expense {
        -Long id
        -Household household
        -User payer
        -String label
        -BigDecimal amount
        -LocalDate expenseDate
        -LocalDateTime createdAt
        -String emoji
        -List~ExpenseShare~ shares
    }

    class ExpenseShare {
        -Long id
        -Expense expense
        -Long userId
        -BigDecimal shareAmount
        -BigDecimal paidAmount
    }

    class Task {
        -Long id
        -Household household
        -String name
        -Integer frequencyDays
        -LocalDate dueDate
        -String status
        -User assignedUser
        -Integer rotationIndex
        -LocalDateTime lastCompletedAt
    }

    %% Repository Layer
    class UserRepository {
        <<interface>>
        +findByEmail()
        +findByHouseholdId()
    }

    class HouseholdRepository {
        <<interface>>
        +findByInviteCode()
    }

    class ExpenseRepository {
        <<interface>>
        +findAllWithShares()
        +findByHouseholdIdWithShares()
        +findByIdWithShares()
    }

    class TaskRepository {
        <<interface>>
        +findByHouseholdId()
    }

    %% Service Layer
    class HouseholdService {
        +getAllHouseholds()
        +getHouseholdById()
        +getHouseholdMembers()
        +createHousehold()
        +updateHousehold()
        +deleteHousehold()
        +joinHousehold()
        +leaveHousehold()
        +regenerateInviteCode()
    }

    class ExpenseService {
        +getAllExpenses()
        +getExpensesByHousehold()
        +getExpenseById()
        +createExpense()
        +settleExpenseShare()
        +updateExpense()
        +deleteExpense()
    }

    class TaskService {
        +getAllTasks()
        +getTaskById()
        +createTask()
        +updateTask()
        +deleteTask()
    }

    %% Controller Layer
    class AuthController {
        +register()
        +login()
    }

    class HouseholdController {
        +getAllHouseholds()
        +getHousehold()
        +getMembers()
        +createHousehold()
        +updateHousehold()
        +deleteHousehold()
        +joinHousehold()
        +leaveHousehold()
        +regenerateInviteCode()
    }

    class ExpenseController {
        +getAllExpenses()
        +getExpensesByHousehold()
        +getExpenseById()
        +createExpense()
        +updateExpense()
        +settleExpense()
        +deleteExpense()
    }

    class TaskController {
        +getAllTasks()
        +getTaskById()
        +createTask()
        +updateTask()
        +deleteTask()
    }

    %% Relationships
    Household "1" --> "0..*" User : has
    Household "1" --> "0..*" Expense : has
    Household "1" --> "0..*" Task : has
    User "0..*" --> "0..*" Expense : pays
    User "0..*" --> "0..*" Task : assigned to
    Expense "1" --> "0..*" ExpenseShare : has

    %% Layer dependencies
    UserRepository ..|> User
    HouseholdRepository ..|> Household
    ExpenseRepository ..|> Expense
    TaskRepository ..|> Task

    HouseholdService --> HouseholdRepository
    HouseholdService --> UserRepository
    ExpenseService --> ExpenseRepository
    TaskService --> TaskRepository

    AuthController --> UserRepository
    HouseholdController --> HouseholdService
    ExpenseController --> ExpenseService
    TaskController --> TaskService
```

## Entity Relationships Summary

### Household (Foyer)
- **Has many** Users (members)
- **Has many** Expenses
- **Has many** Tasks
- **Has unique** inviteCode

### User (Utilisateur)
- **Belongs to** one Household (optional)
- **Pays** many Expenses
- **Assigned to** many Tasks
- **Has unique** email

### Expense (Dépense)
- **Belongs to** one Household
- **Paid by** one User
- **Has many** ExpenseShares (for splitting)

### ExpenseShare (Part de dépense)
- **Belongs to** one Expense
- **For** one User
- **Has** shareAmount and paidAmount

### Task (Tâche)
- **Belongs to** one Household
- **Assigned to** one User (optional)
- **Has** frequency, dueDate, status

## REST API Endpoints Mapping

| Controller | HTTP Method | Endpoint | CRUD Operation |
|-----------|-------------|----------|----------------|
| AuthController | POST | /api/auth/register | Create User |
| AuthController | POST | /api/auth/login | Read/Authenticate |
| HouseholdController | GET | /api/households | Read All |
| HouseholdController | GET | /api/households/{id} | Read One |
| HouseholdController | POST | /api/households | Create |
| HouseholdController | PUT | /api/households/{id} | Update |
| HouseholdController | DELETE | /api/households/{id} | Delete |
| ExpenseController | GET | /api/expenses | Read All |
| ExpenseController | GET | /api/expenses/{id} | Read One |
| ExpenseController | POST | /api/expenses | Create |
| ExpenseController | PUT | /api/expenses/{id} | Update |
| ExpenseController | DELETE | /api/expenses/{id} | Delete |
| TaskController | GET | /api/tasks | Read All |
| TaskController | GET | /api/tasks/{id} | Read One |
| TaskController | POST | /api/tasks | Create |
| TaskController | PUT | /api/tasks/{id} | Update |
| TaskController | DELETE | /api/tasks/{id} | Delete |

## Data Types Used

- **Long**: IDs (Primary keys)
- **String**: Names, emails, passwords, codes, labels
- **BigDecimal**: Monetary amounts (12,2 precision)
- **LocalDate**: Dates (no time)
- **LocalDateTime**: Timestamps
- **Integer**: Numeric values (frequency, rotation index)
- **List<T>**: Collections (One-to-Many relationships)
- **Optional<T>**: Nullable return types
