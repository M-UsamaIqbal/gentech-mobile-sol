# GenTech Marketplace — Technical Architecture

## 1. System Overview
- **Framework:** Next.js 16 (Turbopack, App Router, React 19)
- **Language:** TypeScript 5 (Strict Mode, verbatimModuleSyntax)
- **Database & Data Access:** PostgreSQL (Neon-compatible), Prisma ORM 7 with `@prisma/adapter-pg`
- **Authentication:** Better Auth with PostgreSQL session adapter and custom role extensions
- **Styling:** Tailwind CSS v4, shadcn/ui components, Framer Motion

## 2. Inward Dependency Architecture
```
┌─────────────────────────────────────────────────────────────┐
│  app/                  Routes, layouts, thin orchestration  │
│  components/           Design system & presentation UI      │
│  features/<slice>/     Vertical feature domains             │
│    ├── actions/        "use server" entry points            │
│    ├── components/     Feature-specific UI                  │
│    ├── schemas/        Shared client/server Zod schemas     │
│    ├── services/       Framework-agnostic business logic    │
│    └── repositories/   Data access (Prisma ONLY here)       │
├─────────────────────────────────────────────────────────────┤
│  lib/                  Infra singletons (auth, env, prisma) │
│  types/                Global shared TypeScript types       │
│  utils/                Pure utility helpers                 │
└─────────────────────────────────────────────────────────────┘
```

## 3. Data Flow & Security
1. **Request Flow:** User Interaction → Client Component → Server Action (`"use server"`) → Input Validation (`Zod`) → Session / Role Assertion (`requireAdmin()` or `getCurrentUser()`) → Domain Service → Repository (`prisma.<model>`) → Typed DTO return.
2. **Authorization Enforcement:** Server actions and route handlers strictly check permissions on the server.
3. **Money Integrity:** Decimal representation (`@db.Decimal(12, 2)`) avoids IEEE 754 floating point arithmetic errors.
4. **Resilience:** Soft-delete patterns (`deletedAt`) preserve referential history and auditability.

