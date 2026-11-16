# Mission
You are the lead engineering team for RMG-ERP: a principal backend engineer (NestJS, Go, PostgreSQL, distributed systems, security) and a principal frontend engineer (React, TypeScript, design systems, desktop and mobile). The bar is code a strict senior reviewer at a top product company approves unchanged.

First read CLAUDE.md, every file in .claude/rules/ and .claude/agents/. Follow them exactly. If anything here conflicts with them, stop and ask me.

# What we are building
A garment (RMG) ERP for Bangladesh exporters, comparable in scope to SAP S/4HANA for Fashion, with our own modern design and our own code (clean-room).
- Users: merchandisers, costing, planners, store, cutting/sewing/finishing supervisors, industrial engineers, QC, commercial, shipping, accounts, HR/payroll, compliance, management; later buyer and supplier portals.
- Organisation tree: tenant (group) > company > factory > unit/building > floor > line; plus warehouses and cost centres.
- Clients: web app, desktop app (Tauri, Windows first), mobile app (Expo). Handheld scanners use the web app installed as a PWA (Zebra DataWedge types scans into fields).
- Deployment: multi-tenant SaaS, local Tier IV cloud in Bangladesh, or on the customer's own servers. Same code everywhere.
- Languages: English and Bangla. Currencies: BDT, USD, EUR, others with effective-dated FX rates. Store UTC, show Asia/Dhaka.
- Design scale: 200 tenants; the largest has 30 factories, 80,000 workers, 400 sewing lines, 50,000 open order lines and 5 million bundle scans a month.

# Modules (bounded contexts) and build order
Phase 0, Foundation: platform (tenancy, organisation tree, users, roles, permissions, audit, settings, notifications, files, imports) and master data (buyers, brands, seasons, suppliers, items for fabric/trims/accessories, units and conversions, currencies and FX, colors, size ranges, ports, incoterms, payment terms, departments).
Phase 1, Merchandising and costing: styles and tech-pack data, sampling (proto, fit, size set, PP, shipment) with approvals, cost sheets with versions (FOB and CM, consumption calculators), sales orders (style-color-size matrix, size ratios, delivery and destination splits, amendments with versioning), Time and Action (TNA) calendars from templates.
Phase 2, Supply: order BOM, MRP (Go engine), purchase requisition, purchase order and approvals, inventory and warehouse (bins; lot, shade and roll level for fabric with width, GSM and length), goods receipt with QC (4-point fabric inspection), issue, return, transfer, order-wise allocation, barcode/QR with ZPL labels, bond tagging of imported materials.
Phase 3, Production: industrial engineering (operation bulletin, SMV, line balancing in Go), production planning (capacity, learning curve, line loading in Go), cutting (marker data import, lay planning, bundle tickets), sewing floor tracking (hourly output, WIP by bundle, efficiency, DHU, downtime; offline tablets; machine counters over MQTT), finishing and packing (carton assortment, packing list), quality (inline, end-line, final AQL), subcontract and process routes (wash, print, embroidery).
Phase 4, Commercial and finance: export LC and contracts, back-to-back (BTB) LCs, UD/UP with BGMEA e-UD readiness, EXP, shipping documents, buyer EDI (X12 850/856/810/997 in Go), export proceeds realisation tracking, cash incentive claims, deductions, then GL, AP, AR, multi-currency, FX revaluation, cost centres, period close.
Phase 5, People and compliance: HR and attendance devices, Bangladesh payroll, compliance audits and corrective action plans, traceability, ZDHC chemical inventory, maintenance.
Phase 6, Analytics and AI: KPI read models, embedded Superset dashboards, a Python forecasting service later.
Phase 7, Hardening and rollout: complete offline floor apps, desktop installers and auto-update, mobile store builds, load tests, disaster-recovery drills, penetration test, data migration and on-site installer.
Use rich DDD for costing, orders, planning/MRP, inventory, production, quality, commercial, ledger and payroll. Use plain CRUD for reference data. Every list, dashboard and report reads from CQRS read models.

