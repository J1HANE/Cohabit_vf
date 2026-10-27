# CoHabit - Application Flow Diagram

## Complete Architecture Flow

```mermaid
graph TB
    subgraph "Frontend Layer (React)"
        A[User Interface] --> B[React Components]
        B --> C[Services Layer]
        C --> D[Context API<br/>Auth & Household]
    end

    subgraph "API Layer (HTTP)"
        E[HTTP Requests<br/>REST API]
    end

    subgraph "Backend Layer (Spring Boot)"
        F[Controllers<br/>REST Endpoints]
        F --> G[Services Layer<br/>Business Logic]
        G --> H[Repositories Layer<br/>Data Access]
        H --> I[JPA/Hibernate<br/>ORM]
    end

    subgraph "Database Layer"
        J[(MySQL Database<br/>MAMP Port 8889)]
    end

    D -->|fetch()| E
    E -->|JSON| F
    F --> G
    G --> H
    H --> I
    I --> J
    J --> I
    I --> H
    H --> G
    G --> F
    F -->|JSON Response| E
    E --> D
    D --> B
    B --> A

    style A fill:#e1f5ff
    style F fill:#fff4e1
    style G fill:#ffe1e1
    style H fill:#e1ffe1
    style J fill:#f0e1ff
```

---

## Data Flow - Create Expense Example

```mermaid
sequenceDiagram
    participant User as 👤 User
    participant UI as 🖥️ React UI
    participant Service as 📦 expenseService.js
    participant API as 🌐 HTTP/REST
    participant Controller as 🎮 ExpenseController
    participant ServiceLayer as 💼 ExpenseService
    participant Repository as 📁 ExpenseRepository
    participant DB as 💾 MySQL Database

    User->>UI: Fills expense form
    UI->>UI: Validates input
    UI->>Service: createExpense(expenseData)
    Service->>API: POST /api/expenses<br/>{ householdId, payerId, label, amount, shares }
    API->>Controller: HTTP POST Request
    Controller->>Controller: @Valid annotation validation
    Controller->>ServiceLayer: createExpense(expense)
    ServiceLayer->>ServiceLayer: Set paidAmount for payer shares
    ServiceLayer->>Repository: save(expense)
    Repository->>DB: INSERT INTO expenses
    Repository->>DB: INSERT INTO expense_shares
    DB-->>Repository: Success
    Repository-->>ServiceLayer: Expense entity
    ServiceLayer-->>Controller: Expense entity
    Controller-->>API: 201 Created + JSON
    API-->>Service: JSON Response
    Service-->>UI: Navigate to /expenses
    UI->>Service: getExpensesByHousehold()
    Service->>API: GET /api/expenses/household/{id}
    API->>Controller: HTTP GET Request
    Controller->>ServiceLayer: getExpensesByHousehold()
    ServiceLayer->>Repository: findByHouseholdIdWithShares()
    Repository->>DB: SELECT * FROM expenses<br/>LEFT JOIN expense_shares
    DB-->>Repository: Expense list
    Repository-->>ServiceLayer: Expense list
    ServiceLayer-->>Controller: Expense list
    Controller-->>API: 200 OK + JSON
    API-->>Service: JSON Response
    Service-->>UI: Expense list
    UI-->>User: Display updated expense list
```

---

## Complete Request-Response Cycle

```mermaid
graph LR
    A[User Action] --> B[React Component]
    B --> C[Form Validation]
    C --> D[Service Call]
    D --> E[HTTP Request]
    E --> F[Spring Boot Server<br/>Port 8081]
    F --> G[Controller]
    G --> H[Service Layer]
    H --> I[Repository]
    I --> J[JPA/Hibernate]
    J --> K[MySQL<br/>Port 8889]
    K --> L[Query Execution]
    L --> M[Result Return]
    M --> N[Entity Mapping]
    N --> O[Repository Return]
    O --> P[Service Processing]
    P --> Q[Controller Response]
    Q --> R[HTTP Response]
    R --> S[JSON Data]
    S --> T[Service Receive]
    T --> U[State Update]
    U --> V[UI Re-render]
    V --> W[User Feedback]

    style A fill:#ff6b6b
    style F fill:#4ecdc4
    style K fill:#95e1d3
    style W fill:#ff6b6b
```

---

## Component Communication Flow

