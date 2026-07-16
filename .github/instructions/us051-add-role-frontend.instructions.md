---
applyTo: "**"
description: "Instructions for US051: Add New Job Role (Frontend). Covers admin-only create flow, metadata dropdowns, UI/API validation, status defaults, redirects, styling location, and tests."
---

# US051 - Add New Job Role (Frontend)

## Scope Clarification

- This ticket is frontend implementation only (Express routes/controllers/services/views/tests).
- This ticket creates a new `JobRole` record (not auth role management).
- Auth role values in this frontend are `admin` and `user`.
- Only `admin` can access create-role UI and create endpoints.

## What Is Already Done - Do Not Recreate

- Backend endpoints already available:
  - `GET /api/job-roles/metadata`
  - `POST /api/job-roles`
- Existing job-role list/details pages and read routes already exist.
- Existing auth/session flow already stores JWT token in `req.session.jwtToken`.

## Acceptance Criteria Mapped To Frontend

- Admin can open a create-role form from the job roles list page.
- Admin can select existing capability and band from database-backed dropdowns.
- Admin can input all required new role details.
- Validation is enforced on UI and mirrored to backend contract.
- Applicant (`user`) cannot access create role flow.
- Non-authenticated users are redirected to login on protected routes.
- New role status must be `Open` in persistence logic (frontend must not expose status editing).

## API Contract For Frontend

### Metadata endpoint

- **Method/path:** `GET /api/job-roles/metadata`
- **Auth header:** `Authorization: Bearer <token>`
- **Response shape:**

```json
{
  "capabilities": [
    { "capabilityId": 1, "capabilityName": "Engineering" }
  ],
  "bands": [
    { "bandId": 1, "bandName": "Band 1" }
  ]
}
```

### Create endpoint

- **Method/path:** `POST /api/job-roles`
- **Auth header:** `Authorization: Bearer <token>`
- **Request body:**

```json
{
  "roleName": "Senior Backend Engineer",
  "location": "Dublin",
  "capabilityId": 1,
  "bandId": 2,
  "closingDate": "2026-08-31",
  "description": "Own backend services and integrations.",
  "responsibilities": "Build APIs, review code, support delivery.",
  "sharepointUrl": "https://example.sharepoint.com/job-role",
  "numberOfOpenPositions": 2
}
```

- Do not send `status` from frontend.
- Backend sets status to `Open`.

## End-To-End Flow

1. Admin visits job role list page.
2. Admin clicks create action and opens create form.
3. Controller requests metadata from service for capabilities and bands.
4. Controller renders form with dropdown options.
5. Admin submits form.
6. Frontend validates input; if invalid, re-render form with field errors and entered values.
7. On valid data, controller calls service create endpoint.
8. On success, redirect to `/job-roles?created=true`.
9. Job role list page reads `created=true` and shows success banner.

## Phase 1 - Routes

**File:** `src/routes/jobRoleRoutes.ts`

Add admin-only frontend routes:

- `GET /job-roles/new` with `requireAuth` and `requireAdmin`
- `POST /job-roles` with `requireAuth` and `requireAdmin`

List/details routes remain available to authenticated users per current behavior.

## Phase 2 - Model Types

**File:** `src/models/jobRole.ts`

Add frontend models for metadata and create payload:

```typescript
export interface CapabilityOption {
  capabilityId: number;
  capabilityName: string;
}

export interface BandOption {
  bandId: number;
  bandName: string;
}

export interface JobRoleMetadataResponse {
  capabilities: CapabilityOption[];
  bands: BandOption[];
}

export interface CreateJobRolePayload {
  roleName: string;
  location: string;
  capabilityId: number;
  bandId: number;
  closingDate: string;
  description: string;
  responsibilities: string;
  sharepointUrl: string;
  numberOfOpenPositions: number;
}
```

## Phase 3 - Validation Schema

**File:** `src/validation/jobRoleSchemas.ts` (new file)

Create Zod schema mirroring backend validation:

```typescript
import { z } from "zod";

export const CreateJobRoleSchema = z.object({
  roleName: z.string().trim().min(1, "Role name is required."),
  location: z.string().trim().min(1, "Location is required."),
  capabilityId: z.coerce.number().int().positive("Capability is required."),
  bandId: z.coerce.number().int().positive("Band is required."),
  closingDate: z
    .string()
    .trim()
    .min(1, "Closing date is required.")
    .refine((value) => !Number.isNaN(Date.parse(value)), "Closing date must be valid."),
  description: z.string().trim().min(1, "Description is required."),
  responsibilities: z.string().trim().min(1, "Responsibilities are required."),
  sharepointUrl: z.string().trim().url("SharePoint URL must be a valid URL."),
  numberOfOpenPositions: z.coerce
    .number()
    .int("Number of open positions must be an integer.")
    .positive("Number of open positions must be greater than 0."),
});

export type CreateJobRoleData = z.infer<typeof CreateJobRoleSchema>;
```

## Phase 4 - Service Methods

**File:** `src/services/jobRoleService.ts`

Add methods:

```typescript
async getJobRoleMetadata(token: string): Promise<JobRoleMetadataResponse>
async createJobRole(payload: CreateJobRolePayload, token: string): Promise<void | JobRoleInformation>
```

Implementation rules:

- Build auth header in service (`Authorization: Bearer ${token}`).
- `getJobRoleMetadata` calls `GET /job-roles/metadata`.
- `createJobRole` calls `POST /job-roles` with validated payload.
- Use `axios.isAxiosError` handling pattern and existing logging helper.

## Phase 5 - Controller Methods

**File:** `src/controllers/jobRoleController.ts`

Add:

- `getCreateJobRolePage(req, res)`
- `createJobRole(req, res)`

Controller behavior:

1. Ensure token exists in session; otherwise redirect `/login`.
2. For GET form page:
   - load metadata via service
   - render form template with `{ capabilities, bands, formValues, fieldErrors, error }`
3. For POST create:
   - validate `req.body` with `CreateJobRoleSchema.safeParse`
   - on validation failure: return `400` and re-render with field errors and original values
   - on success: call service and redirect `/job-roles?created=true`
4. Error mapping:
   - backend `400`: show user-facing form error
   - backend `401/403`: redirect or render unauthorized message per app pattern
   - fallback: `500` with generic user-safe message

## Phase 6 - Views

### Create form page

**File:** `src/views/pages/job-role-form.njk` (new)

Create this file physically in `src/views/pages/` before testing routes. If this file is missing, `GET /job-roles/new` will fail with `template not found: pages/job-role-form.njk`.

Requirements:

- Form fields:
  - `roleName`
  - `location`
  - `capabilityId` (select)
  - `bandId` (select)
  - `closingDate`
  - `description`
  - `responsibilities`
  - `sharepointUrl`
  - `numberOfOpenPositions`
- No status input in UI.
- Dropdowns populated from controller metadata model.
- Render field-level errors and preserve submitted values.

Minimum scaffold:

```njk
{% extends "layouts/main.njk" %}

{% block title %}Kainos Careers | Create Job Role{% endblock %}

{% block content %}
  <section class="job-role-form-page" aria-labelledby="create-role-heading">
    <a class="role-details__back" href="/job-roles">Back to all job roles</a>

    <article class="job-role-form-card">
      <h1 id="create-role-heading">Create a new role</h1>

      {% if error %}
        <p class="job-role-form__error" role="alert">{{ error }}</p>
      {% endif %}

      <form class="job-role-form" action="/job-roles" method="post" novalidate>
        <input id="roleName" name="roleName" value="{{ formValues.roleName }}" />
        <input id="location" name="location" value="{{ formValues.location }}" />

        <select id="capabilityId" name="capabilityId">
          <option value="">Select capability</option>
          {% for capability in capabilities %}
            <option value="{{ capability.capabilityId }}">{{ capability.capabilityName }}</option>
          {% endfor %}
        </select>

        <select id="bandId" name="bandId">
          <option value="">Select band</option>
          {% for band in bands %}
            <option value="{{ band.bandId }}">{{ band.bandName }}</option>
          {% endfor %}
        </select>

        <input id="closingDate" name="closingDate" type="date" value="{{ formValues.closingDate }}" />
        <textarea id="description" name="description">{{ formValues.description }}</textarea>
        <textarea id="responsibilities" name="responsibilities">{{ formValues.responsibilities }}</textarea>
        <input id="sharepointUrl" name="sharepointUrl" value="{{ formValues.sharepointUrl }}" />
        <input id="numberOfOpenPositions" name="numberOfOpenPositions" type="number" value="{{ formValues.numberOfOpenPositions }}" />

        <button type="submit" class="button">Create role</button>
      </form>
    </article>
  </section>
{% endblock %}
```