# Domain primer (save to docs/domain/primer.md and glossary.md in Phase 0)
- Order hierarchy: buyer > season > style > PO > color > size > delivery (date, destination, ship mode). Prices may vary by size group.
- Business models: FOB (factory buys materials) and CM/CMT (making charge only).
- Costing: FOB = fabric + trims + CM + wash/print/embroidery + commercial and overhead + profit. CM = SMV x cost per minute / line efficiency.
- Consumption: fabric from marker or body measurements plus process loss (knitting, dyeing, cutting) and wastage. Thread per stitch class (example ratios per cm of seam: 301 = 2.5 cm, 401 = 5.5 cm, 504 = 14 cm) plus 10-15% waste. Embroidery cost per 1,000 stitches.
- Floor KPIs: efficiency = earned minutes / available minutes. DHU = defects x 100 / pieces checked. Also cut-to-ship ratio and on-time delivery.
- Commercial: master LC (or contract) > BTB LCs within a configurable limit; UD/UP; EXP; bond register; realisation within the repatriation window.
- Bangladesh values. Seed these as effective-dated configuration with their source; I will verify each before go-live:
  - minimum wage: entry grade Tk 12,500 since Dec 2023
  - Labour (Amendment) Act 2026: maternity leave 120 days, 13 festival holidays
  - export source tax 1%; Central Fund 0.03% of export proceeds; AIT on cash incentive 5%
  - repatriation window 120 days
  - online UP through CBMS mandatory from 1 Jan 2026; BGMEA e-UD linked to ASYCUDA World from 11 Jan 2026
  - Bangladesh Single Window mandatory from 1 Jul 2025
  - LDC graduation 24 Nov 2029; EU Forced Labour Regulation applies 14 Dec 2027
- Traceability evidence: supplier mapping from fibre to garment for EU and US forced-labour rules (EU FLR, US UFLPA).

# Architecture (must follow; details in .claude/rules/)
- NestJS modular monolith with one schema per module and public-api.ts boundaries enforced in CI.
- CQRS with @nestjs/cqrs; read models updated from events; dashboards never load aggregates.
- Transactional outbox to RabbitMQ; inbox-based idempotent consumers; versioned event contracts in packages/contracts (with AsyncAPI docs).
- Go engines: stateless calculators. A snapshot message goes in, a result event comes out, NestJS persists. Contract tests on both sides.
- Offline: PowerSync Sync Streams scoped by tenant, factory and line. Client writes become server-validated commands, never direct table writes.
- Tenancy: tenant_id plus PostgreSQL RLS everywhere. Optional dedicated database for large or on-site tenants.
- Auth: Keycloak. Web uses the BFF pattern (RFC 10017). Desktop and mobile use Authorization Code + PKCE.
- API: REST /api/v1, OpenAPI 3.1, RFC 9457 errors, keyset pagination, Idempotency-Key on writes, async jobs for long work.
- Excel import/export (ExcelJS) with preview and row-level validation. Printed documents through Stimulsoft Reports.JS (licence key from the environment). Labels as ZPL templates.

# Non-functional targets
- API p95 under 300 ms at 200 concurrent users per tenant; dashboards under 2 s.
- MRP for 5,000 order lines under 60 s.
- SaaS availability 99.9%; RPO 15 minutes or less, RTO 4 hours or less; encrypted backups with point-in-time recovery and restore drills.
- Floor devices work 8 hours offline, then sync.
- WCAG 2.2 AA; usable on 1366x768 screens and 5-inch handhelds.

# How we work on every task
1. Plan mode first: restate the goal, list files, risks and tests. Wait for my OK on anything large.
2. Create a branch per CLAUDE.md. Use test-driven development for domain logic.
3. Small Conventional Commits made only with my configured git identity, with no attribution of any kind.
4. Run `pnpm verify` and `make -C services/engines verify`; fix every failure. Never weaken a test or lint rule to pass.
5. Run the security-reviewer and architecture-reviewer subagents; fix every critical, high and medium finding.
6. Push the branch and open a PR using the template (what, why, how tested, security notes, screenshots). Never merge.
7. Update docs: module README, an ADR for each decision, glossary, CHANGELOG.
8. Report back in short bullets: what changed, how it was verified, open questions.

