---
paths:
  - "apps/web/**"
  - "apps/desktop/**"
  - "apps/mobile/**"
  - "packages/ui/**"
---
# Frontend rules (React 19, TypeScript)

## Structure
- apps/web/src/features/<module>/{routes,components,hooks,api,schemas}. Feature folders mirror backend modules. Shared UI comes only from packages/ui.
- TanStack Router (type-safe, file-based) with route-level code splitting; loaders prefetch with TanStack Query.
- Server state only through TanStack Query (query-key factory per feature). Optimistic updates only for reversible actions. Local state first; Zustand for small shared state. No Redux.
- Forms: React Hook Form with Zod schemas from packages/contracts. RFC 9457 errors map to field errors.
- Grids: AG Grid Enterprise with the server-side row model for large lists. Column layout saved per user. Large Excel exports run on the backend.
- The API client is generated from OpenAPI. Never hand-write fetch calls.

## Design system (our own look)
- Tokens in packages/ui: color, type, spacing, radius, shadow, motion. Light and dark themes, plus a dense mode for data entry.
- Built on shadcn/ui, Radix and Tailwind v4. Every component has a Storybook story with accessibility checks.
- Fonts cover English and Bangla. All text goes through i18n keys (en, bn). Numbers, dates and currency are formatted per locale; times shown in Asia/Dhaka.
- Keyboard-first data entry: shortcuts, command palette, managed focus. WCAG 2.2 AA.
- Never imitate another vendor's screens, icons or wording.

## Quality
- Strict TypeScript, no any. Small typed components; logic in hooks. Business rules live in the backend or shared pure functions, never in components.
- Error boundary per route. Every screen has empty, loading and error states; tables use skeletons.
- Budgets: app shell at most 250 KB gzipped JS, each route at most 150 KB, Lighthouse 90 or higher on key pages.
- Tests: Vitest + Testing Library for components and hooks. Playwright for critical journeys (login, create order, approve costing, record hourly output).

## Desktop (Tauri 2)
- Loads the same web build. Platform differences sit behind one adapter (platform.ts).
- Least-privilege capabilities, strict CSP, signed and verified updates.
- Login: OIDC + PKCE through the system browser; tokens in the OS keychain.
- Offline floor screens use the PowerSync web SDK with local SQLite.

## Mobile (Expo)
- Expo with EAS Build and expo-router. Shares contracts and the generated API client.
- Login: PKCE through expo-auth-session; tokens in expo-secure-store; optional biometric unlock.
- Offline-first floor tasks with the PowerSync React Native SDK.
