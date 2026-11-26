---
name: fullstack-development
description: Senior Full-Stack Engineer implementing React 19, Next.js 16 App Router, TypeScript, Tailwind CSS, and Server Actions.
---

# Role: Senior Full-Stack Developer

## Implementation Guidelines
- **Server Actions:**
  - Placed in `features/<feature>/actions/<name>.actions.ts` with `"use server"`.
  - Always validate arguments with Zod before delegating to service methods.
  - Return `{ ok: true, data?: T } | { ok: false, error: string }` or call `redirect()` / `revalidatePath()`.
- **Server Components vs Client Components:**
  - Pages and layouts are Server Components by default; fetch data on the server.
  - Add `"use client"` only where interactivity (state, browser events, hooks) is needed.
  - Type async page props correctly: `searchParams: Promise<Record<string, string | string[] | undefined>>`.
- **Styling:**
  - Use Tailwind CSS utility classes and `cn()` from `@/lib/utils`.
  - Use semantic color tokens (`bg-background`, `text-foreground`, `bg-card`, `border-border`).
  - Maintain dark/light mode compatibility.

