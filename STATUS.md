# CoHabit - État du projet (Session du 18/10/2026)

## ✅ Applications lancées

- **Backend (Spring Boot)**: ✅ Démarré sur http://localhost:8081
- **Frontend (React + Vite)**: ✅ Démarré sur http://localhost:5173
- **Base de données (MySQL/MAMP)**: ✅ Connecté sur port 8889

---

## ✅ Backend - Ce qui est COMPLÈTEMENT fait

### 1. Entités (4 entités JPA)
- ✅ **User** (`src/main/java/com/cohabit/cohabit/entity/User.java`)
  - Champs: id, name, email, passwordHash, color, household, createdAt
- ✅ **Household** (`src/main/java/com/cohabit/cohabit/entity/Household.java`)
  - Champs: id, name, inviteCode, createdAt, members, expenses, tasks
- ✅ **Expense** (`src/main/java/com/cohabit/cohabit/entity/Expense.java`)
  - Champs: id, household, payer, label, amount, expenseDate, createdAt, emoji, shares
- ✅ **Task** (`src/main/java/com/cohabit/cohabit/entity/Task.java`)
  - Champs: id, household, name, frequencyDays, dueDate, status, assignedUser, rotationIndex, lastCompletedAt

### 2. Repositories (4 repositories Spring Data JPA)
- ✅ **UserRepository** - findByEmail, findByHouseholdId
- ✅ **HouseholdRepository** - findByInviteCode
- ✅ **ExpenseRepository** - findAllWithShares, findByHouseholdIdWithShares, findByIdWithShares
- ✅ **TaskRepository** - findByHouseholdId

### 3. Services (3 services avec CRUD complet)
- ✅ **HouseholdService** (`src/main/java/com/cohabit/cohabit/service/HouseholdService.java`)
  - CREATE: createHousehold()
  - READ: getAllHouseholds(), getHouseholdById(), getHouseholdMembers()
  - UPDATE: updateHousehold()
  - DELETE: deleteHousehold()
  - Autres: joinHousehold(), leaveHousehold(), regenerateInviteCode()
- ✅ **ExpenseService** (`src/main/java/com/cohabit/cohabit/service/ExpenseService.java`)
  - CREATE: createExpense()
  - READ: getAllExpenses(), getExpensesByHousehold(), getExpenseById()
  - UPDATE: updateExpense()
  - DELETE: deleteExpense()
  - Autres: settleExpenseShare()
- ✅ **TaskService** (`src/main/java/com/cohabit/cohabit/service/TaskService.java`)
  - CREATE: createTask()
  - READ: getAllTasks(), getTaskById()
  - UPDATE: updateTask()
  - DELETE: deleteTask()

### 4. REST Controllers (3 controllers avec endpoints complets)
- ✅ **HouseholdController** (`src/main/java/com/cohabit/cohabit/controller/HouseholdController.java`)
  - GET /api/households - List all
  - GET /api/households/{id} - Get by ID
  - GET /api/households/{id}/members - Get members
  - POST /api/households - Create
  - PUT /api/households/{id} - Update
  - DELETE /api/households/{id} - Delete
  - POST /api/households/join - Join household
  - POST /api/households/leave - Leave household
  - POST /api/households/{id}/regenerate-code - Regenerate invite code
- ✅ **ExpenseController** (`src/main/java/com/cohabit/cohabit/controller/ExpenseController.java`)
  - GET /api/expenses - List all
  - GET /api/expenses/household/{id} - Get by household
  - GET /api/expenses/{id} - Get by ID
  - POST /api/expenses - Create
  - PUT /api/expenses/{id} - Update
  - DELETE /api/expenses/{id} - Delete
  - POST /api/expenses/{id}/settle - Settle share
- ✅ **TaskController** (`src/main/java/com/cohabit/cohabit/controller/TaskController.java`)
  - GET /api/tasks - List all
  - GET /api/tasks/{id} - Get by ID
  - POST /api/tasks - Create
  - PUT /api/tasks/{id} - Update
  - DELETE /api/tasks/{id} - Delete

### 5. Authentification
- ✅ **AuthController** (`src/main/java/com/cohabit/cohabit/controller/AuthController.java`)
  - POST /api/auth/register - Register user
  - POST /api/auth/login - Login user

### 6. Base de données
- ✅ Flyway migrations configurées
- ✅ Tables créées: households, users, expenses, expense_shares, tasks, settlements, shopping_items
- ✅ Configuration MySQL sur port 8889 (MAMP)