### Job role list page

**File:** `src/views/pages/job-role-list.njk`

- Add admin-only create button/link to `/job-roles/new`.
- Add success banner when `created=true` query param is present.

## Phase 7 - Styling Rule (Important)

- Do not add inline style attributes in Nunjucks templates.
- Do not add `<style>` blocks in templates.
- Put all styling in `public/assets/styles/branding.css`.
- Add class names in templates and style those classes in `branding.css`.

## Phase 8 - Authorization Rules

- Admin-only create endpoints/pages must be protected by `requireAuth` + `requireAdmin`.
- User role (`user`) must not be able to access create endpoints/pages.
- If unauthorized, follow existing middleware behavior consistently.

## Phase 9 - Tests

### `tests/controllers/jobRoleController.test.ts`

Add coverage for:

- `getCreateJobRolePage`
  - success render with metadata
  - missing token redirects `/login`
  - metadata fetch failure returns 500 or renders error state
- `createJobRole`
  - valid payload redirects `/job-roles?created=true`
  - invalid body returns `400` with field errors
  - missing token redirects `/login`
  - service backend `400` re-renders form with error
  - unexpected error returns `500`

### `tests/routes/jobRoleRoutes.test.ts`

Add route coverage:

- `GET /job-roles/new`
  - unauthenticated -> redirect `/login`
  - authenticated non-admin -> forbidden path behavior
  - admin -> delegates to controller
- `POST /job-roles`
  - unauthenticated -> redirect `/login`
  - authenticated non-admin -> forbidden path behavior
  - admin valid body -> controller success path

### `tests/service/jobRoleService.test.ts`

Add service coverage:

- `getJobRoleMetadata`
  - sends `Authorization` header
  - maps response shape correctly
- `createJobRole`
  - posts correct payload and auth header
  - logs and rethrows on axios failure

### `tests/validation/jobRoleSchemas.test.ts` (new)

Add schema tests for:

- accepts valid payload
- rejects missing required fields
- rejects invalid URL
- rejects invalid date
- rejects non-positive IDs
- rejects non-positive open positions

## Files To Change

| File | Change |
|---|---|
| `src/routes/jobRoleRoutes.ts` | Add admin-only create routes |
| `src/controllers/jobRoleController.ts` | Add create page + create submit handlers |
| `src/services/jobRoleService.ts` | Add metadata + create methods |
| `src/models/jobRole.ts` | Add metadata/payload interfaces |
| `src/validation/jobRoleSchemas.ts` | New create schema |
| `src/views/pages/job-role-form.njk` | New create page template |
| `src/views/pages/job-role-list.njk` | Add admin-only create link + success banner |
| `public/assets/styles/branding.css` | Add all create-page/list-banner styles |
| `tests/controllers/jobRoleController.test.ts` | Add controller test coverage |
| `tests/routes/jobRoleRoutes.test.ts` | Add route auth/delegation coverage |
| `tests/service/jobRoleService.test.ts` | Add service coverage |
| `tests/validation/jobRoleSchemas.test.ts` | New schema tests |

## Pre-PR Checklist

1. `npm run format`
2. `npm run lint:fix`
3. `npm run lint`
4. `npm run build`
5. `npm test`
6. `npm run test:coverage`
7. Manual admin smoke test:
   - login as `admin`
   - open `/job-roles`
   - click create role
   - verify dropdowns load from API metadata
   - submit valid form
   - verify redirect to `/job-roles?created=true`
8. Manual user access test:
   - login as `user`
   - verify no create action on list page
   - direct hit `/job-roles/new` blocked by authorization middleware

## Clarification Rule Before Implementation

If any of the following are unclear in a future ticket run, stop and ask before coding:

- API path names or response shape
- exact role string values
- redirect destination after success
- error message conventions for validation/server failures

## Troubleshooting

- If `/job-roles/new` returns `template not found: pages/job-role-form.njk`, verify the file exists at `src/views/pages/job-role-form.njk` with exact spelling.
- After creating the file, restart the dev server and re-test the endpoint.
