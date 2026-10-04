# Student Attendance Dashboard 🎓
> **Interactive Attendance Analytics Platform using D3.js**

A modern, full-stack web application designed for colleges and schools to manage student attendance, track performance metrics, and visualize complex attendance statistics interactively using **D3.js**.

---

## 🌟 Key Features

### 👨‍🎓 Student Role
* **Role-Based Login**: Login with email and password to access personalized student dashboard.
* **Overall Attendance Summary**: Track overall percentage, total classes conducted, classes attended, and classes missed.
* **Attendance Status Classification**: Automatic classification into **High Attendance (>= 75%)**, **Average Attendance (60% - 74.99%)**, and **Low Attendance (< 60%)**.
* **Subject-Wise Cards**: Dynamic progress bars, status badges, attended/missed class counts, and mini D3 donut charts.
* **D3 Visualizations**:
  * **Overall Attendance Donut Chart**: Center percentage text with hover tooltips.
  * **Subject Comparison Bar Chart**: D3 bar chart with reference threshold lines and hover animations.
  * **Attendance Category Chart**: Breakdown of subjects across High, Average, and Low status.
* **Subject Detail Modal**: View faculty details, attended/absent breakdown, and **D3 Attendance Progress Line Chart** over time.
* **Attendance History**: Filter logs by subject, status (Present, Absent, Late), and date.

---

### 👨‍🏫 Teacher / Admin Role
* **Class Overview Dashboard**: Monitor Total Students, Total Subjects, Average Class Attendance %, and Low Attendance Count.
* **Low Attendance Alerts Banner**: Instant alert cards highlighting students falling below configurable low attendance threshold (< 60%).
* **Student Management**: Add new students, edit details, search, filter by department/semester, delete students, and view individual student analytics.
* **Unlimited Subject Management**: Add unlimited new subjects dynamically without modifying frontend code. Charts and analytics automatically adjust.
* **Mark Attendance**: Select date, subject, and section; toggle Present / Absent / Late per student; use "Mark All Present" batch action; submit directly to database.
* **Attendance Log Records**: View, search, filter, and edit recorded attendance entries.
* **Teacher Analytics**: Class performance comparison, High vs. Low attendance lists, student breakdown table with search & sorting.
* **Reports Generator**: Filter reports by type and department; export data as **CSV** or print formatted **PDF** documents.
* **Admin Threshold Settings**: Change High Attendance cutoff %, Low Attendance cutoff %, and Late weight dynamically. Automatically updates status classification throughout the application.

---

## 🛠️ Technology Stack

* **Frontend**: React 18, Vite, JavaScript (ES6+), Tailwind CSS, D3.js (v7), Lucide Icons, Axios, React Router DOM (v6).
* **Backend**: Node.js, Express.js, JWT (`jsonwebtoken`), Bcrypt (`bcryptjs`), `express-validator`, `cors`, `dotenv`.
* **Database**: PostgreSQL (`pg` pool client) with automatic dual-mode local file fallback (`attendance_db.json`) if PostgreSQL server is not locally running.

---

## 🔑 Demo Login Credentials

For quick evaluation, pre-seeded accounts are provided on the login page:

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Student** | `student@example.com` | `password123` | Rahul Kumar (ID: ST001) |
| **Teacher** | `teacher@example.com` | `password123` | Dr. Ramesh Kumar (Faculty) |
| **Admin** | `admin@example.com` | `password123` | System Admin |

---

## 🚀 Getting Started

### 1. Prerequisites
* Node.js (v18 or higher)
* npm (v9 or higher)

### 2. Running the Backend Server
```bash
cd backend
npm install
npm run seed  # Populates demo data
npm start     # Runs on http://localhost:5000
```

### 3. Running the Frontend App
```bash
cd frontend
npm install
npm run dev   # Runs on http://localhost:5173
```

---

## 🧪 Testing Backend & Business Logic

Run the automated test suite verifying attendance calculation accuracy, threshold classification logic, database seeding, and schema integrity:

```bash
cd backend
npm test
```

---

## 📡 REST API Architecture

| Endpoint | Method | Role | Purpose |
| :--- | :--- | :--- | :--- |
| `/api/auth/login` | `POST` | Public | Authenticate user & issue JWT token |
| `/api/auth/me` | `GET` | Authenticated | Fetch current user session profile |
| `/api/students` | `GET` \| `POST` | Teacher/Admin | List or create students |
| `/api/students/:id` | `GET` \| `PUT` \| `DELETE` | Teacher/Admin | Manage student records |
| `/api/subjects` | `GET` \| `POST` | Authenticated | List or create subjects dynamically |
| `/api/subjects/:id` | `PUT` \| `DELETE` | Teacher/Admin | Edit or delete subject |
| `/api/attendance` | `GET` \| `POST` | Authenticated | Fetch or batch mark attendance |
| `/api/attendance/:id` | `PUT` \| `DELETE` | Teacher/Admin | Update or delete attendance log |
| `/api/analytics/student/:id` | `GET` | Authenticated | Fetch student D3 analytics & timeline |
| `/api/analytics/class` | `GET` | Teacher/Admin | Fetch class summary stats & comparison |
| `/api/analytics/alerts` | `GET` | Teacher/Admin | Fetch low attendance student alerts |
| `/api/settings` | `GET` \| `PUT` | Teacher/Admin | View or update configurable thresholds |
| `/api/reports` | `GET` | Teacher/Admin | Generate report datasets for CSV/PDF |

---

## 📂 Project Structure

```
student-attendance-dashboard/
├── backend/
│   ├── src/
│   │   ├── config/ (db.js)
│   │   ├── database/ (seed.js)
│   │   ├── controllers/ (auth, student, subject, attendance, analytics, report, setting)
│   │   ├── middleware/ (authMiddleware, roleMiddleware)
│   │   ├── routes/ (auth, student, subject, attendance, analytics, report, setting)
│   │   ├── utils/ (attendanceCalculator.js)
│   │   └── server.js
│   ├── tests/ (api.test.js)
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── assets/
│   │   ├── charts/ (AttendanceDonutChart, SubjectAttendanceBarChart, AttendanceTimelineChart, AttendanceCategoryChart)
│   │   ├── components/ (Navbar, Sidebar, SummaryCard, StatusBadge, Modal, EmptyState)
│   │   ├── context/ (AuthContext, ToastContext, ConfigContext)
│   │   ├── layouts/ (DashboardLayout)
│   │   ├── pages/ (Login, StudentDashboard, SubjectDetailsModal, AdminDashboard, ManageStudents, ManageSubjects, MarkAttendance, AttendanceRecords, AnalyticsPage, ReportsPage, SettingsPage, StudentProfile)
│   │   ├── services/ (api.js)
│   │   └── utils/ (attendanceUtils.js)
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.js
│   └── package.json
└── README.md
```
