---
applyTo: "src/**,tests/**"
description: "US060 frontend pagination instructions for the job-role list page using backend limit/page query params and navigation links."
---

# US060 Job Roles Pagination - Frontend First

## Ticket Intent

Support paginated browsing on the frontend job-role list page so users can navigate large result sets using First, Previous, Next, and Last controls.

## Scope Clarification

- This repository change is frontend-only: routes, controllers, services, models, templates, styles, and tests.
- Do not add backend DTO/DAO/router/controller work in this ticket.
- The backend contract is already available at `GET /api/job-roles` and must be consumed from the frontend service.
- Keep architecture layering consistent with frontend standards: routes -> controllers -> services -> shared API client -> views.

## Acceptance Criteria Mapped To Frontend


- Frontend list route supports query params to define page size and page start position:
	- `limit` controls number of rows returned.
	- `page` (1-based) controls where results begin.
- Defaults and caps are respected in frontend validation and service calls.
- Frontend renders navigation controls with exact labels:
	- First
	- Previous
	- Next
	- Last
- Invalid query values are validated at controller boundary and shown as user-safe list page errors.
- Out-of-range pages render gracefully with empty list state and valid pagination context.

## Confirmed Decisions

- Query params: `limit` and `page`.
- Page index: 1-based (`page=1` is first page).
- Defaults and caps: default `limit=10`, max `limit=30`.
- Invalid params: reject at frontend validation boundary (no auto-clamping).
- Sort order: `id` descending (newest inserted first).
- Out-of-range pages: return empty `data` with consistent metadata.
- Links format: relative URLs; unavailable links are `null`.
- Query behavior: align with backend contract and existing frontend patterns; use what integrates cleanly.

## Backend Contract To Consume

### Request

- Method: `GET`
- Path: `/api/job-roles`
- Query params:
	- `limit` optional, integer, min 1, max 30, default 10
	- `page` optional, integer, min 1, default 1

### Success Response (200)

```json
{
	"data": [
		{
			"id": 1,
			"roleName": "Backend Engineer",
			"location": "Dublin",
			"capability": {
				"capabilityId": 10,
				"capabilityName": "Engineering"
			},
			"band": {
				"bandId": 3,
				"bandName": "Band 3"
			},
			"closingDate": "2026-08-31",
			"status": "Open"
		}
	],
	"pagination": {
		"totalItems": 57,
		"totalPages": 6,
		"currentPage": 1,
		"pageSize": 10,
		"hasNext": true,
		"hasPrevious": false
	},
	"links": {
		"first": "/api/job-roles?limit=10&page=1",
		"next": "/api/job-roles?limit=10&page=2",
		"previous": null,
		"last": "/api/job-roles?limit=10&page=6"
	}
}
```

### Validation Failure (400)

```json
{
	"errors": [
		{
			"field": "limit",
			"message": "Limit must not exceed 30"
		}
	]
}
```

Frontend note:
- Service should forward `limit/page` to backend.
- Controller should also validate query params before service call to provide consistent user-facing behavior.
- If backend still returns `400`, map it to a safe page-level error message.

## Implementation Plan

### Phase 1 - Query Validation Schema

**File:** `src/validation/jobRoleSchemas.ts`

- Add `JobRolePaginationQuerySchema` using Zod with:
	- `limit`: coerced integer, min 1, max 30, default 10
	- `page`: coerced integer, min 1, default 1
- Export inferred `JobRolePaginationQueryData` type.
- Keep messages user-facing and aligned with existing schema message style.

### Phase 2 - Pagination Models

**File:** `src/models/jobRole.ts`

- Add typed interfaces for paginated list responses returned by backend:
	- `JobRolePaginationMetadata`
	- `JobRolePaginationLinks`
	- `PaginatedJobRoleListResponse`
- Keep naming aligned with existing `JobRole` model conventions.

### Phase 3 - Service Update

**File:** `src/services/jobRoleService.ts`

- Update `getAllJobRoles` to accept pagination input (`limit`, `page`).
- Call backend with axios `params` and auth header in service.
- Return backend paginated payload shape to controller.
- Keep existing axios error logging pattern (`logRequestError`) and rethrow.

### Phase 4 - Controller Update

**File:** `src/controllers/jobRoleController.ts`

