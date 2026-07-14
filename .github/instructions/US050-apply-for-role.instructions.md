---
applyTo: "**"
description: "Instructions for US050: Apply for a Job Role. Covers canApply logic, upload-cv proxy route, JWT userId extraction, service normalisation, submit redirect, and tests."
---

# US050 — Apply for a Job Role

## What Is Already Done — Do Not Recreate

- `src/views/pages/job-role-application.njk` — complete, includes two-phase JS upload flow
- `src/views/pages/job-role-information.njk` — includes `{% if canApply %}` apply button and `{% if applicationSubmitted %}` success banner
- Routes already registered in `src/routes/jobRoleRoutes.ts`:
  - `GET /job-roles/:id/apply` with `requireAuth`
  - `POST /job-roles/:id/apply` with `requireAuth`
- Controller stubs already in `src/controllers/jobRoleController.ts`:
  - `getJobRoleApplicationPage` — fully implemented, renders the application page
  - `submitJobRoleApplication` — empty stub, implement in Phase 6

---

## Backend Contract

Single backend endpoint for this feature:

- **Method/path:** `POST /api/job-roles/:id/apply`
- **Request body:** `{ userId: number, fileName: string, contentType: string }`
- **Header:** `Authorization: Bearer <token>`
- **Response:** `{ uploadUrl: string, key: string }`
  - `uploadUrl` is a pre-signed S3 URL for a direct `PUT` upload
  - `key` is the S3 object key — must be normalised to `objectKey` in the service before returning to the controller, because the view's JS reads `uploadDetails.objectKey`

This single call both creates the application record (status: in progress) in the database and returns the pre-signed upload URL.

---

## End-to-End Flow

1. User submits the application form; JavaScript in the view intercepts the submit event.
2. JS validates the file client-side (type and size), then POSTs JSON to `POST /job-roles/:id/apply/upload-cv` with `{ fileName, contentType, fileSizeBytes }`.
3. The frontend controller decodes the JWT to extract `userId`, then calls the service.
4. The service POSTs to the backend with `{ userId, fileName, contentType }` and returns `{ uploadUrl, objectKey }`.
5. The controller returns `res.json({ uploadUrl, objectKey })` to the browser JS.
6. JS uploads the file directly to S3 via `PUT uploadUrl`.
7. JS sets hidden form fields and submits the HTML form to `POST /job-roles/:id/apply`.
8. The `submitJobRoleApplication` controller validates the ID and redirects to `/job-roles/:id?applicationSubmitted=true`.
9. `getJobRoleById` reads `req.query.applicationSubmitted` and passes it to the render model so the success banner appears.

---

## Phase 1 — canApply and applicationSubmitted in getJobRoleById

**File:** `src/controllers/jobRoleController.ts`

Update `getJobRoleById` — after fetching the job role successfully:

1. Derive `canApply`:
   ```typescript
   const canApply =
     jobRole.status === JobRoleStatus.Open && jobRole.numberOfOpenPositions > 0;
   ```

2. Read the query parameter:
   ```typescript
   const applicationSubmitted = req.query.applicationSubmitted === 'true';
   ```

3. Update the render call:
   ```typescript
   res.render("pages/job-role-information.njk", { jobRole, canApply, applicationSubmitted });
   ```

---

## Phase 2 — New Upload-CV Route

**File:** `src/routes/jobRoleRoutes.ts`

Add one new route:

```typescript
router.post("/job-roles/:id/apply/upload-cv", requireAuth, (req, res) =>
  controller.getUploadCvUrl(req, res),
);
```

---

## Phase 3 — Validation Schema

**File:** `src/validation/applicationSchemas.ts` (new file)

Create a Zod schema `UploadCvRequestSchema`:

```typescript
import { z } from "zod";

export const UploadCvRequestSchema = z.object({
  fileName: z.string().min(1, "File name is required."),
  contentType: z.string().min(1, "Content type is required."),
});

export type UploadCvRequestData = z.infer<typeof UploadCvRequestSchema>;
```

`fileSizeBytes` is sent by the view but is not forwarded to the backend and does not need server-side validation here — client-side validation in the view already enforces the size limit.

---

## Phase 4 — Model Interface

**File:** `src/models/jobRole.ts`

Add to the existing file:

```typescript
export interface UploadCvResponse {
  uploadUrl: string;
  objectKey: string;
}
```

---

## Phase 5 — Service Method: getUploadCvUrl

**File:** `src/services/jobRoleService.ts`

Add a new method to `JobRoleService`:

```typescript
async getUploadCvUrl(
  jobRoleId: number,
  userId: number,
  fileName: string,
  contentType: string,
  token: string,
): Promise<UploadCvResponse>
```

Implementation rules:

- POST to `/job-roles/${jobRoleId}/apply` using `apiClient`
- Request body: `{ userId, fileName, contentType }`
- Header: `Authorization: Bearer ${token}` — construct the header here, not in the controller
- The backend returns `{ uploadUrl, key }` — normalise before returning:
  ```typescript
  return { uploadUrl: response.data.uploadUrl, objectKey: response.data.key };
  ```
- Wrap in try/catch; call `this.logRequestError(...)` on error, then rethrow

