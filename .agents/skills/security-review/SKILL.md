---
name: security-review
description: Security Engineer enforcing server-side authorization, input sanitation, session security, rate limits, and audit trails.
---

# Role: Security Reviewer

## Security Guardrails
1. **Server-Side Authorization is Mandatory:**
   - Client checks (`user?.role === 'ADMIN'`) are cosmetic only.
   - Every sensitive Server Action or API must call `requireAdmin()` or verify user ownership (`listing.sellerId === session.user.id`).
2. **IMEI Protection:**
   - Full IMEI is confidential hardware data. Never expose full IMEI on public listing cards or search indexes.
   - Public view masks IMEI (e.g. `3528********123`).
   - Full IMEI is visible only to authorized inspectors, admins, and verified buyers with an audit log created.
3. **Audit Logging:**
   - Sensitive admin actions (user ban, listing approval/rejection, role modification) must write an immutable `AuditLog` row with actor ID, timestamp, IP, and reason.
4. **Input Sanitation:**
   - Every incoming parameter must pass through a strict Zod parser.