# Phase 0: Foundation (build this first)
1. Monorepo with pnpm 11 workspaces and Turborepo; TypeScript strict presets; ESLint (typescript-eslint strict-type-checked) and Prettier; Go module with a strict golangci-lint config; `pnpm verify` runs every check.
2. Supply chain:
   - pnpm-workspace.yaml with minimumReleaseAge, strictDepBuilds, trustPolicy no-downgrade and an allowBuilds list
   - Renovate (grouped, delayed updates)
   - licence allowlist check; CycloneDX SBOM
3. Git: keep the provided .githooks/commit-msg. Add a pre-commit hook (lint-staged, gitleaks). Add a PR template, CODEOWNERS (me) and issue templates.
4. CI on GitHub Actions:
   - checks: lint, typecheck, unit, integration, contract, boundary, e2e smoke, build
   - security scans: CodeQL or Semgrep, gitleaks, OSV-Scanner, govulncheck, Trivy, licence check
   - actions pinned by SHA; least-privilege permissions
5. Local stack with Docker Compose and health checks:
   - PostgreSQL 18, Valkey 9, RabbitMQ 4 with MQTT enabled, Keycloak with a realm export, PowerSync service
   - S3-compatible storage (pick a maintained, permissively licensed option and record it in an ADR)
   - OpenTelemetry collector + Grafana stack, Mailpit
6. apps/api (NestJS 11 + Fastify):
   - basics: Zod-validated config (fail fast); pino logs with correlation and tenant IDs; OpenTelemetry; health endpoints; RFC 9457 error filter
   - edge protection: rate limits; security headers
   - auth and data safety: BFF login with Keycloak; tenant context with RLS; audit log; outbox and inbox
   - building blocks: CQRS plumbing; a module template (offer to save it as a reusable new-module skill); OpenAPI generation
7. Platform module:
   - tenants, companies, factories, units, floors, lines, warehouses
   - users and roles (RBAC plus scope-based checks by factory and buyer), permission matrix
   - admin screens, effective-dated settings, notifications, file service, Excel import framework
8. Master data module covering the Phase 0 list above, with validated Excel import.
9. packages/contracts: Zod schemas, generated typed API client, event contracts with Go structs and contract tests.
10. packages/ui: our own design system foundation (tokens, light/dark, dense mode, Bangla-capable fonts, core components, AG Grid theme, form patterns, Storybook with accessibility checks). Propose two visual directions for me to choose from before building many screens.
11. apps/web: app shell (module navigation, tenant/factory switcher, command palette, notifications), BFF login, i18n (en, bn), error boundaries, master-data screens using grid and form patterns.
12. apps/desktop: Tauri 2 shell loading the web build, strict CSP, least-privilege capabilities, PKCE login with keychain storage, signed auto-update pipeline, Windows installer.
13. apps/mobile: Expo skeleton with PKCE login, secure storage and a placeholder scan screen.
14. services/engines: Go skeleton (config, logging, OpenTelemetry, idempotent RabbitMQ consumer, health) with one echo job running end to end against NestJS.
15. docs:
   - C4 architecture overview; one ADR per locked choice
   - domain primer and glossary; module spec template
   - STRIDE threat model for auth and tenancy; local setup runbook
16. A demo tenant seeded with realistic Bangladesh factory data.

Phase 0 acceptance:
- A fresh clone starts the whole stack with one command.
- `pnpm verify` and CI are green.
- Login works on web and desktop.
- An RLS test proves cross-tenant access fails.
- An outbox event reaches the Go engine and its result comes back.
- Both reviewer subagents return PASS.

# Start now
1. Stay in plan mode.
2. Write docs/plan/master-plan.md: phases, milestones, risks, and the working loop above.
3. Write docs/plan/phase-0.md: Phase 0 split into PR-sized steps, each with acceptance criteria.
4. List up to 10 decisions or questions you need from me.
5. Wait for my approval before writing any code.
