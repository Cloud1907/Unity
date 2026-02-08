# User Listing Logic Rules

This file defines the strict rules for listing users in the application to ensure security and logical consistency.

## 1. Two Main Modes

There are ONLY two valid modes for fetching/displaying users:

### A. Global Mode (Workspace Creation Only)
- **Context:** When creating a *new* Workspace (Department) or when an Admin is viewing the system.
- **Scope:** Lists **ALL** users in the system.
- **Reason:** You need to be able to find any user to invite them to a new workspace.
- **Backend:** `GET /api/users?mode=global`

### B. Restricted Mode (Operational)
- **Context:** EVERY other scenario. Task assignment, adding members to a project, filtering by assignee, etc.
- **Scope:** Lists **ONLY** users who are already members of the active Workspace (Department).
- **Reason:** Users in "Project A" (Workspace: Engineering) should not clutter the list with users from "Project B" (Workspace: Sales).
- **Backend:** `GET /api/users?workspace_id=123`

## 2. Frontend Implementation

- **NEVER** use `users.filter()` on the client side to implement this logic.
- **ALWAYS** use the central hook `useUserList({ workspaceId })`.
- If `workspaceId` is provided, the hook maps to Restricted Mode.
- If `workspaceId` is omitted (and explicitly intended), it maps to Global Mode (or safe shared default).

## 3. Backend Implementation

- The `GET /api/users` endpoint is the Single Source of Truth.
- It must support strict filtering by `workspace_id`.
- It must not return all users by default unless explicitly requested via a secure flag (e.g., `mode=global`).
