---
applyTo: "src/**,tests/**,public/assets/**"
description: "Ticket instructions for admin-triggered job role CSV report download from job role list page."
---

# Admin Job Role Report Ticket Instructions (Frontend)

## Ticket
As an Admin

I want to generate a report of all job roles

So that I can provide an up to date export to stakeholders

## Acceptance Criteria Mapping
- A CSV file is downloaded in the browser containing all job role information.
- Report can be generated from the job roles last page.

## Frontend Responsibilities
- Show a report action on the job roles list page for admins.
- Trigger a server route that downloads CSV to the browser.
- Keep access admin-only.

## Required Frontend Behavior
- UI:
  - Add a "Generate CSV report" action on the job roles list page.
  - Place the action at the bottom area of the list page (last-page action location).
  - Render action for admins only.
- Route:
  - GET /job-roles/report
  - Protect with requireAdmin middleware
- Controller:
  - Read session token
  - Call service method for report bytes
  - Set CSV download headers
  - Send file response
- Service:
  - Call backend GET /job-roles/report
  - Include bearer token
  - Request binary/arraybuffer and return Buffer

## UX and Access Rules
- Non-admin users should not see report action.
- Missing auth should redirect to login.
- Admin authorization failure should return existing forbidden behavior.

## Test Requirements (Frontend)
Add/update tests for:
- Service:
  - calls backend /job-roles/report with auth header
  - handles binary response
  - throws on failure
- Controller:
  - streams CSV with correct headers on success
  - redirects when token missing
  - handles failures with 500 response
- Routes:
  - report route wired and protected
  - happy path returns CSV response for admin

## Styling Guidance
- Reuse existing button style classes where possible.
- Keep placement consistent with current page layout.
- Do not introduce unnecessary visual redesign.

## Done Criteria (Frontend)
- Admin can trigger CSV download from job roles page.
- Non-admin does not have report access.
- Tests updated and passing.
- Existing job role list and detail behavior unchanged.
