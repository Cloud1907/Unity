# Unity Project Context Memory

> **System Role**: This document serves as the "Core Memory" for AI agents working on the Unity project. It contains architectural decisions, technological constraints, business goals, and historical context.

## 1. Project Identity & Purpose
- **Name**: Unity Enterprise
- **Core Purpose**: Enterprise Project Management & Collaboration Platform.
- **Strategic Goals**:
    1.  **Odak Kaybını Engellemek**: Prevent focus loss by centralizing all projects/tasks.
    2.  **Şeffaflık (Transparency)**: Real-time visibility into who is working on what (Kanban/List).
    3.  **Verimlilik Analizi (Efficiency)**: Detecting bottlenecks through analytics and reports.
    4.  **Hız ve Mobilite**: Seamless data flow across Web and Mobile.

## 2. Technology Stack
### Backend
- **Framework**: .NET 10.0 (Preview) / .NET Core 8
- **Language**: C#
- **Database**: MS SQL Server (via EF Core)
- **Key Features**: SignalR (Real-time), QuestPDF (Reporting), JWT (Security)

### Frontend
- **Framework**: React 18.3
- **Styling**: TailwindCSS + Radix UI Primitives
- **Animations**: Framer Motion
- **Mobile**: Capacitor (iOS/Android)
- **Communication**: Axios + SignalR

## 3. Architecture & Standards (Unity Constitution)
### Database & Data Modeling
- **Zero Tolerance for MongoDB**: Strictly relational SQL model.
- **Strict IDs**: All entities MUST use integer `id` (or `Id`). String-based `_id` is **BANNED**.
- **DTO-First**: API Controllers must use DTOs for data input/output.

### Frontend Principles
- **Skeleton Screens**: Use Skeletons over full-screen spinners.
- **Aggressive Memoization**: `React.memo` on leaf components.
- **Optimistic UI**: Immediate UI updates with undo/rollback on failure.
- **Typography Rules**: 
  - ❌ NO Full Uppercase (UPPERCASE).
  - ✅ Use Title Case or Sentence Case.
- **Error Handling**: API calls within `try-catch` with meaningful Turkish error messages.

## 4. Consultation & Strategic Behavior
- **Proactive Feedback**: If a requested feature contradicts the "Strategic Goals" or "Architecture Standards", the AI should suggest a better alternative.
- **Global Standards**: AI is encouraged to compare Unity features with global SaaS standards (Asana, Monday, Jira) and suggest UX/UI improvements (e.g., "Global programs do it like this...").
- **User Consultation**: If a change has high impact or ambiguity, the AI must ask for clarification instead of making assumptions.
- **Refactoring Advice**: AI should look for opportunities to simplify code according to the "Modern Premium" design language.

## 5. Development & Testing Workflow
- **Ports**: Frontend (3000), Backend (8080).
- **Testing**: 
    - Account: `melih.bulut@univera.com.tr` / `test123`
    - Project: "Test Project Final 3" workspace.
- **Workflow**: Terminal-first TDD.

## 6. Project Hierarchy & Logic
- **Hierarchy**: Workspace (Çalışma Alanı) -> Project (Proje) -> Task (Görev) -> Subtask (Alt Görev).
- **Views**: Kanban Board (Drag-and-Drop) and List View (Inline Editing).

## 7. Recent History
- **Current State**: Transitioned fully to SQL-based architecture ("The Clean Sealing"). 
- **Last Refactors**: Magic Link stability, Notification system, and Dark Mode polish.
