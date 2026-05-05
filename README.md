# 💬 Real-Time Chat & Video App

A full-stack real-time communication platform built with **React, Node.js, Socket.IO, and WebRTC**.

Supports chat rooms, private messaging, live typing indicators, and **peer-to-peer video calls**.

---

## 🚀 Features

* 🔐 **Authentication** (JWT + HTTP-only cookies)
* 💬 **Real-time messaging** with Socket.IO
* 📡 **WebRTC video calls** (1-on-1)
* 🏠 **Public & private chat rooms**
* 👥 **Room membership & invitations**
* 👀 **Typing indicators**
* 🟢 **User presence (online/offline)**
* ♾️ **Infinite scroll with cursor pagination**
* ⚡ **Redis caching for performance**
* 🌗 **Light / Dark mode**
* 🎨 **Responsive UI (Tailwind CSS)**

---

## 📦 Tech Stack

### Frontend

* React + Vite
* TypeScript
* Zustand (state management)
* Tailwind CSS

### Backend

* Node.js + Express
* Socket.IO (real-time communication)
* WebRTC (video calls)
* Prisma ORM
* PostgreSQL (Neon)
* Redis (caching & presence)

---

## ⚙️ Architecture Highlights

* Real-time updates via WebSockets
* Optimistic UI updates for messages
* Cursor-based pagination for scalability
* Redis caching layer with invalidation strategy
* Room-based state management (Zustand)
* Separation of concerns between REST and sockets

---

## ⚠️ Notes

* The backend is hosted on a free tier and may take a few seconds to wake up after inactivity.

---

## 🌐 Live Demo

👉 (Add your Render link here)

---
