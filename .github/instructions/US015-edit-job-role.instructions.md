---
applyTo: "**"
description: "Instructions for US015: Edit Job Role As An Admin. Covers admin-only edit flow on the shared job-roles surface, edit form rendering, update validation, PATCH service call, redirect success banner, and tests."
---

# US015 — Edit Job Role As An Admin

## Scope Clarification

- This ticket updates an existing `JobRole` record from the frontend.
- Do not confuse this with the auth `UserRole` enum (`ADMIN` / `USER`).
- Keep this ticket frontend-first: routes, controllers, services, validation, views, and tests.
- Reuse the shared job-role surface already in place; do not create a separate admin area unless the existing app structure forces it.
- The edit page is admin-only and should follow the current server-rendered page patterns in this codebase.

## What Is Already Done — Do Not Recreate

- `src/views/pages/job-role-information.njk` already renders the job-role detail view and the existing application success banner.
- `src/views/pages/job-role-list.njk` already lists job roles and links to job-role details.
- `src/routes/jobRoleRoutes.ts` already wires the current list, detail, and apply routes.
- `src/controllers/jobRoleController.ts` already implements:
	- `getAllJobRoles`
	- `getJobRoleById`
- `src/controllers/applicationController.ts` already shows the current pattern for a dedicated form page, submit redirect, and upload proxy flow.
- `src/services/jobRoleService.ts` already contains the read and apply/upload service methods.
- `src/middleware/authMiddleware.ts` already provides `requireAuth` and `requireAdmin`.
- `src/types/express-session.ts` already exposes `userRole` on the session, which `requireAdmin` uses.
- `src/models/jobRole.ts` already defines the existing job-role response types and `JobRoleStatus`.
- The detail page already derives `canApply` and reads `applicationSubmitted`; keep that behavior intact and add the edit flow alongside it.

## Backend Contract

Single backend endpoint for the edit submission:

- **Method/path:** `PATCH /api/job-roles/:id`
- **Auth:** `Authorization: Bearer <token>`
- **Request body:** partial update payload with editable job-role fields
- **Response:** updated job role in the existing detailed response shape

The frontend service should send the patch request and return the backend response to the controller. The controller should then redirect back to the detail page after a successful update.

## End-to-End Flow

1. An admin opens a job role detail page and sees an Edit Job Role action.
2. The detail controller sets `canEdit` from the authenticated session role and passes it to the render model.
3. The admin clicks the Edit Job Role action and opens `GET /job-roles/:id/edit`.
4. The edit page renders a server-side form prefilled with the current job-role values.
5. The form submits to `POST /job-roles/:id/edit`.
6. The controller validates the id and form payload with Zod, then calls the service.
7. The service sends `PATCH /api/job-roles/:id` with the JWT in the authorization header.
8. On success, the controller redirects to `/job-roles/:id?editSuccess=true`.
9. `getJobRoleById` reads `req.query.editSuccess === "true"` and the detail page shows a success banner.
10. Validation or backend errors keep the admin on the edit page with inline feedback instead of silently failing.

## Phase 1 — Detail Page Edit Affordance and Success Banner

**File:** `src/controllers/jobRoleController.ts`

Update `getJobRoleById` so it also derives:

```typescript
const canEdit = req.session.userRole === "ADMIN";
const editSuccess = req.query.editSuccess === "true";
```

Pass both values into the render model for `job-role-information.njk`, alongside the existing `jobRole` and `canApply` values.

**File:** `src/views/pages/job-role-information.njk`

Add the admin edit action to the existing detail page, and add a success banner that appears when `editSuccess` is true. Keep the application success banner behavior unchanged.

## Phase 2 — New Edit Route

**File:** `src/routes/jobRoleRoutes.ts`

Add two routes on the existing shared job-role surface:

```typescript
router.get("/job-roles/:id/edit", requireAdmin, (req, res) =>
	jobRoleController.getEditJobRolePage(req, res),
);

router.post("/job-roles/:id/edit", requireAdmin, (req, res) =>
	jobRoleController.submitEditJobRole(req, res),
);
```

The edit route should stay on the same job-role controller and should not introduce a new controller unless the existing architecture makes that unavoidable.

## Phase 3 — Validation Schema

**File:** `src/validation/jobRoleSchemas.ts` (new file)

Create a Zod schema for the edit form submission, named `UpdateJobRoleRequestSchema`.

Use the same editable fields as the backend contract. Keep the schema aligned with the current frontend standards:

- `roleName` should be trimmed and non-empty when present
- `location` should be trimmed and non-empty when present
- `capabilityId` and `bandId` should coerce to positive integers when present
- `closingDate` should be a valid date string when present
- `status` should only allow valid job-role statuses
- `description` and `responsibilities` should be trimmed and non-empty when present
- `sharepointUrl` should be a valid URL when present
- `numberOfOpenPositions` should coerce to a positive integer when present
- Empty payloads must be rejected

Export the inferred TypeScript type from the schema and use it at the controller boundary.

## Phase 4 — View Model And Form Data

**File:** `src/models/jobRole.ts`

