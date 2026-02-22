<div align="center">
  <h1>⚡ Campus Canteen Food Hub ⚡</h1>
  <p>
    <img src="https://img.shields.io/badge/Angular-v17+-dd0031?style=for-the-badge&logo=angular" alt="Angular">
    <img src="https://img.shields.io/badge/TypeScript-v5.0-blue?style=for-the-badge&logo=typescript" alt="TypeScript">
    <img src="https://img.shields.io/badge/Node.js-v18+-green?style=for-the-badge&logo=node.js" alt="Node.js">
    <img src="https://img.shields.io/badge/MongoDB-v6.0-green?style=for-the-badge&logo=mongodb" alt="MongoDB">
  </p>
  <p><i>A unified, type-safe digital ecosystem for campus dining.</i></p>
</div>

---

## 📖 Project Overview

**Campus Canteen** is a full-stack web application designed to digitize university dining. It streamlines the ordering process, manages transactions via a secure digital wallet, and provides a robust admin interface for canteen staff.

### Key Features
*   **Digital Wallet**: Rechargeable student wallets for cashless transactions.
*   **Smart Notifications**: Real-time updates for order status and balance changes.
*   **Role-Based Access**: Distinct portals for Students (User) and Staff (Admin).
*   **Optimized Performance**: Built with Angular Signals and Standalone components for high speed.

---
## 🛠 Technology Stack

This project leverages the **MEAN Stack** (MongoDB, Express, Angular, Node.js) fully written in **TypeScript** to ensure end-to-end type safety and maintainability.

### Frontend (UI & UX)
* **Angular v17+**: Utilizes **Signals** for reactive state management and **Standalone Components** for high performance.
* **Architecture**: Component-based UI logic with dedicated services for Auth, Cart, and Orders.
* **Styling**: A combination of Bootstrap’s utility classes and custom component-scoped CSS to ensure a polished user experience.

### Backend (Logic & API)
* **Node.js & Express**: RESTful API built with an MVC pattern for clear separation of concerns.
* **Mongoose**: Provides schema-based modeling for Users, Food, and Orders.
* **Security**: Implements JWT authentication, Helmet security headers, and CORS protection.

---

## 🚀 Quick Start (One-Command Run)

We have simplified the ecosystem setup. You can install all dependencies and start the entire stack (Server + User Portal + Admin Portal) with a single command.

### 📋 Prerequisites
* **Node.js**: v18.0.0 or higher
* **MongoDB**: A running instance (Local or MongoDB Atlas)
* **Git**: For cloning the repository

### 🛠️ Setup & Run
1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/Sowndhar-2005/TS-MEAN-Stack.git
    cd TS-MEAN-Stack
    ```

2.  **Install & Start Everything**:
    This command automatically triggers `npm install` recursively across the root, server, and both client folders before launching the servers concurrently.
    ```bash
    npm run start-all
    ```

---

## 💾 MongoDB Configuration

The system uses MongoDB to store all user, food, and transaction data. To connect the application, you must configure the backend environment:

1.  **Database Connection**:
    * **Local**: Install [MongoDB Community Server](https://www.mongodb.com/try/download/community). The app defaults to `mongodb://localhost:27017/campus-canteen`.
    * **Cloud**: Create a cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and obtain your connection string.
2.  **Environment Setup**:
    * Navigate to the `server/` directory.
    * Create a `.env` file and add your credentials:
        ```env
        PORT=3000
        MONGODB_URI=your_mongodb_connection_string
        JWT_SECRET=your_super_secret_key
        ```

---

## 📥 Installation Guide (For New Clones)

When cloning this project for the first time, all necessary Node.js packages must be installed.

### Option 1: Automatic (Recommended)
Running `npm run start-all` from the root directory handles the installation for all sub-projects automatically.

### Option 2: Manual Installation
If you prefer to set up components individually, run `npm install` in each directory:
1.  **Root Directory**: `npm install` (Installs concurrency tools)
2.  **Backend Server**: `cd server && npm install`
3.  **User Portal**: `cd client-user && npm install`
4.  **Admin Portal**: `cd client-admin && npm install`

---

## 🔐 Access Control & Security

### Strict College-Only Login
To ensure a secure environment, this application does not allow open public registration:
* **Admin-Pre-Registration**: Access is granted only to students whose information is already present in the student directory managed by the Admin.
* **Login Restriction**: If a student's email and details are not found in the verified campus database, the system will block the login attempt. This effectively prevents non-college students from accessing the hub.

