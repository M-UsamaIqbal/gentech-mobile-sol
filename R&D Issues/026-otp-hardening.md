# [P2][Authentication][Research] Harden or retire the simulated OTP subsystem before production use

**Labels:** investigation, security, devops

## Opportunity / problem
OTP is explicitly simulated: in-memory Map, `Math.random()`, console-logged code, no shared store, no send/verify throttling, and codes are not deleted after success. Serverless impact is Unverified, but implementation hygiene gaps are code-confirmed.

## Evidence from the existing code
- `lib/otp.ts:1-14,39-45,72-73,97-113` â€” simulated implementation, in-memory store, random code, log leakage, no consume-on-success.
- `app/api/otp/send/route.ts:5-19,28-30` â€” no visible auth/schema/rate limit; dev code return.
- `app/api/otp/verify/route.ts:5-19` â€” no visible throttling.
- `docs/PROGRESS_CHECKLIST.md:113` â€” needs serverless runtime verification before being called a defect.
- Confidence: High for code hygiene; runtime impact Unverified.

## Business rationale
- Affected users: customers/sellers using phone verification.
- Affected markets: BH and PK.
- Business impact: account takeover risk, code leakage, abuse.
- Why this matters now: OTP may be assumed production-ready because endpoints exist.

## Proposed outcome
OTP is either explicitly development-only or backed by a production-safe provider/store.

## Recommended solution
Decide product intent; if production, use cryptographic randomness, shared TTL store, consume-on-success, send/verify rate limits, provider integration and no code logging; if not, gate routes behind dev flags and remove from production surface.

## MVP scope
- In scope: decision, gating, secure primitives and throttling.
- Out of scope: SMS provider procurement.

## Multi-region considerations
- Phone formats differ by BH/PK; reuse existing validation.
- Compliance: phone number retention needs #20.

## Acceptance criteria
- [ ] Production either fails closed or uses secure OTP.
- [ ] Codes are never logged.
- [ ] Codes are consumed on success and expire.
- [ ] Send/verify are rate-limited.
- [ ] Tests cover replay, expiry and throttling.

## Success measurement
- Metric: no insecure OTP path reachable in production configuration.

## Dependencies and risks
- Needs product/provider decision; risk: serverless in-memory behaviour Unverified.

## Estimate
M â€” decision, storage, routes and tests.

## Research and references
- Needs runtime/serverless verification and SMS provider facts; no external research performed.

## Product decision
Research required.
