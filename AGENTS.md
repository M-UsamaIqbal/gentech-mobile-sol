# GenTech Marketplace — Multi-Agent Directives & Capabilities

This file establishes multi-agent guidelines, boundaries, and autonomous instructions for AI agents working in this repository.

## 1. Prime Directives for Agents
1. **Autonomous Responsibility:** Do not stall waiting for instructions. Identify the next required task on the roadmap (`docs/PROJECT_ROADMAP.md`), develop it, verify it, test it, and update `docs/PROJECT_STATUS.md`.
2. **Inward Dependency Rule:**
   - Presentation: `app/` and `components/`
   - Orchestration & Slice UI: `features/<name>/actions/` and `features/<name>/components/`
   - Business Logic: `features/<name>/services/`
   - Data Access: `features/<name>/repositories/` (Prisma is permitted **only** here)
   - Infrastructure & Shared: `lib/`, `types/`, `utils/`
3. **Database Guardrails:**
   - Always run Prisma operations safely.
   - Never run destructive migrations on production databases without explicit instructions.
   - Use Decimal for monetary calculations.
4. **Testing Baseline:**
   - All tests must pass before ending a development session: `pnpm test`.
   - TypeScript must remain at zero errors: `pnpm typecheck`.
   - Next.js build must pass: `cross-env SKIP_ENV_VALIDATION=1 next build`.

## 2. Specialized Roles
When executing specific project functions, adopt the corresponding skill mindset located in `.agent/skills/`:
- `software-architect`: System structure, interfaces, scalability, boundaries.
- `business-analyst`: Mobile marketplace domain rules, Pakistani market specifics (PTA, CPID, offline dealers).
- `project-manager`: Scope control, roadmap execution, milestone delivery, status tracking.
- `fullstack-development`: React 19, Server Actions, shadcn/ui, type safety.
- `database-architect`: Prisma schema, relational integrity, indexing, migrations.
- `ui-ux-development`: Mobile-first responsive layouts, accessible forms, loading states.
- `qa-testing`: Vitest tests, unit testing domain logic, integration testing flows.
- `security-review`: Server-side authorization, input sanitation with Zod, role enforcement (`requireAdmin`).
- `devops-deployment`: Environment variables, build configuration, Vercel deployments.
- `autonomous-marketplace-qa-github-issues`: Marketplace QA discovery, GitHub deduplication, and labeled developer-handoff issues.
- `marketplace-board-meeting-review-and-actions`: Evidence-based board packs, risk/decision registers, minutes, and approved resolution handoff.
- `marketplace-investor-progress-and-demands`: Investor progress/diligence reviews and classified requirement handoff without fabricated traction.
- `autonomous-software-house-orchestrator`: Integrated QA, business R&D, delivery, security, board, investor, and operations governance without inventing approvals or duplicating GitHub work.

## 3. Design Skills
- `landing-page-design`: Load before choosing any landing-page section, headline, CTA, font, size, spacing, radius, background, icon, or transition.
- `figma-designer`: Load before any Figma MCP design/edit/review work (`use_figma` calls included).
- `design-prompt-generator-v2`: Use the 7 step framework when producing design specs or prompts for web UI work.
- All three are installed under `.agent/skills/`, `.agents/skills/`, and globally in `~/.config/opencode/skills/`. Source and update instructions: `docs/AI_DESIGN_SKILLS.md`.

