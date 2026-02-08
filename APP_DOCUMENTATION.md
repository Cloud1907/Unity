# 🌌 Unity - Workforce Management System

Welcome to the official documentation for **Unity**, a premium, high-performance project and workforce management application designed for modern teams. This document provides a comprehensive overview of the application's features, technical architecture, and design philosophy.

---

## 🚀 Overview

Unity is built to streamline collaboration, task management, and productivity monitoring. It combines a sophisticated **React** frontend with a robust **.NET 8** backend to deliver a seamless, real-time user experience.

### Key Value Propositions:
- **Rich Aesthetics:** Glassmorphism, smooth transitions, and a curated color palette.
- **Real-time Collaboration:** Powered by SignalR for instant updates.
- **Cross-Platform:** Single codebase for Web (React) and Mobile (Capacitor/Android/iOS).
- **Comprehensive Management:** From high-level project analytics to granular task sub-items.

---

## 🎨 Design & User Experience

Unity follows a **"Modern Premium"** design language.
- **Typography:** Using high-quality sans-serif fonts for readability (Inter/Outfit).
- **Motion:** Powered by `framer-motion` for fluid page transitions and interactive hover states.
- **Components:** Built on top of **Radix UI** primitives for accessibility and reliability.
- **Themes:** Fully responsive and optimized for dark/light mode interactions.

---

## 📸 Page Gallery & Feature Documentation

### 1. Authentication
The login experience is designed to be clean and focused, ensuring security while maintaining the premium look.
![Login Page](/Users/cloudsmac/.gemini/antigravity/brain/2972a433-3533-49cb-b7b6-8e2fbed6fa5e/login_page_v2_1770038208889.png)

### 2. Personalized Dashboard
Upon login, users encounter a high-level summary of their productivity, including:
- **Weekly Progress Charts:** Visual tracking of task completion.
- **Status Cards:** Quick glance at Pending, In Progress, and Completed items.
- **Recent Activities:** A chronological feed of updates.
![Dashboard View](/Users/cloudsmac/.gemini/antigravity/brain/2972a433-3533-49cb-b7b6-8e2fbed6fa5e/dashboard_view_1770038233339.png)

### 3. Project & Task Management
The heart of Unity is its versatile project views.
- **Kanban Board:** Drag-and-drop workflow management.
- **List View:** Detailed grid with inline editing capabilities.
- **Progress Tracking:** Individual task progress bars and status indicators.
![Board View](/Users/cloudsmac/.gemini/antigravity/brain/2972a433-3533-49cb-b7b6-8e2fbed6fa5e/board_view_page_1770038296541.png)

### 4. Modern Task Modal
Clicking any task opens a deep-dive modal where users can:
- Manage **Subtasks** with ease.
- Set **Priority Levels** (Low, Mid, High, Urgent).
- Assign team members and add tags.
- View **Activity History** and attachments.
![Task Modal View](/Users/cloudsmac/.gemini/antigravity/brain/2972a433-3533-49cb-b7b6-8e2fbed6fa5e/task_modal_view_1770038469015.png)

---

## 💻 Technical Stack

### **Frontend**
- **Core:** React 18.3 (JavaScript)
- **State & Logic:** Custom Hooks + Context API
- **Styling:** Tailwind CSS + Radix UI
- **Animations:** Framer Motion
- **Charts:** Recharts
- **Communication:** Axios (REST) + @microsoft/signalr (WebSocket)
- **Mobile:** Capacitor

### **Backend**
- **Framework:** .NET 8 (C#)
- **Architecture:** Clean Architecture (Core, Infrastructure, API)
- **Database:** MS SQL Server (via EF Core)
- **Security:** JWT Authentication with dynamic key generation.
- **Real-time:** SignalR Hubs
- **File Generation:** QuestPDF for high-quality report exports.

---

## 🛠 Setup & Development

### Frontend Setup
1. Navigate to `/frontend`
2. Run `npm install`
3. Start development server: `npm start` (Runs on `localhost:3001` with proxy to `:8080`)

### Backend Setup
1. Navigate to `/dotnet-backend/Unity.API`
2. Ensure connection string is configured in `appsettings.json` or env var `UNITY_CONNECTION_STRING`.
3. Run `dotnet run --urls=http://localhost:8080`

---

## 📋 Ongoing Development & Standards
Refer to individual documentation files for specific standards:
- `ARCHITECTURE_STANDARDS.md`: Coding practices and patterns.
- `CHANGELOG.md`: Latest updates and versioning history.
- `contracts.md`: Detailed API documentation for integration.

---
*Created by AntiGravity AI Engine*
