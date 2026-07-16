---
applyTo: "src/**,tests/**,public/assets/**"
description: "Instructions for US052 frontend: admin-only role application listing with CV links and hire/reject actions."
---

# US052 - Admin Application Management (Frontend)

## Ticket
As a Recruitment Admin

I want to see a list of applications for each role

So that I can assess who should be hired

## Scope Clarification
- This ticket is frontend implementation only (routes/controllers/services/views/tests).
- Backend endpoints are already available and protected for admin-only access.
- Confirmation dialogs are in scope for frontend in this ticket.
- Keep existing apply flow for applicants unchanged.

## Acceptance Criteria Mapping (Frontend)
- On the job role information page, admin users can see a list of applicants with application status.
- Each applicant username is clickable and opens the applicant CV (presigned download URL) in a new tab.
- If status is In Progress, show Hire and Reject actions.
- On Hire confirmation, call frontend action endpoint, update status to Hired, and show decremented open positions from backend response.
- On Reject confirmation, call frontend action endpoint, update status to Rejected.
- Non-admin users must not see admin application-management UI.

## Existing Code Context (Use, Do Not Duplicate)
- Job role detail page already exists at src/views/pages/job-role-information.njk.
- Job role detail route already exists at GET /job-roles/:id in src/routes/jobRoleRoutes.ts.
- Auth/session data already sets res.locals.isAdmin in src/app.ts.
- Shared service class already exists in src/services/jobRoleService.ts.

## Backend Contract Assumption
Use these backend API endpoints from frontend service methods:
- GET /job-roles/:id/applications
- PATCH /job-roles/:id/applications/:applicationId/hire
- PATCH /job-roles/:id/applications/:applicationId/reject

All backend calls must include Authorization: Bearer <token> in service layer.

## Phase 1 - Model Types
File: src/models/jobRole.ts

Add frontend interfaces for admin application management:
- JobRoleApplicationStatus values: In Progress, Hired, Rejected
- JobRoleApplicantSummary:
  - applicationId
  - userId
  - username
  - status
  - appliedAt
  - cvDownloadUrl
- JobRoleAdminApplicationsResponse:
  - jobRoleId
  - roleName
  - numberOfOpenPositions
  - applicants
- HireApplicantResponse:
  - applicationId
  - status
  - numberOfOpenPositions
- RejectApplicantResponse:
  - applicationId
  - status

Keep names explicit and intent-based.

## Phase 2 - Service Methods
File: src/services/jobRoleService.ts

Add methods:
- getJobRoleApplicationsForAdmin(jobRoleId: number, token: string)
- hireApplicant(jobRoleId: number, applicationId: number, token: string)
- rejectApplicant(jobRoleId: number, applicationId: number, token: string)

Implementation rules:
- Build auth headers in service, not controller.
- Use existing apiClient and existing error logging pattern.
- Use PATCH for hire/reject backend calls.
- Rethrow errors after logging.

## Phase 3 - Controller Changes
File: src/controllers/jobRoleController.ts

### 1. Extend getJobRoleById
- Keep existing behavior for all users.
- If res.locals.isAdmin is true and token exists:
  - call service getJobRoleApplicationsForAdmin(jobRoleId, token)
  - pass applicants data to detail page render model.
- If applicant list call fails for admin:
  - do not break role detail page.
  - render page with jobRole data and an adminApplicationsError message.

### 2. Add action handlers
Add controller handlers for form submissions:
- hireApplicant(req, res)
- rejectApplicant(req, res)

Rules:
- Validate job role id and application id as positive integers.
- Require session token; otherwise redirect to /login.
- Call service method.
- Redirect back to /job-roles/:id with query markers:
  - ?applicationAction=hire-success
  - ?applicationAction=reject-success
  - ?applicationAction=error for handled failures
- Keep user-facing errors safe.

## Phase 4 - Route Wiring
File: src/routes/jobRoleRoutes.ts

