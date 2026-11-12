# 🩸 Sweety – Blood Glucose Tracker

A full-stack web application that helps users record, manage, and monitor their daily blood glucose readings. It provides secure authentication, reading management, and date-based reports to help users track their glucose history.

## 🚀 Features

### Authentication
- User registration and login.
- Password hashing using bcrypt.
- JWT-based authentication.
- Protected API routes.

### Glucose Reading Management
- Add daily blood glucose readings.
- View reading history.
- Edit existing readings.
- Delete readings.
- Four daily reading slots:
  - Morning
  - After breakfast
  - After lunch
  - After dinner

### Data Validation
- Glucose values must be whole numbers between 40 and 600 mg/dL.
- Prevents duplicate readings for the same time slot and date.
- Maximum of four readings per day.
- Prevents selecting future dates.
- User-specific reading access.

### Pagination
- Server-side pagination.
- Displays five readings per page.
- Previous and Next navigation.
- Displays total reading count.

### Glucose Reports
- **Daily Report:** Statistics for the selected date.
- **Month-to-Date Report:** Statistics from the first day of the month to the selected date.
- **Previous Month Report:** Statistics for the entire previous month.
- Displays maximum, minimum, average and total readings.
- Daily reading details.

## 🛠️ Technologies Used

| Category | Technologies |
|---|---|
| Frontend | React.js, HTML, CSS, JavaScript |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Authentication | JWT, bcrypt |
| API Integration | Axios, REST API |
| Development Tools | VS Code, Postman, pgAdmin, Git, GitHub |

## 📁 Project Structure

```text
sweety-glucose-tracker/
│
├── client/
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── ReadingForm.jsx
│       │   ├── ReadingList.jsx
│       │   └── ReportCards.jsx
│       ├── pages/
│       │   ├── Login.jsx
│       │   ├── Signup.jsx
│       │   └── Dashboard.jsx
│       ├── services/
│       │   └── api.js
│       ├── index.css
│       ├── auth.css
│       └── dashboard.css
│
├── server/
│   ├── config/
│   │   └── db.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── readingController.js
│   │   └── reportController.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── readingRoutes.js
│   │   └── reportRoutes.js
│   ├── scripts/
│   ├── tests/
│   ├── server.js
│   └── package.json
│
├── .gitignore
└── README.md
```

## ⚙️ Installation and Setup

### 1. Clone the Repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd sweety-glucose-tracker
```

### 2. Backend Setup

```bash
cd server
npm install
```

Create a `.env` file inside the `server` folder:

```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_postgresql_password
DB_NAME=sweety_db
JWT_SECRET=your_secure_jwt_secret
```

### 3. Database Setup

1. Install PostgreSQL.
2. Create a database named `sweety_db`.
3. Create the `users` and `readings` tables.
4. Configure your database credentials in the server `.env` file.

### 4. Start Backend

```bash
npm run dev
```

Backend runs at:

`http://localhost:5000`

### 5. Frontend Setup

Open another terminal:

```bash
cd client
npm install
npm run dev
```

Open the frontend URL displayed by Vite in your terminal.

## 🔗 API Endpoints

### Authentication

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/signup` | Register a new user |
| POST | `/api/auth/login` | Login user |

### Glucose Readings

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/readings` | Add a reading |
| GET | `/api/readings` | Get paginated readings |
| PUT | `/api/readings/:id` | Update a reading |
| DELETE | `/api/readings/:id` | Delete a reading |

Pagination example:

```text
GET /api/readings?page=1&limit=5
```

### Reports

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/reports?date=YYYY-MM-DD` | Get glucose reports |

All reading and report endpoints require JWT authentication.

## 🔐 Security

- Passwords are securely hashed using bcrypt.
- JWT authentication protects private endpoints.
- Middleware verifies authenticated users.
- Database queries use parameterized SQL.
- Users can access only their own glucose readings.
- Environment variables protect sensitive configuration.

## 🎯 Project Objective

The objective of this project is to develop a simple and user-friendly blood glucose tracking application that allows individuals to maintain their daily glucose records and view meaningful summaries over different time periods.

## 👩‍💻 Author

**Gayatri**

GitHub: YOUR_GITHUB_PROFILE_URL

---

⭐ If you find this project useful, consider giving it a star!