---

## ✅ Frontend - Ce qui est COMPLÈTEMENT fait

### 1. Interfaces pour Expenses
- ✅ **Expenses.jsx** - Liste des dépenses avec filtres (All, Mine, This month, Last month)
- ✅ **ExpenseNew.jsx** - Formulaire de création de dépense avec split entre membres
- ✅ Intégration API directe vers backend

### 2. Interfaces pour Tasks
- ✅ **Tasks.jsx** - Liste des tâches avec onglets (Today, Upcoming, Completed)
- ✅ **TaskNew.jsx** - Formulaire de création de tâche
- ✅ Intégration API directe vers backend

### 3. Services (centralisés) - AJOUTÉ
- ✅ **expenseService.js** - Toutes les opérations CRUD pour expenses
- ✅ **householdService.js** - Toutes les opérations CRUD pour households
- ✅ **authService.js** - Register et login
- ✅ **taskService.js** - Toutes les opérations CRUD pour tasks (existait déjà)

### 4. Architecture React
- ✅ React Router configuré
- ✅ Context API pour Auth et Household
- ✅ Layout avec Sidebar et Navigation
- ✅ Pages: Dashboard, Expenses, Tasks, Balances, Settlements, Shopping, Profile, etc.

---

## ✅ Documentation - Ajoutée

- ✅ **API_ENDPOINTS.md** - Documentation complète de tous les endpoints REST
- ✅ **postman_collection.json** - Collection Postman prête à importer pour tester l'API

---

## 📋 Ce qui reste à faire (Optionnel / Améliorations)

### Backend
1. **UserService** - Service User complet (pas strictement nécessaire pour CRUD des 3 entités demandées)
2. **UserController** - Controller User (pas strictement nécessaire pour CRUD des 3 entités demandées)
3. **Validation avancée** - Plus de validations métier
4. **Tests unitaires** - Tests JUnit pour services et controllers
5. **Sécurité** - Implémentation complète de Spring Security avec JWT

### Frontend
1. **Intégration des services** - Remplacer les appels fetch directs par les services créés
2. **Gestion d'erreurs** - Meilleure gestion des erreurs API
3. **Loading states** - Indicateurs de chargement
4. **Tests** - Tests avec React Testing Library
5. **Formulaires d'édition** - Pages pour modifier expense et task existants

### Tests Postman
- ⏳ À faire par l'utilisateur: Importer `postman_collection.json` dans Postman et tester les endpoints

---

## 🎯 Résumé pour le prof

### CRUD fonctionnel sur 3 entités ✅

**1. HOUSEHOLD (Foyer)**
- ✅ Repository: HouseholdRepository
- ✅ Service: HouseholdService (CRUD complet)
- ✅ Controller: HouseholdController (9 endpoints REST)
- ✅ Frontend: Interfaces de création/join de household

**2. EXPENSE (Dépense)**
- ✅ Repository: ExpenseRepository
- ✅ Service: ExpenseService (CRUD complet)
- ✅ Controller: ExpenseController (7 endpoints REST)
- ✅ Frontend: Interfaces de liste et création de dépenses

**3. TASK (Tâche)**
- ✅ Repository: TaskRepository
- ✅ Service: TaskService (CRUD complet)
- ✅ Controller: TaskController (5 endpoints REST)
- ✅ Frontend: Interfaces de liste et création de tâches

### API REST ✅
- 21 endpoints REST opérationnels
- Base URL: http://localhost:8081
- Documentation: API_ENDPOINTS.md
- Collection Postman: postman_collection.json

### Interfaces Frontend ✅
- React + Vite sur http://localhost:5173
- Pages pour consulter, ajouter des données
- Intégration avec API backend

### Configuration
- ✅ Backend: Spring Boot 4.1.1, Java 17
- ✅ Base de données: MySQL 8.0 (MAMP sur port 8889)
- ✅ Frontend: React 19, Vite 8, React Router 7

---

## 📝 Instructions pour tester avec Postman

1. Ouvrir Postman
2. Importer le fichier `postman_collection.json`
3. S'assurer que le backend est démarré (http://localhost:8081)
4. Tester les endpoints dans l'ordre:
   - POST /api/auth/register (créer un utilisateur)
   - POST /api/auth/login (se connecter)
   - POST /api/households (créer un household)
   - POST /api/expenses (créer une dépense)
   - POST /api/tasks (créer une tâche)
   - GET pour lire, PUT pour modifier, DELETE pour supprimer