Add any explicit edit-page view-model or form-data type needed so the controller can render the edit page without using an untyped object. Keep the type named clearly and aligned with the existing job-role model conventions.

If the edit page needs dropdown option data for capability or band, keep that data in the controller and pass it into the render model rather than hard-coding it in the template.

## Phase 5 — Service Method

**File:** `src/services/jobRoleService.ts`

Add a new method to `JobRoleService`:

```typescript
async updateJobRole(
	id: number,
	data: UpdateJobRoleRequestData,
	token: string,
)
```

Implementation rules:

- Send `PATCH /job-roles/${id}` through `apiClient`
- Build the `Authorization: Bearer ${token}` header inside the service
- Pass only the validated form payload to the backend
- Return the backend response data unchanged unless the controller needs a shaped wrapper
- Wrap the request in `try/catch`
- Call `this.logRequestError(...)` on failure, then rethrow

## Phase 6 — Controller Methods

**File:** `src/controllers/jobRoleController.ts`

Add `getEditJobRolePage(req, res)` and `submitEditJobRole(req, res)`.

### `getEditJobRolePage`

1. Parse and validate `id`.
2. If the id is invalid, return `res.status(400).send("Invalid job role ID")`.
3. Read the JWT from `req.session.jwtToken`.
4. If the token is missing, redirect to `/login`.
5. Fetch the current job role data through `jobRoleService`.
6. Render the edit page with the current values and any option data needed by the form.

### `submitEditJobRole`

1. Parse and validate `id`.
2. Validate the request body with `UpdateJobRoleRequestSchema.safeParse(req.body)`.
3. If validation fails, re-render the edit page with the validation error message and the submitted values.
4. Read the JWT from `req.session.jwtToken`.
5. If the token is missing, redirect to `/login`.
6. Call `jobRoleService.updateJobRole(id, validatedBody, token)`.
7. On success, redirect to `/job-roles/${id}?editSuccess=true`.
8. On error, use `axios.isAxiosError(error)` and map backend status codes to the appropriate frontend response; keep the generic fallback user-friendly and do not expose backend internals.

## Phase 7 — Tests

### `tests/controllers/jobRoleController.test.ts`

Add coverage for:

- `getJobRoleById` passing `canEdit` and `editSuccess`
- `getEditJobRolePage` happy path
- `getEditJobRolePage` invalid id
- `getEditJobRolePage` missing token
- `submitEditJobRole` happy path
- `submitEditJobRole` invalid id
- `submitEditJobRole` body validation failure
- `submitEditJobRole` missing token
- `submitEditJobRole` backend 404 or 400 mapping
- `submitEditJobRole` generic error fallback

### `tests/routes/jobRoleRoutes.test.ts`

Add route coverage for:

- `GET /job-roles/1/edit` without auth: redirects to `/login`
- `GET /job-roles/1/edit` with admin auth: reaches the controller
- `POST /job-roles/1/edit` without auth: redirects to `/login`
- `POST /job-roles/1/edit` with admin auth: reaches the controller
- non-admin access: returns `403` from `requireAdmin`

### `tests/service/jobRoleService.test.ts`

Add service coverage for:

- `updateJobRole` happy path
- `updateJobRole` request shape and authorization header
- `updateJobRole` error path logs and rethrows

### `tests/validation/jobRoleSchemas.test.ts`

Add schema coverage for:

- valid partial payload
- valid full payload
- empty payload rejection
- invalid status
- invalid capabilityId and bandId
- invalid closingDate
- invalid sharepointUrl
- invalid numberOfOpenPositions

## Files To Change

| File | Change |
|---|---|
| `src/routes/jobRoleRoutes.ts` | Add GET and POST edit routes |
| `src/controllers/jobRoleController.ts` | Add edit-page render and submit handlers; extend detail-page render model |
| `src/services/jobRoleService.ts` | Add `updateJobRole` |
| `src/models/jobRole.ts` | Add edit-page view-model or form-data type |
| `src/validation/jobRoleSchemas.ts` | New file - `UpdateJobRoleRequestSchema` |
| `src/views/pages/job-role-information.njk` | Add admin edit action and edit-success banner |
| `src/views/pages/job-role-edit.njk` | New server-rendered edit form |
| `tests/controllers/jobRoleController.test.ts` | Add controller coverage |
| `tests/routes/jobRoleRoutes.test.ts` | Add route coverage |
| `tests/service/jobRoleService.test.ts` | Add service coverage |
| `tests/validation/jobRoleSchemas.test.ts` | Add schema coverage |

## Pre-PR Checklist

1. `npm run format`
2. `npm run lint:fix`
3. `npm run lint`
4. `npm run build`
5. `npm test`
6. `npm run test:coverage`
7. Manual: sign in as admin, open a job role detail page, confirm the edit action is visible, submit a valid edit, and confirm the redirect back to `/job-roles/:id?editSuccess=true`.
8. Manual: confirm a non-admin user cannot access the edit route and does not see the edit action.
9. Manual: confirm validation failures stay on the edit page and show field-level feedback.
