# Security rules (all code)

Standard: OWASP Top 10:2025 and OWASP ASVS 5.0 Level 2. Use Level 3 for authentication, tenancy, payroll and finance postings. Write a STRIDE threat model for every new module in docs/security/.

## Access control
- Deny by default. Every endpoint declares its permission and data scope; a missing declaration fails the build.
- Authorize every command and query in the application layer, including object scope (tenant, company, factory, buyer). Never trust IDs sent by a client.
- PostgreSQL RLS on every tenant table. The app's database role has no BYPASSRLS. The tenant is set with SET LOCAL in each transaction. Each module has a test proving cross-tenant reads and writes fail.
- All outbound HTTP goes through one client with a domain allowlist (blocks SSRF).

## Authentication
- Keycloak with OIDC. Web: BFF pattern; tokens never reach browser JavaScript. Session cookie is HttpOnly, Secure, SameSite=Strict, with a __Host- prefix. CSRF token on every state-changing request.
- Desktop and mobile: Authorization Code + PKCE through the system browser. Tokens live only in the OS keychain or secure store. Access tokens last 5 minutes or less; refresh tokens rotate.
- MFA for admin, finance, payroll and commercial roles. Re-authenticate for sensitive actions (approve payment, run payroll, submit LC documents).

## Input, output, injection
- Validate every input at the edge with strict Zod schemas (unknown keys rejected); domain invariants check again.
- SQL only through the ORM or parameterized queries; never build SQL from strings.
- Never use dangerouslySetInnerHTML; if rich text is unavoidable, sanitize with DOMPurify.
- Excel/CSV import has size limits and schema validation. Exports escape cells starting with = + - @ (formula injection).

## Cryptography and data
- TLS 1.2 or later everywhere, including internal traffic. HSTS on.
- Field-level encryption (AES-256-GCM, envelope keys in KMS or Vault) for national ID, bank accounts, salary and medical data. Mask these in the UI and logs.
- Data classes: public, internal, confidential, restricted. Restricted personal data (Bangladesh PDPO) stays in the tenant's chosen region.
- No home-made cryptography.

## Secrets
- No secrets in code, tests, fixtures, logs or container images. .env.example holds placeholders only. Production secrets live in a secrets manager and are rotated.

## Configuration
- Security headers: CSP with nonces, HSTS, X-Content-Type-Options, frame-ancestors 'none', Referrer-Policy, Permissions-Policy.
- CORS uses an explicit allowlist; never a wildcard with credentials.
- Production: no debug endpoints, no stack traces sent to clients.

## Supply chain
- pnpm-workspace.yaml: minimumReleaseAge at least 1440 minutes, strictDepBuilds, trustPolicy no-downgrade, an explicit allowBuilds list. CI installs with a frozen lockfile.
- Licence allowlist: MIT, Apache-2.0, BSD-2/3-Clause, ISC, MPL-2.0, 0BSD. AGPL, SSPL, BSL, Commons Clause or unknown licences need the owner's written approval.
- GitHub Actions pinned by commit SHA, least-privilege workflow permissions, OIDC to the cloud (no long-lived keys).
- CI scans: CodeQL or Semgrep, gitleaks, OSV-Scanner, govulncheck, Trivy for images, licence check. CycloneDX SBOM per release. Sign container images and desktop/mobile builds.

## Logging, audit, alerting
- Append-only audit log for every business state change: who, when, tenant, before/after diff, reason, request ID.
- Security events (login, failed login, permission denied, role change, bulk export) are logged and can raise alerts.
- Never log secrets, tokens, passwords or restricted personal data.

## Errors and resilience
- Fail closed: any error in authorization, validation or crypto means deny.
- Clients receive RFC 9457 problem details only, never internals.
- Every external call has a timeout, retry with backoff and a circuit breaker.
- Rate limits per user, IP and tenant; request-size and page-size limits.

## Files
- Uploads: types checked by magic bytes, size limits, malware scan (ClamAV), stored privately, served through short-lived signed URLs.

## Desktop and mobile
- Tauri: strict CSP, least-privilege capabilities per window, no remote code, only signed updates.
- Expo: no secrets in the bundle; warn and log on rooted or jailbroken devices for payroll and finance screens.
