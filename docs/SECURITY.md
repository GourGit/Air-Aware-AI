# Security & Privacy Policy

## 1. Authentication & Session Management
- **Password Security**: Passwords are never stored in plaintext. Passlib with `bcrypt` (work factor 12) is used for hashing.
- **JWT Architecture**:
  - Access Token: Short-lived (30 minutes), signed with `HS256`, containing only public user claims (`sub`, `email`, `role`).
  - Refresh Token: Long-lived (7 days), stored in the database in hashed form (`SHA-256`), rotatable, with explicit revocation on logout.
- **Secure Cookies / Headers**: Tokens delivered via standard `Authorization: Bearer <token>` or HTTP-only, SameSite=Strict cookies in production.

## 2. Authorization & Role-Based Access Control (RBAC)
- Role Hierarchy: `user` < `moderator` < `admin`.
- Endpoint Guards: FastAPI dependencies verify scopes before dispatching requests.
- Multi-tenancy Isolation: All user mutations explicitly enforce `user_id == current_user.id` to prevent Insecure Direct Object References (IDOR).

## 3. Data Protection & Privacy Principles
- **No Sensitive Medical Inquiries**: The platform explicitly avoids capturing protected health information (PHI), diagnoses, or medical histories. Context is limited to voluntary environmental preferences (e.g. "prefers indoor exercise").
- **Geoprivacy & Spatial Obfuscation**:
  - Exact residential GPS coordinates are never made public.
  - Community pollution reports enforce bounding jitter/rounding to ~500m to obscure private residences.
- **Right to Erasure (GDPR / Indian DPDP Act)**:
  - `DELETE /api/v1/users/me` triggers a cascading wipe of user profile, routines, personal mobility logs, and private impact records.

## 4. API Hardening & Injection Defenses
- **SQL Injection**: Prevented by strict adherence to SQLAlchemy 2.0 ORM with parameterized bind variables. Raw SQL queries are prohibited.
- **Input Sanitization**: Pydantic v2 validates and sanitizes all request payloads against strict regex and bounds.
- **CORS Policy**: Configured strictly via `fastapi.middleware.cors.CORSMiddleware` with explicit origin whitelists. Wildcard `*` is disabled in production.
- **Rate Limiting**: Redis-backed sliding window rate limiter protects endpoints against brute-force attacks and denial-of-service (e.g. max 10 requests/min on auth, 60 requests/min on LLM chat).

## 5. Secret Management & External Credentials
- **No Hardcoded Credentials**: All keys (`OPENAQ_API_KEY`, `GOOGLE_MAPS_API_KEY`, `LLM_API_KEY`, `SECRET_KEY`) are injected via environment variables.
- **Client-Side Restrictions**: The Google Maps API key loaded in the frontend must be configured in Google Cloud Console with HTTP Referrer restrictions and budget limits.
