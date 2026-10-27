# CoHabit - Architecture Overview & Flow

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                          │
│                    React + Vite (Port 5173)                     │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Pages      │  │  Components  │  │   Services   │          │
│  │              │  │              │  │              │          │
│  │ - Expenses   │  │ - Forms      │  │ - API calls  │          │
│  │ - Tasks      │  │ - Cards      │  │ - Data       │          │
│  │ - Dashboard  │  │ - Lists      │  │   mapping    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
│  ┌──────────────────────────────────────────────┐              │
│  │            Context API (State)                │              │
│  │  ┌──────────────┐  ┌──────────────┐         │              │
│  │  │ AuthContext   │  │HouseholdCtx  │         │              │
│  │  │ (User, login) │  │ (Members)    │         │              │
│  │  └──────────────┘  └──────────────┘         │              │
│  └──────────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/JSON
                              │ fetch() API
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BACKEND LAYER                               │
│                Spring Boot (Port 8081)                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ Controllers  │  │   Services   │  │ Repositories │          │
│  │              │  │              │  │              │          │
│  │ - REST       │  │ - Business   │  │ - Data       │          │
│  │   Endpoints  │  │   Logic      │  │   Access     │          │
│  │ - Validation  │  │ - Processing │  │ - Queries    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│                                                                   │
│  ┌──────────────────────────────────────────────┐              │
│  │           JPA / Hibernate (ORM)               │              │
│  │  Entity ↔ Table Mapping                      │              │
│  └──────────────────────────────────────────────┘              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ JDBC
                              │ MySQL Driver
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DATABASE LAYER                                 │
│                  MySQL (Port 8889)                               │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  households  │  │    users     │  │  expenses    │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │expense_shares│  │    tasks     │  │ settlements  │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagram

```
┌─────────┐
│  USER   │
└────┬────┘
     │
     │ Action (click, submit, etc.)
     ▼
┌─────────────────────────────────┐
│     REACT COMPONENT              │
│  ┌───────────────────────────┐  │
│  │  1. User interacts        │  │
│  │  2. Validate input        │  │
│  │  3. Call service          │  │
│  └───────────────────────────┘  │
└────────────┬────────────────────┘
             │
             │ Service call
             ▼
┌─────────────────────────────────┐
│     SERVICE LAYER (JS)          │
│  ┌───────────────────────────┐  │
│  │  1. Prepare data          │  │
│  │  2. Make fetch() request  │  │
│  │  3. Handle response       │  │
│  └───────────────────────────┘  │
└────────────┬────────────────────┘
             │
             │ HTTP Request (JSON)
             │ POST / GET / PUT / DELETE
             ▼
┌─────────────────────────────────┐
│   SPRING BOOT CONTROLLER        │
│  ┌───────────────────────────┐  │
│  │  1. Receive HTTP request  │  │
│  │  2. @Valid validation      │  │
│  │  3. Call service layer    │  │
│  └───────────────────────────┘  │
└────────────┬────────────────────┘
             │
             │ Business logic call
             ▼
┌─────────────────────────────────┐
│     SERVICE LAYER (Java)        │
│  ┌───────────────────────────┐  │
│  │  1. Process business      │  │
│  │  2. Call repository       │  │
│  │  3. Return result         │  │
│  └───────────────────────────┘  │
└────────────┬────────────────────┘
             │
             │ Data access
             ▼
┌─────────────────────────────────┐
│     REPOSITORY LAYER            │
│  ┌───────────────────────────┐  │
│  │  1. JPA repository call   │  │
│  │  2. Query execution       │  │
│  │  3. Entity mapping        │  │
│  └───────────────────────────┘  │
└────────────┬────────────────────┘
             │
             │ SQL via JDBC
             ▼
┌─────────────────────────────────┐
│         DATABASE (MySQL)         │
│  ┌───────────────────────────┐  │
│  │  1. Execute SQL query     │  │
│  │  2. Return result set     │  │
│  │  3. Update tables          │  │
│  └───────────────────────────┘  │
└────────────┬────────────────────┘
             │
             │ Result (reverse flow)
             ▼
┌─────────────────────────────────┐
│     ENTITY MAPPING              │
│  ┌───────────────────────────┐  │
│  │  1. Map to Java entities   │  │
│  │  2. Apply relationships    │  │
│  │  3. Return to service      │  │
│  └───────────────────────────┘  │
└────────────┬────────────────────┘
             │
             │ Processed result
             ▼
┌─────────────────────────────────┐
│     HTTP RESPONSE               │
│  ┌───────────────────────────┐  │
│  │  1. Convert to JSON       │  │
│  │  2. Set status code       │  │
│  │  3. Send response         │  │
│  └───────────────────────────┘  │
└────────────┬────────────────────┘
             │
             │ JSON Response
             ▼
┌─────────────────────────────────┐
│     FRONTEND RECEIVE            │
│  ┌───────────────────────────┐  │
│  │  1. Parse JSON            │  │
│  │  2. Update state          │  │
│  │  3. Re-render UI          │  │
│  └───────────────────────────┘  │
└────────────┬────────────────────┘
             │
             │ UI Update
             ▼
┌─────────┐
│  USER   │
└─────────┘
```

---

## Component Interaction Map

