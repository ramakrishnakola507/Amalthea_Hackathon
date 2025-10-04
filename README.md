# Expense Management System

A full-stack application for managing employee expense reports, featuring a powerful, role-based, multi-step approval workflow engine built for the Odoo x Amalthea, IIT GN Hackathon.

---

## Features

-   **Role-Based Access Control (RBAC):** Distinct permissions and dashboards for **Admin**, **Manager**, and **Employee** roles.
-   **Multi-Step Approval Workflows:** Expenses are routed through a pre-defined, multi-step approval process (e.g., Manager -> Finance -> Director).
-   **Expense Submission with Receipts:** Employees can submit detailed expense reports, including uploading a digital receipt image.
-   **Admin User Management:** A dedicated panel for Admins to create new Employee and Manager accounts and assign hierarchies.
-   **Secure Authentication:** The application is secured with a JWT-based authentication system.
-   **Declarative Approval Rules:** The approval flow is driven by a JSON definition stored in the database, making it flexible and easy to modify.

---

## Tech Stack

-   **Frontend:** React, TypeScript, Vite, Tailwind CSS
-   **Backend:** Node.js, Express, TypeScript, Prisma
-   **Database:** PostgreSQL (running in Docker)
-   **Authentication:** JSON Web Tokens (JWT)

---

## Local Setup & Running

Follow these steps to get the project running on your local machine.

### Prerequisites
* Node.js (LTS version)
* Git
* Docker Desktop (must be open and running)

### 1. Clone the Repository
```bash
git clone [https://github.com/ramakrishna507/Amalthea_Hackathon.git](https://github.com/ramakrishna507/Amalthea_Hackathon.git)
cd Amalthea_Hackathon
2. Backend Setup
You'll need one terminal for the backend.

Bash

# Navigate to the backend folder
cd backend

# Install dependencies
npm install

# Start the PostgreSQL database using Docker
docker-compose up -d

# Create the database tables
npx prisma migrate dev --name init

# Seed the database with sample data (users, approval flows, etc.)
npx prisma db seed

# Start the backend server
npm run dev
Your backend API will be running at http://localhost:3001.

3. Frontend Setup
Open a new, separate terminal for the frontend.

Bash

# Navigate to the frontend folder from the root directory
cd frontend

# Install dependencies
npm install

# Start the frontend development server
npm run dev
Your frontend application will be available at http://localhost:5173.

Login Credentials
You can use the following accounts which are created by the seed script:

Admin / Finance:

Email: admin@innovate.corp

Password: Password123!

Manager / CFO:

Email: manager@innovate.corp

Password: Password123!

Employee:

Email: employee@innovate.corp

Password: Password123!

Demo Script (End-to-End Flow)
This script demonstrates the core functionality of the application by following a single expense report.

Act 1: The Admin - Create a User

Log in as the Admin (admin@innovate.corp).

On the dashboard, click the "Manage Users" link.

Fill out the form to create a new Employee account.

Note that the Admin has the power to set up the system.

Act 2: The Employee - Submit an Expense

Log out and log in as the newly created Employee.

You will see the "Submit an Expense" form.

Fill out the details (e.g., "Team Lunch", Amount: 200, Category: "Meals").

Drag and drop a sample receipt image onto the dropzone.

Click "Submit". An alert will confirm the submission.

Act 3: The Manager - Approve the Expense

Log out and log in as the Manager (manager@innovate.corp).

The dashboard will show the "Team Lunch" expense in the "Pending Approvals" list.

Review the details and click the "Approve" button.

The expense is approved and disappears from the pending list.
