💬 Web Sockets Chat App

A real-time chat application built with React, Node.js, Socket.IO, and Prisma ORM.
Supports authentication, chat rooms, typing indicators, and light/dark theme switching.

🚀 Features

🔐 User authentication (JWT + cookies)
💬 Real-time messaging with Socket.IO
🏠 Chat rooms & room membership
👀 Typing indicator
🌗 Light / Dark mode
🎨 Tailwind CSS
🗄️ Prisma ORM with SQL database

📦 Tech Stack

Frontend

React + Vite
Zustand
Tailwind CSS
TypeScript

Backend

Node.js + Express
Socket.IO
Prisma
TypeScript

🛠️ Setup
1️⃣ Clone the repository

git clone https://github.com/Takis-Bezaitis/web-sockets-chat-app.git
cd web-sockets-chat-app

🔧 Backend Setup
cd backend
npm install

Create .env:

DATABASE_URL="your-database-url"
JWT_SECRET="your-secret"
FRONTEND_URL="http://localhost:5173"

Run Prisma migrations: npx prisma migrate dev
Start backend: npm run dev

🎨 Frontend Setup

cd ../frontend
npm install

Create .env: 
VITE_BACKEND_URL="http://localhost:5000"

Start frontend: npm run dev

▶️ Running the App

Frontend: http://localhost:5173
Backend: http://localhost:5000