```
                    ┌─────────────────┐
                    │   User Action   │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│  Expenses     │  │    Tasks      │  │  Household    │
│  Component    │  │  Component    │  │  Component    │
└───────┬───────┘  └───────┬───────┘  └───────┬───────┘
        │                  │                  │
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│expenseService │  │ taskService   │  │householdService│
└───────┬───────┘  └───────┬───────┘  └───────┬───────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           ▼
                ┌───────────────────────┐
                │  HTTP Requests (JSON) │
                └───────────┬───────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │  Spring Boot Server   │
                │  (Port 8081)          │
                └───────────┬───────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ExpenseController│ │TaskController │ │HouseholdController│
└───────┬───────┘  └───────┬───────┘  └───────┬───────┘
        │                  │                  │
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ExpenseService │  │ TaskService   │  │HouseholdService│
└───────┬───────┘  └───────┬───────┘  └───────┬───────┘
        │                  │                  │
        ▼                  ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│ExpenseRepository│ │TaskRepository │ │HouseholdRepository│
└───────┬───────┘  └───────┬───────┘  └───────┬───────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           ▼
                ┌───────────────────────┐
                │    JPA / Hibernate    │
                └───────────┬───────────┘
                            │
                            ▼
                ┌───────────────────────┐
                │  MySQL Database       │
                │  (Port 8889)          │
                └───────────────────────┘
```

---

## State Management Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    AUTH CONTEXT                              │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Provider wraps entire app                           │    │
│  │  - user state (id, name, email, householdId)        │    │
│  │  - login() / logout() functions                      │    │
│  │  - Persisted in localStorage                        │    │
│  └────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
                              │
                              │ Consumed by
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                  HOUSEHOLD CONTEXT                           │
│  ┌────────────────────────────────────────────────────┐    │
│  │  Provider wraps app routes                          │    │
│  │  - household state                                  │    │
│  │  - members list                                     │    │
│  │  - getMemberById() helper                           │    │
│  └────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
                              │
                              │ Consumed by
                              ▼
┌──────────────────────────────────────────────────────────────┐
│                    COMPONENTS                                 │
│  ┌────────────────────────────────────────────────────┐    │
│  │  - Expenses, Tasks, Dashboard, etc.                 │    │
│  │  - useAuth() hook → access user data                │    │
│  │  - useHousehold() hook → access household data      │    │
│  │  - useState() for local component state             │    │
│  └────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

---

## Request Lifecycle (Step by Step)

### Example: Creating an Expense

| Step | Layer | Action | Format |
|------|-------|--------|--------|
| 1 | React UI | User fills form | HTML Form |
| 2 | Component | Validate input | JavaScript |
| 3 | Service | Prepare payload | JS Object |
| 4 | fetch() | POST request | JSON String |
| 5 | Network | HTTP transmission | HTTP/JSON |
| 6 | Spring Boot | Receive request | HTTP Request |
| 7 | Controller | Validate with @Valid | Java Entity |
| 8 | Service | Business logic | Java Entity |
| 9 | Repository | Save to database | Java Entity |
| 10 | JPA | Generate SQL | SQL |
| 11 | MySQL | Execute INSERT | SQL |
| 12 | MySQL | Return generated ID | Result |
| 13 | JPA | Map to Entity | Java Entity |
| 14 | Repository | Return to service | Java Entity |
| 15 | Service | Return to controller | Java Entity |
| 16 | Controller | Convert to JSON | JSON String |
| 17 | Spring Boot | Send HTTP 201 | HTTP Response |
| 18 | Network | HTTP transmission | HTTP/JSON |
| 19 | fetch() | Receive response | JS Object |
| 20 | Service | Parse JSON | JS Object |
| 21 | Component | Update state | React State |
| 22 | React | Re-render UI | Virtual DOM |
| 23 | Browser | Display updated list | HTML |

---

## Technology Stack Summary

### Frontend Stack
- **Framework**: React 19
- **Build Tool**: Vite 8
- **Routing**: React Router 7
- **State Management**: Context API + useState/useEffect
- **HTTP Client**: Native fetch() API
- **Dev Server**: Port 5173

### Backend Stack
- **Framework**: Spring Boot 4.1.1
- **Java Version**: 17
- **Server**: Tomcat 11.0.24
- **ORM**: Hibernate 7.4.5 (JPA)
- **Data Access**: Spring Data JPA
- **API Style**: RESTful
- **Server Port**: 8081

### Database Stack
- **Database**: MySQL 8.0
- **Connection**: JDBC (mysql-connector-j)
- **Connection Pool**: HikariCP
- **Migrations**: Flyway
- **Host**: MAMP
- **Port**: 8889

### Communication
- **Protocol**: HTTP/1.1
- **Data Format**: JSON
- **Content-Type**: application/json
- **Methods**: GET, POST, PUT, DELETE

---

## Key Points

1. **Separation of Concerns**: Clear separation between UI, business logic, and data access
2. **RESTful API**: Standard HTTP methods and status codes
3. **Stateless Backend**: Each request contains all necessary information
4. **Stateful Frontend**: React manages application state
5. **Type Safety**: Java entities vs JavaScript objects with mapping
6. **Validation**: Both frontend (form validation) and backend (@Valid)
7. **Error Handling**: Try-catch blocks and HTTP error responses
8. **Data Persistence**: JPA entities mapped to database tables
9. **Lazy Loading**: Relationships loaded on demand (FetchType.LAZY)
10. **Cascade Operations**: Automatic deletion of related entities
