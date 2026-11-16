---
paths:
  - "services/engines/**"
---
# Go engine rules (Go 1.27)

- Engines are stateless workers for heavy computation: MRP and material planning, capacity and line planning, bulk costing, EDI X12 parsing and generation, machine-data ingestion.
- Engines own no business data. Input is a versioned snapshot message; output is a result event. NestJS persists the results.
- Layout: cmd/<engine>/main.go, internal/<engine>/{domain,app,adapters}, internal/platform/{config,log,otel,amqp,db}. No global state; pass context.Context everywhere; shut down gracefully.
- Database access is read-only (replica) using pgx v5 and sqlc. No ORM.
- Money and quantities use shopspring/decimal, never float64, with the same rounding rules as docs/domain/.
- Deterministic: the same input gives the same output. Sort before output; inject a clock instead of calling time.Now() inside calculations.
- Concurrency: bounded worker pools, errgroup with context, goleak in tests.
- Messaging: idempotent consumers (message ID + inbox), ack only after success, dead-letter queue, retries with backoff, maximum message size.
- Errors are wrapped with %w and context. No panics on request paths.
- Observability: slog JSON with tenant and correlation IDs; OpenTelemetry traces and metrics.
- Gates: gofmt, go vet, golangci-lint (strict, including gosec), govulncheck, tests with -race, table-driven tests, testcontainers-go, benchmarks with performance budgets.
- Message structs match packages/contracts schemas; contract tests run in CI.
