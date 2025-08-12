# Eco Delivery Simulator

## Project Overview

Eco Delivery Simulator is a full-stack web application for simulating and optimizing delivery logistics. It helps analyze driver fatigue, route efficiency, and profit, allowing users to manage drivers, routes, and orders, and run delivery simulations to evaluate KPIs and operational outcomes.

---

## Tech Stack

**Backend:**
- Node.js
- Express
- Prisma ORM
- PostgreSQL
- JWT (jsonwebtoken)
- bcryptjs
- dotenv
- cors
- cookie-parser

**Frontend:**
- React (TypeScript)
- Vite
- Tailwind CSS
- Radix UI
- TanStack React Query
- Zod
- React Router DOM
- Recharts
- Framer Motion

---

## Setup Instructions

### Prerequisites
- Node.js (v18+ recommended)
- PostgreSQL database

### Backend Setup

1. Install dependencies:
   ```bash
   cd backend
   npm install
   ```
2. Configure environment variables:
   - Copy `backend/.env.example` to `.env` and fill in your values.
3. Run database migrations:
   ```bash
   npx prisma migrate deploy
   ```
4. Start the backend server:
   ```bash
   node server/authServer.js
   ```
   The API will run on `http://localhost:4000`.

### Frontend Setup

1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
2. Configure environment variables:
   - Copy `frontend/.env.example` to `.env` and set the API URL if needed.
3. Start the frontend:
   ```bash
   npm run dev
   ```
   The app will run on `http://localhost:5173` (default Vite port).

---

## Environment Variables

### Backend (`backend/.env`)
- `PORT` — API server port
- `DATABASE_URL` — PostgreSQL connection string
- `JWT_SECRET` — JWT signing key
- `JWT_EXPIRES_IN` — JWT expiration (e.g., 24h)
- `ALLOWED_ORIGINS` — CORS allowed origins

### Frontend (`frontend/.env`)
- `VITE_API_URL` — Backend API base URL

---

## Deployment Instructions

1. Provision a PostgreSQL database (e.g., Railway, Heroku, Supabase).
2. Set environment variables on your deployment platform.
3. Deploy backend (Node.js) to your chosen platform (e.g., Railway, Heroku).
4. Deploy frontend (Vite/React) to a static hosting service (e.g., Vercel, Netlify).
5. Ensure both services are configured to communicate via the correct API URL.

---

## API Documentation

### Drivers

- `GET /drivers`  
  Returns all drivers.
  ```json
  [ { "id": 1, "name": "John", ... } ]
  ```

- `POST /drivers`  
  Create a driver.
  ```json
  { "name": "John", "shiftHours": 8, "workHours7d": [8,8,8,8,8,8,8] }
  ```

- `PUT /drivers/:id`  
  Update a driver.

- `DELETE /drivers/:id`  
  Delete a driver.

### Routes

- `GET /routes`  
  Returns all routes.

- `POST /routes`  
  Create a route.
  ```json
  { "routeId": "R1", "name": "Downtown", "distance": 12, "traffic": "High", "baseTime": 60 }
  ```

- `PUT /routes/:id`  
  Update a route.

- `DELETE /routes/:id`  
  Delete a route.

### Orders

- `GET /orders`  
  Returns all orders.

- `POST /orders`  
  Create an order.
  ```json
  { "orderId": "O1", "valueRs": 1200, "routeId": "R1", "deliveryTimestamp": "2025-08-12T10:00:00Z", "assignedDriverId": 1, "status": "Pending" }
  ```

- `PUT /orders/:id`  
  Update an order.

- `DELETE /orders/:id`  
  Delete an order.

### Simulation

- `POST /simulate`  
  Run delivery simulation.
  ```json
  { "drivers": 5, "startTime": "08:00", "maxHoursPerDay": 8 }
  ```
  **Response:**
  ```json
  {
    "totalProfit": 5000,
    "efficiencyScore": 92,
    "onTimeDeliveries": 45,
    "totalDeliveries": 50,
    "orderResults": [ ... ]
  }
  ```

### Simulation History

- `POST /simulation-history`  
  Save simulation result.

- `GET /simulation-history?userId=123`  
  Get simulation history for a user.

---

For more details, see [`backend/server/apiServer.js`](backend/server/apiServer.js:1) and [`frontend/src`](frontend/src:1).