```mermaid
graph TB
    subgraph "Frontend (React - Port 5173)"
        subgraph "UI Components"
            A[ExpenseNew.jsx]
            B[Expenses.jsx]
            C[TaskNew.jsx]
            D[Tasks.jsx]
            E[HouseholdCreate.jsx]
        end

        subgraph "Services"
            F[expenseService.js]
            G[taskService.js]
            H[householdService.js]
            I[authService.js]
        end

        subgraph "Context"
            J[AuthContext]
            K[HouseholdContext]
        end
    end

    subgraph "Network"
        L[HTTP/JSON<br/>localhost:8081]
    end

    subgraph "Backend (Spring Boot - Port 8081)"
        subgraph "Controllers"
            M[ExpenseController]
            N[TaskController]
            O[HouseholdController]
            P[AuthController]
        end

        subgraph "Services"
            Q[ExpenseService]
            R[TaskService]
            S[HouseholdService]
        end

        subgraph "Repositories"
            T[ExpenseRepository]
            U[TaskRepository]
            V[HouseholdRepository]
            W[UserRepository]
        end

        subgraph "Database"
            X[(MySQL<br/>Port 8889)]
        end
    end

    A --> F
    B --> F
    C --> G
    D --> G
    E --> H
    F --> L
    G --> L
    H --> L
    I --> L
    J --> A
    J --> B
    J --> C
    J --> D
    K --> A
    K --> B
    K --> C
    K --> D

    L --> M
    L --> N
    L --> O
    L --> P

    M --> Q
    N --> R
    O --> S
    P --> W

    Q --> T
    R --> U
    S --> V
    S --> W

    T --> X
    U --> X
    V --> X
    W --> X

    style L fill:#ffeaa7
    style X fill:#a29bfe
```

---

## Authentication Flow

```mermaid
sequenceDiagram
    participant User as 👤 User
    participant UI as 🖥️ Login Form
    participant AuthCtx as 🔐 AuthContext
    participant AuthService as 📦 authService.js
    participant API as 🌐 HTTP
    participant AuthCtrl as 🎮 AuthController
    participant UserRepo as 📁 UserRepository
    participant DB as 💾 MySQL

    User->>UI: Enters email & password
    UI->>UI: Validates form
    UI->>AuthService: login(email, password)
    AuthService->>API: POST /api/auth/login
    API->>AuthCtrl: HTTP POST
    AuthCtrl->>UserRepo: findByEmail(email)
    UserRepo->>DB: SELECT * FROM users WHERE email = ?
    DB-->>UserRepo: User entity
    UserRepo-->>AuthCtrl: Optional<User>
    AuthCtrl->>AuthCtrl: passwordEncoder.matches()
    alt Valid credentials
        AuthCtrl-->>API: 200 OK + {id, name, email, householdId}
        API-->>AuthService: JSON response
        AuthService-->>AuthCtx: setUser(userData)
        AuthCtx->>AuthCtx: localStorage.setItem('user')
        AuthCtx-->>UI: Navigate to dashboard
        UI-->>User: Welcome screen
    else Invalid credentials
        AuthCtrl-->>API: 401 Unauthorized
        API-->>AuthService: Error
        AuthService-->>UI: "Invalid email or password"
        UI-->>User: Error message
    end
```

---

## CRUD Operations Flow

### CREATE (Create)

```mermaid
graph TD
    A[User fills form] --> B[React Component]
    B --> C[Form validation]
    C --> D[Service call]
    D --> E[POST request]
    E --> F[Controller receives]
    F --> G[@Valid annotation]
    G --> H[Service layer]
    H --> I[Business logic]
    I --> J[Repository save]
    J --> K[JPA INSERT]
    K --> L[Database]
    L --> M[Generated ID]
    M --> N[Return entity]
    N --> O[HTTP 201]
    O --> P[JSON response]
    P --> Q[Frontend receive]
    Q --> R[Update state]
    R --> S[UI refresh]
    S --> T[User sees new item]

    style A fill:#ff6b6b
    style F fill:#4ecdc4
    style L fill:#95e1d3
    style T fill:#ff6b6b
```

### READ (Read)

```mermaid
graph TD
    A[User requests data] --> B[React Component]
    B --> C[useEffect hook]
    C --> D[Service call]
    D --> E[GET request]
    E --> F[Controller receives]
    F --> G[Service layer]
    G --> H[Repository query]
    H --> I[JPA SELECT]
    I --> J[Database]
    J --> K[Result set]
    K --> L[Entity mapping]
    L --> M[Return list]
    M --> N[HTTP 200]
    N --> O[JSON response]
    O --> P[Frontend receive]
    P --> Q[Update state]
    Q --> R[UI render]
    R --> S[User sees data]

    style A fill:#ff6b6b
    style F fill:#4ecdc4
    style J fill:#95e1d3
    style S fill:#ff6b6b
```

### UPDATE (Update)

```mermaid
graph TD
    A[User edits item] --> B[React Component]
    B --> C[Form pre-filled]
    C --> D[User modifies]
    D --> E[Form validation]
    E --> F[Service call]
    F --> G[PUT request]
    G --> H[Controller receives]
    H --> I[@Valid annotation]
    I --> J[Service layer]
    J --> K[Business logic]
    K --> L[Repository findById]
    L --> M[Entity exists?]
    M -->|Yes| N[Update fields]
    M -->|No| O[404 Not Found]
    N --> P[Repository save]
    P --> Q[JPA UPDATE]
    Q --> R[Database]
    R --> S[Return updated entity]
    S --> T[HTTP 200]
    T --> U[JSON response]
    U --> V[Frontend receive]
    V --> W[Update state]
    W --> X[UI refresh]
    X --> Y[User sees updated item]

    style A fill:#ff6b6b
    style H fill:#4ecdc4
    style R fill:#95e1d3
    style Y fill:#ff6b6b
```

### DELETE (Delete)