### 🔑 Demo Credentials
* **Admin Access**: `admin@gamil.com` / `admin123`
* **User Access**: `john@gmail.com` / `21CSR001`

## 🔧 Technical Configuration Guide

This project is built using a robust TypeScript environment. Follow these steps to set up the backend:

1.  **Initialization**:
    ```bash
    npm init -y
    ```

2.  **Dependencies**:
    Install the necessary packages and dev-dependencies:
    ```bash
    npm install express mongoose dotenv cors helmet morgan
    npm install --save-dev typescript @types/node @types/express @types/cors @types/morgan ts-node nodemon
    ```

3.  **TypeScript Configuration**:
    Generate `tsconfig.json`:
    ```bash
    npx tsc --init
    ```
    Ensure your `tsconfig.json` targets ES2020 or later and has `outDir` set to `./dist`.

4.  **Scripts**:
    Add the following to your `package.json` scripts:
    ```json
    "scripts": {
      "start": "node dist/server.js",
      "dev": "nodemon --exec ts-node src/server.ts",
      "build": "tsc"
    }
    ```

### 📂 Folder Structure Breakdown

The project follows a standard MEAN stack architecture with a clear separation of concerns.

#### **Frontend**
The frontend is divided into two distinct Angular applications:
*   **`client-user/` (Student Portal)**: The main interface for students to browse menus, add items to cart, and track orders. (Default Port: 4200)
*   **`client-admin/` (Staff Portal)**: The administrative dashboard for canteen staff to manage menu items, view active orders, and update order statuses. (Port: 4201)

#### **Backend**
The `server/src/` directory is organized using the MVC pattern:
*   **`controllers/`**: Handles incoming requests and business logic (e.g., `orderController.ts`).
*   **`models/`**: Mongoose schemas and interfaces defining data structure (e.g., `User.ts`).
*   **`routes/`**: Express route definitions mapping URLs to controllers.
*   **`middleware/`**: Custom middleware for authentication (`auth.ts`) and error handling.
*   **`utils/`**: Helper functions for logic (`logicHelpers.ts`).
*   **`seed/`**: Database seeding scripts.

---

## 📱 Detailed Screen & Security Guide

### 🔐 Access Control (Strict College-Only Login)
To ensure the security of the campus ecosystem, this application does not allow open registration:
* **Admin-Controlled Entry**: Only students whose information is pre-loaded into the database by the Admin can log in.
* **Authentication Check**: If a student's email is not found in the verified campus list, access is denied. This prevents non-college students from using the system.

---

### 🎓 User Portal (Student Interface)
1.  **Home (Menu)**: Browse the digital menu with advanced search and tag-based filtering. 
    ![Home Menu](photo/menu_screen.png)
2.  **Cart**: Review items and manage quantities before placing an order.
    ![Cart Screen](photo/cart_screen.png)
3.  **Active Orders**: View real-time progress. The system tracks the order from "Pending" to "Ready".
    ![Active Orders](photo/Order-Screen.png)
4.  **Profile & Stats**:
    * **Activity History**: A detailed log of all orders and wallet transactions.
    * **User Stats**: Insights into total orders placed and total money spent.
    ![Profile Stats](photo/profile_screen.png)
5.  **Notifications**: Real-time alerts for order readiness or wallet balance changes, accessible via the navbar bell icon.
6.  **Invite Page**: A dedicated screen for the "Collaborative Ordering" feature to facilitate group meals.

---

### 🛠️ Admin Portal (Staff Interface)
1.  **Dashboard**: Metrics-driven view of canteen performance, including total revenue and order volume.
2.  **User Management**: 
    * **Directory**: Search and view the list of authorized students.
    * **Wallet Actions**: Manually **Add Funds** for cash recharges or apply a **Penalty** (Reduce Funds).
3.  **Order Management**: Centralized hub to manage the kitchen workflow by updating order statuses (e.g., mark as Cooking or Completed).

---

## 🚧 Future Improvements (Roadmap)

To further enhance the Campus Canteen experience, the following features are planned:
1.  **UPI Integration**: Fully implement real UPI payment gateway for balance recharge.
2.  **Collaborative Ordering**: "Invite Friend" feature to share a cart and split the bill.
3.  **Enhanced Inventory**: Admin system to manage "Food Quantity" (Daily Stock) dynamically.
4.  **Menu System 2.0**: Advanced scheduling (Breakfast/Lunch/Dinner specific menus).
5.  **Profile Avatars**: Allow users to upload custom profile pictures.

---

<div align="center">
  <small>© 2026 Campus Canteen Project. All rights reserved.</small>
</div>