- In `getAllJobRoles`, parse query via `JobRolePaginationQuerySchema.safeParse(req.query)`.
- On validation failure, return `400` and render `pages/job-role-list.njk` with:
	- empty `jobRoles`
	- user-facing page error
	- safe fallback pagination context
- On success, call service with validated pagination params and token.
- Pass to template:
	- `jobRoles` from paginated `data`
	- `pagination` metadata
	- `links`
	- existing `created` banner flag behavior
- Keep token handling and redirect behavior consistent with current auth/session flow.

### Phase 5 - List Page Rendering

**File:** `src/views/pages/job-role-list.njk`

- Render pagination controls using exact labels:
	- First
	- Previous
	- Next
	- Last
- Use backend-provided relative links when present; disable/hide when `null`.
- Keep existing role list cards intact.
- Show meaningful empty-state copy when no jobs are present for current page.
- Preserve existing created-success banner behavior.

### Phase 6 - Styling

**File:** `public/assets/styles/branding.css`

- Add pagination classes and styling in stylesheet only.
- Do not use inline styles or `<style>` blocks in templates.
- Keep spacing/typography aligned with current list page design system.

### Phase 7 - Tests

- `tests/validation/jobRoleSchemas.test.ts`
	- valid defaults when query missing
	- valid explicit query (`limit=10`, `page=2`)
	- invalid `limit` (`0`, `31`, non-integer)
	- invalid `page` (`0`, non-integer)
- `tests/service/jobRoleService.test.ts`
	- `getAllJobRoles` sends `params` and auth header
	- maps backend paginated response shape correctly
	- logs and rethrows on axios failure
- `tests/controllers/jobRoleController.test.ts`
	- valid query parsed and forwarded to service
	- validation failure renders 400 page error state
	- backend `400` mapped to user-safe page error
	- out-of-range response renders empty list with pagination context
	- include `query: {}` in request mocks where handler reads query
- `tests/routes/jobRoleRoutes.test.ts`
	- `GET /job-roles?limit=10&page=1` unauthenticated redirects to `/login`
	- authenticated request delegates to controller
	- invalid query path returns rendered error outcome per controller behavior

## Done Criteria

- All changed files follow frontend layering and naming standards.
- Query validation happens at controller boundary using Zod.
- Service forwards `limit/page` to backend with auth header.
- List page renders First/Previous/Next/Last controls correctly.
- Invalid query values and backend failures surface safe user-facing errors.
- Unit/integration tests are updated and passing.

## Pre-PR Verification

Run from project root:

1. `npm run format`
2. `npm run lint:fix`
3. `npm run lint`
4. `npm run build`
5. `npm test`
6. `npm run test:coverage`

Smoke checks:

1. Sign in and open `/job-roles` (defaults should load first page).
2. Open `/job-roles?limit=10&page=2` and verify results change.
3. Verify First/Previous/Next/Last controls match backend links/null behavior.
4. Open `/job-roles?limit=31&page=1` and verify frontend validation error state.
5. Open an out-of-range page and verify empty list is rendered safely.

## Files To Change

| File | Change |
|---|---|
| `src/validation/jobRoleSchemas.ts` | Add pagination query schema and inferred type |
| `src/models/jobRole.ts` | Add pagination response interfaces |
| `src/services/jobRoleService.ts` | Update list method to accept query and pass axios params |
| `src/controllers/jobRoleController.ts` | Validate query, call paginated service, map errors, shape render model |
| `src/views/pages/job-role-list.njk` | Render pagination controls and empty-state handling |
| `public/assets/styles/branding.css` | Add pagination styles (no inline style usage) |
| `tests/validation/jobRoleSchemas.test.ts` | Add pagination query schema tests |
| `tests/service/jobRoleService.test.ts` | Add pagination service call/shape/error tests |
| `tests/controllers/jobRoleController.test.ts` | Add query validation/rendering/error mapping tests |
| `tests/routes/jobRoleRoutes.test.ts` | Add route coverage for pagination query behavior |

## Clarification Rule Before Implementation

If any item below is unclear during delivery, stop and ask before coding:

- exact backend pagination response shape if it differs from contract above
- error copy conventions for list-page validation failures
- whether to preserve or drop incidental query flags during pagination navigation
