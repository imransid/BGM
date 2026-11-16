# RMG-ERP (working name)

Garment (RMG) ERP for Bangladesh exporters: merchandising, costing, supply, production, quality, commercial (LC/BTB/UD), shipping, finance, HR/payroll and compliance. Three clients (web, desktop with Tauri, mobile with Expo) on one backend. Deployed as multi-tenant SaaS, in a local Tier IV cloud, or on the customer's own servers.

## Non-negotiable rules
1. Identity: every commit and push uses the git identity and credentials already configured on this machine (the owner). Never change git config, never use --author, -c user.*, or GIT_AUTHOR_* / GIT_COMMITTER_*.
2. No AI attribution anywhere: no Co-Authored-By trailers, no "Generated with" lines, no mention of Claude or AI in commits, PR titles or bodies, code, comments, docs or changelogs.
3. Branch and PR only: never commit to or push main, never force-push, never use --no-verify. Branch names: feat|fix|refactor|chore|docs|security/<module>-<short-topic>.
4. Commits: Conventional Commits, small and focused, imperative subject of 72 characters or fewer, body explains why. One logical change per commit.
5. Secrets: never read, print or commit .env files, keys or tokens. Keep placeholders in .env.example.
6. Clean-room: build only from public, functional knowledge. Never copy code, screens, text, icons or trademarks from SAP, Infor, WFX, BlueCherry, Aptean or any other vendor.
7. Ask the owner first before: adding or upgrading a dependency, destructive or data-changing migrations, changing a public API or event contract, changing auth, tenancy, money posting or payroll logic, or anything irreversible.
8. When unsure, stop and ask. Never invent business rules; check docs/domain/ or ask.

## Locked stack (change only through an ADR in docs/adr/)
- Web: React 19, TypeScript, Vite, TanStack Router + Query, React Hook Form + Zod, shadcn/ui + Radix + Tailwind v4, AG Grid Enterprise, ECharts.
- Desktop: Tauri 2 (Rust only in the shell). Mobile: Expo (React Native).
- Backend: NestJS 11 on Node.js 26 LTS, Fastify adapter, @nestjs/cqrs, MikroORM, decimal.js, BullMQ.
- Heavy engines: Go 1.27, pgx + sqlc, shopspring/decimal.
- Data: PostgreSQL 18 with row-level security (RLS), Valkey 9, RabbitMQ 4 (AMQP + MQTT), PowerSync, S3-compatible storage.
- Identity: Keycloak (OIDC). Reports: Stimulsoft Reports.JS and ZPL labels. BI: Apache Superset.
- Ops: Docker, Kubernetes (Docker Compose on-site), GitHub Actions, OpenTelemetry + Grafana, Sentry.
- Tooling: pnpm 11 workspaces + Turborepo, Vitest, Playwright, Testcontainers, k6, Storybook.

## Repository map
- apps/web, apps/desktop, apps/mobile: clients. apps/api: NestJS modular monolith, also the web BFF.
- services/engines: Go engines (mrp, planning, edi, iot).
- packages/ui: design system. packages/contracts: Zod schemas, generated API client, event contracts. packages/config: shared lint and TypeScript presets.
- infra/: docker, k8s, observability. docs/: adr, architecture, domain, security, runbooks, plan.

## Commands
- `pnpm dev` runs everything. `pnpm stack:up` / `pnpm stack:down` start and stop local services.
- `pnpm verify` runs format check, lint, typecheck, unit, integration, contract and boundary tests. It must pass before every commit.
- `pnpm test:e2e` runs Playwright. `pnpm db:migrate`, `pnpm db:seed`.
- Go: `make -C services/engines verify`.

## Architecture in brief (details in .claude/rules/ and docs/architecture/)
- Modular monolith: one NestJS module per business area (bounded context), each with its own Postgres schema. Modules talk only through public-api.ts or integration events.
- Domain-driven design (DDD) where business rules are complex; plain CRUD for reference data.
- CQRS: commands change aggregates; queries and every dashboard read from read models.
- Transactional outbox to RabbitMQ; consumers are idempotent (inbox table).
- Go engines are stateless calculators: snapshot in, result event out. NestJS owns all data.
- Multi-tenancy: tenant_id on every row plus PostgreSQL RLS.
- Web auth: BFF with HttpOnly cookies. Desktop and mobile: OIDC with PKCE.
- Money and quantities use decimal types only, never floats, with documented rounding.
- Regulatory values (wages, tax and deduction rates, deadlines) are effective-dated configuration, never hard-coded.

## Quality bar (senior engineers)
- Code a strict senior reviewer would approve unchanged: clear names, small units, single responsibility, explicit types, no dead code, no TODO without an issue link.
- Test-driven for domain logic; property-based tests (fast-check) for calculators; integration tests with Testcontainers; end-to-end tests for critical journeys.
- Every PR has tests, updated docs, a reviewed migration, noted API or contract changes, and screenshots for UI changes.
- Performance: API p95 under 300 ms, dashboards under 2 s, no N+1 queries.

## Definition of done
- `pnpm verify` and the Go verify pass locally and in CI.
- The security-reviewer and architecture-reviewer subagents report no critical or high findings.
- Docs updated: module README, ADR for any decision, glossary terms.
- Branch pushed and PR opened from the template. The owner merges.
