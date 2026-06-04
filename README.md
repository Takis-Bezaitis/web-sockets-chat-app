# 💬 Real-Time Chat & Video App

A full-stack real-time communication platform built with **React, Node.js, Socket.IO, and WebRTC**.

Supports chat rooms, private messaging, live typing indicators, and **peer-to-peer video calls**.

---

## 🚀 Features

* 🔐 **Authentication** (Bearer access tokens stored in memory via Zustand, refresh tokens stored in        
  HTTP-only cookies)
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

* The backend is hosted on a free tier and may take 20–30 seconds to wake up after inactivity (cold start). If the app takes time to load initially, this is expected behavior.

* Mobile devices are optimized for portrait orientation.

* Safari / iOS behavior: the app works on Safari, but due to modern privacy protections (ITP), cross-subdomain cookie handling may be restricted. This can affect refresh-token persistence after page reload in some cases. The app works as expected in Chromium-based browsers, and a future improvement would be deploying under a single domain or custom domain to fully eliminate this limitation.

---

## 🌐 Live Demo

👉 https://web-sockets-chat-app-1.onrender.com

---
