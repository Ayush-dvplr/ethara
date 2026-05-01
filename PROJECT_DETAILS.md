# Ethara - Project Management App

## Project Overview
Ethara is a full-stack project management application featuring a modern React frontend and a robust Express/Node.js backend. The application helps users manage projects, track tasks, and collaborate effectively. 

**Features include:**
- User Authentication (Login & Register)
- Role-based Access Control (e.g., Admin-only views like the Users page)
- Dashboard for a quick overview of activities
- Project Management (Create, view, and manage projects)
- Task Tracking (Assign, update, and track tasks within projects)

**Tech Stack:**
- **Frontend:** React, Vite, Tailwind CSS, React Router, Lucide React (for icons)
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (via Mongoose)
- **Authentication / Integrations:** JWT (JSON Web Tokens) & Firebase (Client SDK + Admin SDK)

---

## Environment Variables (.env)

The project requires two separate `.env` files—one for the frontend (`client`) and one for the backend (`server`).

### 1. Backend Environment Variables
**Location:** `server/.env`

Create a `.env` file in the `server` directory. You can use `server/.env.example` as a template:

```env
# Server Port
PORT=5000

# MongoDB Connection String (Local or MongoDB Atlas)
MONGO_URI=mongodb://localhost:27017/ethara

# JWT Secret for Auth Token generation (use a secure random string)
JWT_SECRET=your_super_secret_jwt_key_here

# Firebase Admin SDK credentials
# Obtain these from Firebase Console > Project Settings > Service Accounts > Generate new private key
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour_private_key_here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
```

### 2. Frontend Environment Variables
**Location:** `client/.env`

Create a `.env` file in the `client` directory. You can use `client/.env.example` as a template:

```env
# Backend API URL
VITE_API_URL=http://localhost:5000/api

# Firebase Configuration
# Obtain these from Firebase Console > Project Settings > Your apps > Web app > SDK setup
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

---

## How to Run the Project

### Prerequisites
- [Node.js](https://nodejs.org/) installed
- [MongoDB](https://www.mongodb.com/) installed and running locally, or a MongoDB Atlas URI
- A [Firebase](https://firebase.google.com/) Project to acquire the Client and Admin credentials

### 1. Install Dependencies

Open your terminal and run the following commands to install dependencies for both the server and the client:

**For the Backend (Server):**
```bash
cd server
npm install
```

**For the Frontend (Client):**
```bash
cd ../client
npm install
```

### 2. Running the Application

You will need to run the client and the server simultaneously in two separate terminal windows.

**Start the Backend Server:**
Open a terminal, navigate to the `server` directory, and start the development server:
```bash
cd server
npm run dev
```
*The backend server will run on `http://localhost:5000`.*

**Start the Frontend Client:**
Open a new terminal, navigate to the `client` directory, and start the Vite development server:
```bash
cd client
npm run dev
```
*The client will be accessible at `http://localhost:5173` (or the port specified by Vite).*

---

## Live Demo & Credentials

The website is currently hosted at: **[https://ethara-ayush.netlify.app/](https://ethara-ayush.netlify.app/)**

You can use the following credentials to log in and test the application:

**Admin Access**
- **Email:** `ayush@ethara.com`
- **Password:** `Ayush@123`

**Member Access**
- **Email:** `member@ethara.com`
- **Password:** `Ayush@123`

---

## Project Structure Overview
- **/client**: Contains the React + Vite frontend application.
  - `src/pages`: Main application views (`Dashboard`, `Login`, `Projects`, `Tasks`, `Users`).
  - `src/components`: Reusable UI components and Layouts.
  - `src/context`: React Context for state management (`AuthContext`).
- **/server**: Contains the Node.js / Express backend.
  - `routes/`: API endpoint definitions (`auth`, `users`, `projects`, `tasks`).
  - `controllers/`: Core logic for handling incoming requests.
  - `models/`: Mongoose database schemas (e.g., User, Project, Task).
  - `config/`: Configurations for MongoDB and Firebase.
