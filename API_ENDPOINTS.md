# CoHabit API REST Endpoints

Base URL: `http://localhost:8081`

## Authentication

### Register
- **POST** `/api/auth/register`
- **Body:**
  ```json
  {
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Response:**
  ```json
  {
    "message": "User registered successfully",
    "userId": 1
  }
  ```

### Login
- **POST** `/api/auth/login`
- **Body:**
  ```json
  {
    "email": "john@example.com",
    "password": "password123"
  }
  ```
- **Response:**
  ```json
  {
    "message": "Login successful",
    "token": "<bearer-token>",
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "householdId": 1
  }
  ```

---

## Households

### Get All Households
- **GET** `/api/households`
- **Response:** Array of households

### Get Household by ID
- **GET** `/api/households/{householdId}`
- **Response:**
  ```json
  {
    "id": 1,
    "name": "My House",
    "invite_code": "ABC123",
    "created_at": "2024-01-01T00:00:00"
  }
  ```

### Get Household Members
- **GET** `/api/households/{householdId}/members`
- **Response:** Array of users

### Create Household
- **POST** `/api/households`
- **Body:**
  ```json
  {
    "name": "My House",
    "userId": 1
  }
  ```
- **Response:**
  ```json
  {
    "household": {
      "id": 1,
      "name": "My House",
      "invite_code": "ABC123",
      "created_at": "2024-01-01T00:00:00"
    },
    "members": [...]
  }
  ```

### Update Household
- **PUT** `/api/households/{householdId}`
- **Body:**
  ```json
  {
    "name": "New Name"
  }
  ```
- **Response:** Updated household object

### Delete Household
- **DELETE** `/api/households/{householdId}`
- **Response:** 204 No Content

### Join Household
- **POST** `/api/households/join`
- **Body:**
  ```json
  {
    "inviteCode": "ABC123",
    "userId": 1
  }
  ```
- **Response:**
  ```json
  {
    "household": {...},
    "members": [...]
  }
  ```

### Leave Household
- **POST** `/api/households/leave`
- **Body:**
  ```json
  {
    "userId": 1
  }
  ```
- **Response:**
  ```json
  {
    "message": "Successfully left household"
  }
  ```

### Regenerate Invite Code
- **POST** `/api/households/{householdId}/regenerate-code`
- **Response:**
  ```json
  {
    "household": {...},
    "inviteCode": "XYZ789",
    "message": "New invitation code generated successfully"
  }
  ```

---

## Expenses

### Get All Expenses
- **GET** `/api/expenses`
- **Response:** Array of expenses with shares

### Get Expenses by Household
- **GET** `/api/expenses/household/{householdId}`
- **Response:** Array of expenses for the household

### Get Expense by ID
- **GET** `/api/expenses/{id}`
- **Response:** Expense object with shares

### Create Expense
- **POST** `/api/expenses`
- **Body:**
  ```json
  {
    "householdId": 1,
    "payerId": 1,
    "label": "Groceries",
    "amount": 150.50,
    "expenseDate": "2024-01-01",
    "emoji": "🛒",
    "shares": [
      {
        "userId": 1,
        "shareAmount": 75.25
      },
      {
        "userId": 2,
        "shareAmount": 75.25
      }
    ]
  }
  ```
- **Response:** Created expense object

### Update Expense
- **PUT** `/api/expenses/{id}`
- **Body:** Same as create
- **Response:** Updated expense object

### Delete Expense
- **DELETE** `/api/expenses/{id}`
- **Response:** 204 No Content

### Settle Expense Share
- **POST** `/api/expenses/{id}/settle`
- **Body:**
  ```json
  {
    "userId": 2,
    "amount": 75.25
  }
  ```
- **Response:** Updated expense object

---

## Settlements

### Get All Settlements
- **GET** `/api/settlements`
- **Response:** Array of settlements

### Get Settlements by Household
- **GET** `/api/settlements/household/{householdId}`
- **Response:** Array of settlements for the household

### Create Settlement
- **POST** `/api/settlements`
- **Body:**
  ```json
  {
    "householdId": 1,
    "fromUserId": 1,
    "toUserId": 2,
    "amount": 50.00
  }
  ```
- **Response:** Created settlement object

---

## Shopping Items

### Get All Shopping Items
- **GET** `/api/shopping`
- **Response:** Array of shopping items

### Get Shopping Items by Household
- **GET** `/api/shopping/household/{householdId}`
- **Response:** Array of shopping items for the household

### Create Shopping Item
- **POST** `/api/shopping`
- **Body:**
  ```json
  {
    "householdId": 1,
    "name": "Milk",
    "purchased": false,
    "addedById": 1
  }
  ```
- **Response:** Created shopping item object

### Update Shopping Item
- **PUT** `/api/shopping/{id}`
- **Body:** Same as create
- **Response:** Updated shopping item object

### Delete Shopping Item
- **DELETE** `/api/shopping/{id}`
- **Response:** 204 No Content

---

## Tasks

### Get All Tasks
- **GET** `/api/tasks`
- **Response:** Array of tasks

### Get Task by ID
- **GET** `/api/tasks/{id}`
- **Response:** Task object

### Create Task
- **POST** `/api/tasks`
- **Body:**
  ```json
  {
    "householdId": 1,
    "name": "Clean kitchen",
    "frequencyDays": 7,
    "dueDate": "2024-01-01",
    "status": "pending",
    "assignedUserId": 1,
    "rotationIndex": 0
  }
  ```
- **Response:** Created task object

### Update Task
- **PUT** `/api/tasks/{id}`
- **Body:** Same as create
- **Response:** Updated task object

### Delete Task
- **DELETE** `/api/tasks/{id}`
- **Response:** 204 No Content

---

## Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `204 No Content` - Successful request with no response body
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Authenticated user lacks permission
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Notes

- All datetime fields use ISO 8601 format
- Monetary values use DECIMAL(12, 2) format
- Every endpoint except `/api/auth/register` and `/api/auth/login` requires `Authorization: Bearer <token>`.
- Login tokens expire after seven days. Set `COHABIT_AUTH_SECRET` to a random secret of at least 32 bytes before deployment.

## Finalized Feature Routes

- `PUT /api/expenses/{id}` and `DELETE /api/expenses/{id}` are restricted to the authenticated creator. Expense shares must add up to the expense total.
- `POST /api/tasks/{id}/complete` completes a task only when called by its assigned member. The generic `PUT` route cannot change task status.
- `POST /api/shopping/{id}/purchase` accepts `{ "price": 42.50 }`; it records the purchase and creates an evenly split household expense in the same transaction.
- `DELETE /api/households/{householdId}/members/{memberId}` removes a member; `PUT /api/households/{householdId}/administrator/{memberId}` transfers household administration. Only the current household administrator may rename the household, change its administrator, remove members, or regenerate its invite code.
- `POST /api/complaints` accepts category `USER_REPORT` with `reportedUserId`. Reports are limited to members of the reporter's household.
- `POST /api/upload` accepts image or PDF receipts up to 10 MB and requires authentication.

## Runtime Configuration

- `COHABIT_AUTH_SECRET`: signing secret for authentication tokens; set a unique value outside development.
- `COHABIT_ADMIN_EMAIL` and `COHABIT_ADMIN_PASSWORD`: optionally create/promote the platform administrator at startup. The password must have at least eight characters.
- `COHABIT_MAIL_ENABLED=true`, `COHABIT_MAIL_FROM`, and standard `SPRING_MAIL_HOST`, `SPRING_MAIL_PORT`, `SPRING_MAIL_USERNAME`, and `SPRING_MAIL_PASSWORD` settings enable email notifications. Email remains disabled by default.
- Flyway applies migration `V7__household_ownership_and_purchase_expenses.sql` automatically.
- All requests use JSON content type
- The API is currently in development mode without proper authentication middleware