```mermaid
graph TD
    A[User clicks delete] --> B[React Component]
    B --> C[Confirm dialog]
    C --> D[User confirms]
    D --> E[Service call]
    E --> F[DELETE request]
    F --> G[Controller receives]
    G --> H[Service layer]
    H --> I[Repository deleteById]
    I --> J[JPA DELETE]
    J --> K[Database]
    K --> L[CASCADE deletes]
    L --> M[Return 204]
    M --> N[HTTP 204 No Content]
    N --> O[Frontend receive]
    O --> P[Remove from state]
    P --> Q[UI refresh]
    Q --> R[Item removed from list]

    style A fill:#ff6b6b
    style G fill:#4ecdc4
    style K fill:#95e1d3
    style R fill:#ff6b6b
```

---

## Technology Stack Flow

```mermaid
graph TB
    subgraph "Client Side"
        A[React 19]
        B[Vite 8]
        C[React Router 7]
        D[Context API]
    end

    subgraph "Network Protocol"
        E[HTTP/1.1]
        F[JSON]
        G[RESTful API]
    end

    subgraph "Server Side"
        H[Spring Boot 4.1.1]
        I[Tomcat 11.0.24]
        J[Spring MVC]
        K[Spring Data JPA]
        L[Hibernate 7.4.5]
    end

    subgraph "Database"
        M[MySQL 8.0]
        N[JDBC Driver]
        O[HikariCP Pool]
    end

    A --> B
    B --> C
    C --> D
    D --> E
    E --> F
    F --> G
    G --> H
    H --> I
    I --> J
    J --> K
    K --> L
    L --> N
    N --> O
    O --> M

    style A fill:#61dafb
    style H fill:#6db33f
    style M fill:#4479a1
```

---

## Error Handling Flow

```mermaid
graph TD
    A[Request fails] --> B{Error type?}
    B -->|Network error| C[Fetch catch]
    B -->|HTTP error| D[Response !ok]
    B -->|Validation error| E[@Valid fails]

    C --> F[Display connection error]
    D --> G{Status code?}
    G -->|400| H[Bad request]
    G -->|401| I[Unauthorized]
    G -->|404| J[Not found]
    G -->|500| K[Server error]

    E --> L[Display validation errors]
    H --> M[Display form errors]
    I --> N[Redirect to login]
    J --> O[Display not found]
    K --> P[Display server error]

    F --> Q[User notification]
    L --> Q
    M --> Q
    N --> Q
    O --> Q
    P --> Q

    style A fill:#ff6b6b
    style Q fill:#ff6b6b
```

---

## State Management Flow

```mermaid
graph LR
    A[Component mounts] --> B[useEffect]
    B --> C[Service call]
    C --> D[API request]
    D --> E[Backend processing]
    E --> F[Data return]
    F --> G[setState]
    G --> H[Re-render]
    H --> I[UI update]

    J[User action] --> K[Event handler]
    K --> L[Service call]
    L --> M[API request]
    M --> N[Backend processing]
    N --> O[Data return]
    O --> P[setState]
    P --> H

    Q[Context update] --> R[Provider value change]
    R --> S[All consumers re-render]
    S --> H

    style A fill:#61dafb
    style E fill:#6db33f
    style Q fill:#61dafb
```

---

## Summary Flow Tables

### Request Lifecycle

| Step | Component | Action | Data Format |
|------|-----------|--------|-------------|
| 1 | React Component | User interaction | - |
| 2 | Service | Prepare request | JavaScript Object |
| 3 | fetch() | HTTP request | JSON string |
| 4 | Spring Boot | Receive request | HTTP + JSON |
| 5 | Controller | Validate & route | Entity/DTO |
| 6 | Service | Business logic | Entity |
| 7 | Repository | Database operation | Entity |
| 8 | JPA/Hibernate | SQL execution | SQL |
| 9 | MySQL | Data persistence | Table rows |
| 10 | MySQL | Return result | Result set |
| 11 | JPA/Hibernate | Map to Entity | Entity |
| 12 | Repository | Return to Service | Entity |
| 13 | Service | Process result | Entity/DTO |
| 14 | Controller | Prepare response | JSON |
| 15 | Spring Boot | HTTP response | JSON string |
| 16 | fetch() | Receive response | JavaScript Object |
| 17 | Service | Update state | JavaScript Object |
| 18 | React Component | Re-render | UI |

### Technology Ports

| Layer | Technology | Port | Purpose |
|-------|-----------|------|---------|
| Frontend | Vite Dev Server | 5173 | React application |
| Backend | Spring Boot/Tomcat | 8081 | REST API |
| Database | MySQL (MAMP) | 8889 | Data storage |
| Network | HTTP | 80/443 | Communication protocol |

### Data Formats

| Layer | Format | Example |
|-------|--------|---------|
| Frontend State | JavaScript Object | `{ name: "John", age: 25 }` |
| HTTP Request | JSON String | `'{"name":"John","age":25}'` |
| Backend Entity | Java Object | `User(name="John", age=25)` |
| Database | Table Row | `id=1, name='John', age=25` |
| HTTP Response | JSON String | `'{"id":1,"name":"John","age":25}'` |
