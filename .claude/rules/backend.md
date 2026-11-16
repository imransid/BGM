---
paths:
  - "apps/api/**"
  - "packages/contracts/**"
---
# Backend rules (NestJS 11, TypeScript)

## Module layout (one bounded context per module)
apps/api/src/modules/<context>/
- domain/: aggregates, entities, value objects, domain events, domain services, repository interfaces. Pure TypeScript, no NestJS or ORM imports.
- application/: commands and handlers, queries and handlers, authorization policies, ports, integration-event publishers.
- infrastructure/: MikroORM mappings, repositories, read-model projections, outbox, external clients.
- presentation/: thin controllers, request/response schemas, OpenAPI.
- <context>.module.ts and public-api.ts. public-api.ts is the only file other modules may import.
- No cross-module imports of internals, no cross-schema foreign keys or joins on write paths. dependency-cruiser enforces this in CI.

## When to use DDD
- Rich domain model for: Costing, Sales Orders, Planning/MRP, Inventory, Cutting and Production, Quality, Commercial (LC/BTB/UD), Finance ledger, Payroll.
- Plain CRUD services for reference data (colors, units, ports, payment terms). Do not over-engineer.
- Aggregates are small consistency boundaries. They reference other aggregates by ID, protect invariants inside methods (no public setters), raise domain events, and carry a version column for optimistic locking. One aggregate changes per transaction; events carry the rest.
- Immutable, validated value objects: Money (decimal.js + ISO currency), Quantity (decimal + unit), Percentage, SizeRatio, DateRange, Smv, Consumption.
- Names in code follow docs/domain/glossary.md.

## CQRS
- Controllers only dispatch commands or queries through @nestjs/cqrs buses.
- Commands change state and return only an ID and version. Queries never change state.
- Read models are projection tables or materialized views in a <context>_read schema, updated by event handlers. Dashboards, lists and reports always read from read models or the read replica, never by loading aggregates.
- Projections are idempotent and can be rebuilt by replaying events.

## Events, outbox, idempotency
- Domain events: in-process handlers inside the same transaction where consistency is required.
- Integration events: written to the outbox table in the same transaction, relayed to RabbitMQ; consumers record processed IDs in an inbox table.
- Event contracts are versioned in packages/contracts (name.v1). Only backward-compatible changes; a breaking change is a new version.
- Every POST and PUT accepts an Idempotency-Key header.

## Persistence (MikroORM + PostgreSQL 18)
- One EntityManager fork per request or job; explicit transactions in command handlers.
- IDs are UUIDv7. Standard columns: tenant_id, created_at, created_by, updated_at, updated_by, version. Times are timestamptz in UTC.
- Money NUMERIC(19,4) plus currency; quantities NUMERIC(18,6) plus unit. Never float or double.
- Migrations are forward-only and zero-downtime (expand, migrate, contract). Never edit an applied migration. RLS policies go in the same migration as their table.
- Keyset pagination. Every read-model query has a supporting index; include EXPLAIN output for heavy queries in the PR.

## API
- REST under /api/v1, OpenAPI 3.1 generated from shared Zod schemas.
- Errors use RFC 9457 problem+json with stable error codes.
- Bulk endpoints for grid editing: each row validated, partial failures reported.
- Long-running work (MRP, payroll, imports) runs as an async job with a status endpoint and a notification.

## Numbers
- decimal.js for all money, quantities, rates and percentages. Rounding mode is explicit per business rule and documented in docs/domain/.

## Code style
- TypeScript strict, noUncheckedIndexedAccess, exactOptionalPropertyTypes. No any, no non-null assertions, no default exports.
- Calculations are pure functions; I/O comes through dependency injection; no static singletons.
- Comments explain why, not what.