---

## Phase 6 — Controller Method: getUploadCvUrl

**File:** `src/controllers/jobRoleController.ts`

Add a new `async getUploadCvUrl(req, res)` method. This is an AJAX endpoint called by the view's JS fetch — it returns JSON, not a redirect or render.

Steps:

1. Parse and validate `id`:
   ```typescript
   const jobRoleId = Number(req.params.id);
   if (!Number.isInteger(jobRoleId) || jobRoleId <= 0) {
     res.status(400).json({ error: "Invalid job role ID" });
     return;
   }
   ```

2. Validate the request body using `UploadCvRequestSchema.safeParse(req.body)`. On failure, return `res.status(400).json({ error: result.error.issues[0].message })`.

3. Read the token from `req.session.jwtToken`. If absent, return `res.status(401).json({ error: "Not authenticated" })`.

4. Decode `userId` from the JWT payload — no external library is needed:
   ```typescript
   const payload = JSON.parse(
     Buffer.from(token.split('.')[1], 'base64url').toString('utf8'),
   );
   const userId: number = payload.id;
   ```
   If `userId` is not a valid number, return `res.status(401).json({ error: "Invalid session" })`.

5. Call `this.jobRoleService.getUploadCvUrl(jobRoleId, userId, fileName, contentType, token)`.

6. Return `res.json({ uploadUrl, objectKey })`.

7. On error: use `axios.isAxiosError(error)` to check status — map 400 → 400 JSON, 404 → 404 JSON; default to `res.status(500).json({ error: "Could not prepare CV upload. Please try again." })`.

---

## Phase 7 — Controller Method: submitJobRoleApplication

**File:** `src/controllers/jobRoleController.ts`

Implement the existing stub:

1. Parse and validate `id`. If not a positive integer, return `res.status(400).send("Invalid job role ID")`.
2. Redirect: `res.redirect(\`/job-roles/${jobRoleId}?applicationSubmitted=true\`)`.

No service call is needed — the application record was already created in the upload-cv step.

---

## Phase 8 — Tests

### tests/controllers/jobRoleController.test.ts

**`getJobRoleById` — new cases:**
- When `status === 'Open'` and `numberOfOpenPositions > 0`, `canApply: true` is passed to render.
- When `status === 'Closed'` or `numberOfOpenPositions === 0`, `canApply: false` is passed to render.
- When `req.query.applicationSubmitted === 'true'`, `applicationSubmitted: true` is passed to render.

**`getUploadCvUrl` — new test suite:**
- Happy path: service returns `{ uploadUrl, objectKey }`, controller calls `res.json` with those values.
- Invalid ID (e.g. `"abc"`): returns status 400 JSON.
- Body fails Zod validation (e.g. missing `fileName`): returns status 400 JSON.
- Missing session token: returns status 401 JSON.
- Service throws an AxiosError with status 400: returns status 400 JSON.
- Service throws a non-axios error: returns status 500 JSON.

**`submitJobRoleApplication` — new test suite:**
- Valid ID: calls `res.redirect` with `/job-roles/${id}?applicationSubmitted=true`.
- Invalid ID: returns status 400.

### tests/routes/jobRoleRoutes.test.ts

- `POST /job-roles/1/apply/upload-cv` without auth: should redirect to `/login`.
- `POST /job-roles/1/apply/upload-cv` with auth mocked: should delegate to the controller (not redirect to login).

### tests/service/jobRoleService.test.ts

**`getUploadCvUrl` — new test suite:**
- Happy path: `apiClient.post` called with `/job-roles/1/apply`, body `{ userId: 1, fileName: 'cv.pdf', contentType: 'application/pdf' }`, and `Authorization: Bearer <token>` header; returns `{ uploadUrl: '...', objectKey: '...' }` with `key` normalised to `objectKey`.
- Error path: `apiClient.post` rejects with an AxiosError — `logRequestError` is invoked and the error is rethrown.

---

## Files to Change

| File | Change |
|---|---|
| `src/routes/jobRoleRoutes.ts` | Add upload-cv route |
| `src/controllers/jobRoleController.ts` | Update `getJobRoleById`; add `getUploadCvUrl`; implement `submitJobRoleApplication` |
| `src/services/jobRoleService.ts` | Add `getUploadCvUrl` |
| `src/models/jobRole.ts` | Add `UploadCvResponse` interface |
| `src/validation/applicationSchemas.ts` | New file — `UploadCvRequestSchema` |
| `tests/controllers/jobRoleController.test.ts` | New and updated test cases |
| `tests/routes/jobRoleRoutes.test.ts` | New route test |
| `tests/service/jobRoleService.test.ts` | New service test |

---

## Pre-PR Checklist

1. `npm run format`
2. `npm run lint:fix`
3. `npm run lint`
4. `npm run build`
5. `npm test`
6. `npm run test:coverage`
7. Manual: sign in → view a role with `status=Open` and `numberOfOpenPositions > 0` → Apply button visible → upload a valid PDF → redirected back to job info page with success banner.
8. Manual: role with `status=Closed` or `numberOfOpenPositions === 0` → no Apply button shown.
