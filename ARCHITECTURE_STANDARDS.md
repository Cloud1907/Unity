# Unity Enterprise - Architecture Standards Manifesto

> **Status**: Sealed
> **Last Update**: 2026-01-31
> **Enforcement**: Mandatory

## 1. Core Philosophy: The Clean Sealing
This project maintains a **Zero Tolerance Policy** for legacy MongoDB artifacts. The system is strictly strict-typed, SQL-based, and DTO-driven. Any violation of these standards will cause build failures or runtime exceptions.

## 2. Universal integrity Rules

### 2.1. Strict Integer IDs
*   **Rule**: All entities MUST be identified by a numeric `id` (or PascalCase `Id` in C#).
*   **Ban**: The usage of `_id`, string-based IDs, or hybrid IDs is **STRICTLY PROHIBITED**.
*   **Enforcement**: Frontend `entityHelpers.js` will THROW an error if an entity without a valid ID is processed.

### 2.2. No "Zombie" Data
*   **Rule**: Relational integrity is paramount. No child entity (Task, Subtask) may exist without a valid parent linkage.
*   **Ban**: `TaskId` or `SubtaskId` cannot be NULL in linkage tables (e.g., `TaskAssignees`).
*   **Enforcement**: Database Constraints (Foreign Keys, Check Constraints).

## 3. Backend Standards (.NET)

### 3.1. DTO-First Policy
*   **Rule**: Controllers MUST NEVER bind directly to Entity Models (e.g., `TaskItem`, `Project`) in `POST` or `PUT` methods.
*   **Requirement**: Explicit DTOs (e.g., `TaskCreateDto`, `TaskUpdateDto`) must be used for all state-changing operations.
*   **Reasoning**: Prevents Mass Assignment (Over-posting) attacks and enforces strictly typed validation.

### 3.2. Explicit Mapping
*   **Rule**: DTO to Entity mapping must be explicit or handled by a trusted mapper.
*   **Ban**: Implicit usage of `JsonElement` or dynamic object binding.

## 4. Frontend Standards (React)

### 4.1. The "_id" Ban
*   **Rule**: No component, hook, or utility may reference `_id`.
*   **Enforcement**: ESLint `no-restricted-syntax` rule is active.

### 4.2. Strict Normalization
*   **Rule**: All API responses must pass through `normalizeEntity`.
*   **Behavior**: Logic must fail fast (throw exception) if data integrity is compromised (missing ID).

---
*This document serves as the immutable constitution of the UniTask Enterprise codebase. Changes to these standards require a full architectural review.*