Add admin-only frontend action routes:
- POST /job-roles/:id/applications/:applicationId/hire
- POST /job-roles/:id/applications/:applicationId/reject

Use middleware order:
1. requireAuth
2. requireAdmin
3. controller handler

Do not expose these actions to non-admin users.

## Phase 5 - Detail Page UI
File: src/views/pages/job-role-information.njk

Add an admin-only section under role details:
- Section heading: Applicants
- Table/list rows showing:
  - username as link to cvDownloadUrl, target _blank, rel noopener noreferrer
  - application status
  - appliedAt (formatted if needed)
- For status In Progress only:
  - show Hire form button/link posting to hire route
  - show Reject form button/link posting to reject route

If no applicants, show a clear empty state message.
If adminApplicationsError exists, show non-sensitive error text.

## Phase 6 - Confirmation UX
Files:
- src/views/pages/job-role-information.njk
- public/assets/scripts/job-role-admin-applications.js (new)

Requirements:
- Add data attributes to Hire/Reject forms or buttons.
- Attach one delegated submit listener.
- Show window.confirm for:
  - hire confirmation
  - reject confirmation
- Only submit when confirmed.

Do not put inline script blocks in the template.
Include script from template only for admin view.

## Phase 7 - Styling
File: public/assets/styles/branding.css

Add classes for:
- admin application section container
- applicants list/table rows
- status badge variants (In Progress/Hired/Rejected)
- action buttons/links
- error/empty states

Do not use inline style attributes in templates.

## Phase 8 - Tests
### tests/controllers/jobRoleController.test.ts
Add coverage for:
- getJobRoleById includes applicants for admin
- getJobRoleById still renders without applicants for non-admin
- getJobRoleById handles applicants fetch failure gracefully
- hireApplicant success redirect
- rejectApplicant success redirect
- invalid ids return 400
- missing token redirects /login
- backend 400/404/500 mapped to safe redirects or responses

### tests/routes/jobRoleRoutes.test.ts
Add route coverage for:
- POST /job-roles/:id/applications/:applicationId/hire
  - unauthenticated redirects /login
  - non-admin forbidden behavior
  - admin delegates to controller
- POST /job-roles/:id/applications/:applicationId/reject
  - unauthenticated redirects /login
  - non-admin forbidden behavior
  - admin delegates to controller

### tests/service/jobRoleService.test.ts
Add coverage for:
- getJobRoleApplicationsForAdmin calls correct endpoint + auth header
- hireApplicant calls patch endpoint + auth header
- rejectApplicant calls patch endpoint + auth header
- error paths log and rethrow

## Files To Change
- src/models/jobRole.ts
- src/services/jobRoleService.ts
- src/controllers/jobRoleController.ts
- src/routes/jobRoleRoutes.ts
- src/views/pages/job-role-information.njk
- public/assets/scripts/job-role-admin-applications.js (new)
- public/assets/styles/branding.css
- tests/controllers/jobRoleController.test.ts
- tests/routes/jobRoleRoutes.test.ts
- tests/service/jobRoleService.test.ts

## Pre-PR Checklist
1. npm run format
2. npm run lint:fix
3. npm run lint
4. npm run build
5. npm test
6. npm run test:coverage

## Manual Verification
1. Login as admin and open /job-roles/:id for a role with applications.
2. Verify applicants list, statuses, and clickable CV links render.
3. For In Progress application, click Hire and confirm dialog.
4. Verify redirect to role detail and updated status/open positions.
5. For another In Progress application, click Reject and confirm dialog.
6. Verify redirect to role detail and status updated to Rejected.
7. Login as non-admin and verify no admin applicant management UI/actions are available.

## Clarification Rule
If any of these are unclear, ask before implementing:
- exact redirect query string after action
- exact date format for appliedAt in UI
- expected message copy for success/error banners
- whether hire/reject should be button or text-link style
