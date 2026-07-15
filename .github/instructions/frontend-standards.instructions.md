---
applyTo: "**"
description: "Team 3 frontend standards for naming, file placement, architecture layering, server-rendered UI patterns, and pre-PR verification commands. Use when creating or editing frontend files."
---

# Team 3 Frontend Standards

## Purpose

Use these rules for all frontend changes to keep naming, structure, and verification consistent before opening a PR.

This file must be used for every new ticket scenario.

## Naming Standards

- Use clear, intent-based names.
- Prefer camelCase for variables, functions, methods, and most TypeScript file names.
- Use PascalCase for classes, types, interfaces, and validation schemas.
- Keep file names aligned with responsibility and suffix pattern:
  - Routes: `src/routes/*Routes.ts`
  - Controllers: `src/controllers/*Controller.ts`
  - Services: `src/services/*Service.ts`
  - Middleware: `src/middleware/*Middleware.ts` or named middleware utilities in `src/middleware/*.ts`
  - Validation schemas: `src/validation/*Schemas.ts`
  - Config: `src/config/*.ts`
  - Models: `src/models/*.ts`
  - Views: `src/views/pages/*.njk`, `src/views/layouts/*.njk`, `src/views/partials/*.njk`
  - Tests: `tests/**/<sourceName>.test.ts`
- Use lowercase kebab-case for Nunjucks page template names such as `signin.njk` and `job-role-list.njk`.
- Keep route paths lowercase and descriptive.

## File Placement And Layering

- Routes handle endpoint registration, middleware wiring, and controller delegation only.
- Controllers handle HTTP request and response concerns only.
- Controllers own input validation, render decisions, redirects, and status codes.
- Services hold business logic, orchestration, and external API calls.
- Shared Axios configuration belongs in `src/config/apiClient.ts`.
- Validation schemas belong in `src/validation/` and should be used at controller boundaries.
- Middleware handles cross-cutting request concerns such as authentication guards.
- Views render data provided by controllers and must not contain business logic.
- Keep flow one direction: routes -> controllers -> services -> shared API client.

## Server-Rendered UI And Views

- Treat Nunjucks templates as presentation only.
- Keep render models explicit and shaped in controllers before calling `res.render(...)`.
- Use layouts and partials for shared page structure instead of duplicating markup.
- Do not move validation, auth checks, or data-fetching logic into templates.
- Preserve autoescaped rendering and avoid bypassing template escaping.

## Auth And Session Handling

- Store the authenticated JWT in `req.session.jwtToken`.
- Use `requireAuth` on protected routes rather than duplicating route-level access rules in views.
- Clear session state through controller or middleware boundaries only.
- Keep redirects for unauthenticated users consistent with the current flow.
- Keep `Authorization: Bearer ...` header construction inside services when calling protected backend endpoints.

## Validation And Error Handling

- Validate form input at controller boundaries using Zod schemas and `safeParse()`.
- Return field-level validation feedback that templates can render clearly.
- After successful POST submissions, redirect instead of rendering directly.
- Use `axios.isAxiosError()` before reading response metadata from failed API calls.
- Do not leak backend internals, stack traces, or token details into rendered responses.
- Use user-facing error messages in templates and log technical context in services when needed.
- Keep status codes consistent with the rendered or redirected outcome.

## Testing And Quality Expectations

- Add or update tests whenever behavior changes.
- Mirror source structure in `tests/`.
- Cover happy path and key failure path for new logic.
- Inject services into controllers so tests can provide mocks.
- Keep route tests focused on registration, middleware, redirects, and controller delegation.
- Use `request(app)` for app or route integration checks instead of starting a real server.
- Mock response chaining correctly in controller tests when `res.status(...).render(...)` or `res.status(...).send(...)` is used.

## Pre-PR Manual Checklist

Run these from project root before pushing and before uploading coverage:

1. Format code
   - `npm run format`
2. Lint and auto-fix
   - `npm run lint:fix`
3. Verify no lint issues remain
   - `npm run lint`
4. Verify TypeScript build
   - `npm run build`
5. Run unit tests
   - `npm test`
6. Generate coverage report
   - `npm run test:coverage`

## Submission Gate

Before uploading coverage or creating a PR, confirm all are true:

- Formatting complete.
- Lint passing.
- Build passing.
- Tests passing.
- Coverage generated.
- Manual page-flow smoke checks passing.
- Changed files follow naming and folder standards.
- New behavior is reflected in tests.