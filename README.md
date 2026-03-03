# MR SUCCESS Crash Predictor

A real-time Crash Multiplier Predictor system with admin-managed access keys.

## Features

- **Authentication**: Login/Signup with simulated session management.
- **Role-Based Access**: 
  - Login with any email containing "admin" (e.g., `admin@test.com`) to access the **Admin Panel**.
  - Login with any other email for **User Dashboard**.
- **Crash Predictor**:
  - **Live Feed**: Simulated real-time crash multiplier.
  - **Prediction Engine**: Analyzes history to predict the next crash point.
  - **Access Control**: Users need an Access Key to view signals.
- **Admin Panel**:
  - View users.
  - Generate Access Keys.
  - Ban/Unban users.
- **Dev Tools**: Toggle the developer overlay (bottom right) to see internal logs.

## Getting Started

1. **Login**:
   - **User**: `user@test.com` / `password`
   - **Admin**: `admin@test.com` / `password`

2. **Dashboard**:
   - If you are a new user, you will see an "Access Restricted" screen.
   - Enter a valid key (e.g., `DEMO-KEY` or any key starting with `ACCESS-`).
   - Or, login as Admin, go to Admin Panel, generate a key for a user, and use that key.

3. **Get Signal**:
   - Click "GET SIGNAL" to run the prediction engine.
   - Watch the animated Circle Multiplier.

## Architecture

- **Frontend**: React + Tailwind CSS + Framer Motion
- **State Management**: React Context (Session) + Local Storage
- **Backend (Simulated)**: Firebase Client (Mock Mode enabled by default)
- **Engine**: Client-side prediction logic (Randomized for demo)

## Note

This is a **simulation** for demonstration purposes. It does not connect to a real casino API (which would require authorized credentials). The "Live Feed" is generated locally to demonstrate the UI and Engine flow.
