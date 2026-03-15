# Technical Documentation – Project Structure

# Index

1. [Overview](#1-overview)
2. [Folder Structure](#2-folder-structure)
3. [Architecture Guidelines](#3-architecture-guidelines)
   - [Two-layer Approach](#31-two-layer-approach)
   - [Feature Isolation](#32-feature-isolation)
   - [Shared Resources](#33-shared-resources)
4. [Development Guidelines](#4-development-guidelines)
5. [AI / Developer Guidance for External Components](#5-ai--developer-guidance-for-external-components)
   - [Context-aware Conversion](#51-context-aware-conversion-to-react-native)
   - [Rules for Automatic Folder Placement](#52-rules-for-automatic-folder-placement)
   - [Example Conversion Flow](#53-example-conversion-flow)
   - [Best Practices](#54-best-practices)
6. [Example Flow](#6-example-flow)
7. [Summary](#7-summary)

## 1. Overview

This project is organized to maximize **scalability** and **maintainability**, following a **two-layer architecture**:

1. **Application Layer (`src`)** – Contains business logic, shared modules, and feature-specific implementations.
2. **Routing Layer (`app`)** – Handles routing, layouts, and top-level app structure.

We separate **shared/common modules** (used across multiple features) from **feature-specific modules**. This ensures modularity and easy scaling when adding new features.

---

## 2. Folder Structure

```
app/
├── index.tsx          # Entry point for routing and app initialization
├── _layout.tsx        # Main layout wrapper
└── (feature routing)  # Route-level organization (can import from src/features)

src/
├── components         # Shared React components across the app
├── constants          # App-wide constants, enums, configuration
├── features           # Feature-specific modules
│   └── feature-a
│       ├── api        # Feature-specific API calls
│       ├── components # Components specific to this feature
│       ├── hooks      # Custom hooks for the feature
│       ├── keys       # Feature-specific keys (e.g., localStorage, query keys)
│       ├── screens    # Main screens/views for this feature
│       └── types      # Type definitions specific to this feature
├── hooks              # Shared hooks usable by any feature
├── services           # Shared services (e.g., HTTP clients, state utilities)
├── store              # Redux/Zustand stores or any global state management
└── types              # Shared type definitions and interfaces
```

---

## 3. Architecture Guidelines

### 3.1 Two-layer Approach

1. **Routing Layer (`app`)**
   - Responsible for **navigation**, route guards, and layout management.
   - Example: `_layout.tsx` wraps all feature screens with common UI elements like headers, sidebars, or modals.
   - Route definitions are kept here to decouple navigation from feature logic.

2. **Application Layer (`src`)**
   - Houses all **business logic**, components, and services.
   - Divided into:
     - **Shared modules** (`components`, `hooks`, `services`, `types`) – reusable across features.
     - **Feature modules** (`features/*`) – fully encapsulated per feature.

### 3.2 Feature Isolation

- Each feature has its own subfolder in `src/features/`.
- Recommended structure inside each feature:

  ```
  api/        → HTTP calls, GraphQL queries/mutations
  components/ → Feature-specific components
  hooks/      → Feature-specific hooks
  keys/       → Constants, storage keys, or query keys for the feature
  screens/    → Views or pages
  types/      → Types/interfaces used only within this feature
  ```

- **Benefit:** Easy to move, test, or remove a feature without touching others.

### 3.3 Shared Resources

- Place anything used across multiple features in `src` root:
  - `components/` – generic UI components (Button, Modal, Input)
  - `hooks/` – generic hooks (useFetch, useDebounce)
  - `services/` – API clients, auth services
  - `store/` – global state (Redux, Zustand, Jotai)
  - `types/` – global type definitions

---

## 4. Development Guidelines

- **Adding a new feature:**
  1. Create a folder `src/features/x`. (e.g, src/features/user)
  2. Add `screens/`, `components/`, `hooks/`, `api/`, `keys/`, and `types/`.
  3. Connect routes in `app/index.tsx` or `_layout.tsx`.

- **Reusable code:** Always try to place in `src/components` or `src/hooks` first before creating duplicates in features.
- **Naming conventions:**
  - Files: `camelCase` for hooks/components, `PascalCase` for React components/screens.
  - Types: `PascalCase` with `Type` suffix (e.g., `UserType`).

- **Scalability tips:**
  - Keep feature modules **self-contained**.
  - Shared utilities should **not depend on features**.
  - Avoid circular dependencies between features and shared modules.

---

## 5. AI / Developer Guidance for External Components

When integrating external components (e.g., copying a component from `lovable` or other sources):

### 5.1 Context-aware Conversion to React Native

- **Goal:** Automatically understand where the component fits in the project’s folder structure:
  - Reusable UI → `src/components` (shared across features)
  - Feature-specific UI → `src/features/<feature>/components`
  - Screen-level layout → `src/features/<feature>/screens`

- **Prompting AI:** Provide both:
  1. **The external component code**.
  2. **Context overview of the folder structure**.

**Example Prompt Structure:**

```text
Convert the following component to React Native, respecting our project folder structure:

[FOLDER STRUCTURE OVERVIEW]
app/
  index.tsx
  _layout.tsx
src/
  components/
  features/
    feature-a/
      components/
      screens/
  hooks/
  services/
  store/
  types/

[EXTERNAL COMPONENT CODE]
<PASTE COMPONENT CODE HERE>

Guidelines:
- Split reusable parts into components.
- Place feature-specific components in the respective feature folder.
- Place screen-level layout in `screens`.
- Ensure imports follow our folder structure.
```

### 5.2 Rules for Automatic Folder Placement

1. **Check for reuse potential:**
   - If the component is likely to appear in multiple features → place in `src/components`.
   - If used only in a specific feature → `src/features/<feature>/components`.

2. **Screen vs. component:**
   - Layouts combining multiple components → `screens`.
   - Individual UI blocks → `components`.

3. **Props / types:**
   - Define reusable types in `src/types` if generic.
   - Define feature-specific types in `src/features/<feature>/types`.

4. **Hooks / logic:**
   - Custom hooks for this component → feature hooks.
   - Shared hooks → `src/hooks`.

### 5.3 Example Conversion Flow

Suppose you paste an external component:

1. **Identify UI blocks:** Button, Card, List → candidate for components.
2. **Identify screen-level container:** `HomePage` or `MainView` → goes into `screens`.
3. **Generate React Native version**:
   - Replace `div`/`span` → `View`/`Text`.
   - Convert CSS → `StyleSheet`.

4. **Place imports correctly** according to the folder structure.
5. **Update type definitions** as needed in `types` folders.

**Example Folder Placement After Conversion:**

```
src/
├── components/
│   └── LovableButton.tsx          # reused across features
├── features/
│   └── feature-a/
│       ├── components/
│       │   └── FeatureCard.tsx   # used only in this feature
│       └── screens/
│           └── Home.tsx          # screen layout combining multiple components
```

---

### 5.4 Best Practices

- Always **analyze for reuse** before adding to shared components.
- Maintain **feature isolation**: screens should only import components from:
  1. The same feature’s `components/` folder.
  2. `src/components` (shared reusable).

- For AI-assisted conversion:
  - Always provide **folder structure context**.
  - Indicate **feature target** if applicable.
  - Prompt to **split code** correctly between `screens`, `components`, `hooks`, `types`.

---

## 6. Example Flow

```
User navigates -> app/index.tsx -> _layout.tsx -> feature-a/screens/Home.tsx
       |                                  |
       |                                  -> imports shared components from src/components
       -> fetches data via src/features/feature-a/api -> optionally uses src/services/httpClient
```

---

## 7. Summary

- **Two-layer architecture**: `app` for routing, `src` for application logic.
- **Feature modularity** ensures independent development and testing.
- **Shared modules** reduce duplication and improve maintainability.
- **Scalable by design** – adding new features or global utilities is straightforward.
