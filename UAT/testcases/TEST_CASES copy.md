# Test Cases - Admin Access

This document is organized by test case. Each test case contains:
1. Equivalence Partitioning
2. Boundary Value Analysis
3. Decision Table

---

## Test Case 1: Admin Login and Access Verification

| Field | Value |
|---|---|
| ID | 1 |
| Severity | High |
| Priority | High |
| Preconditions | Admin account exists and is active |

### Equivalence Partitioning

| Input Condition | Partition ID | Valid/Invalid | Example | Expected Result |
|---|---|---|---|---|
| Email provided | TC1-EP-1 | Valid | admin@kainos.com | Continue auth |
| Email missing | TC1-EP-2 | Invalid | "" | "Email and password are required." |
| Password provided | TC1-EP-3 | Valid | AdminPassword123! | Continue auth |
| Password missing | TC1-EP-4 | Invalid | "" | "Email and password are required." |
| Credentials correct | TC1-EP-5 | Valid | admin@kainos.com + correct password | Login success |
| Credentials incorrect | TC1-EP-6 | Invalid | admin@kainos.com + WrongPass123! | "Invalid email or password." |
| Role is ADMIN | TC1-EP-7 | Valid | ADMIN | Admin view shown |
| Role is USER | TC1-EP-8 | Invalid for this case | USER | No admin controls |

Password acceptability for login:
- Acceptable: non-empty password that matches stored password.
- Not acceptable: empty password, or non-empty password that does not match stored password.

Password complexity examples (registration policy, not sign-in validation):
- Accepted: Abcde!123
- Rejected: Ab1!e (length 5)
- Rejected: abcdefghi!1 (no uppercase)
- Rejected: ABCDEFGHI!1 (no lowercase)
- Rejected: Abcdefghi1 (no special character)

### Boundary Value Analysis

| Boundary Item | Test Data | Expected Result |
|---|---|---|
| Email lower boundary | email="", password="AdminPassword123!" | Required fields error |
| Password lower boundary | email="admin@kainos.com", password="" | Required fields error |
| Password minimal non-empty | password="a" | Auth attempt; fails unless it is real password |
| Correct credentials boundary | exact stored admin credentials | Success and admin controls visible |
| Session boundary after logout | logout then open /job-roles/new | Redirect/block until login |

### Decision Table

| Conditions / Actions | R1 | R2 | R3 | R4 | R5 |
|---|---|---|---|---|---|
| Email provided | Y | N | Y | Y | Y |
| Password provided | Y | Y | N | Y | Y |
| Credentials correct | Y | - | - | N | Y |
| Role is ADMIN | Y | - | - | - | N |
| Action: Show required fields error | N | Y | Y | N | N |
| Action: Show invalid credentials | N | N | N | Y | N |
| Action: Login success | Y | N | N | N | Y |
| Action: Show admin controls | Y | N | N | N | N |

---

## Test Case 2: Non-Admin Users Cannot Access Admin Features

| Field | Value |
|---|---|
| ID | 2 |
| Severity | High |
| Priority | High |
| Preconditions | User is authenticated as USER role |

### Equivalence Partitioning

| Input Condition | Partition ID | Valid/Invalid | Example | Expected Result |
|---|---|---|---|---|
| Authenticated session | TC2-EP-1 | Valid | logged-in user | Middleware checks role |
| No session | TC2-EP-2 | Invalid | unauthenticated | Redirect to login |
| Role ADMIN | TC2-EP-3 | Valid for route | ADMIN | Access granted |
| Role USER | TC2-EP-4 | Invalid for route | USER | 403 or blocked |
| Access via UI button | TC2-EP-5 | Valid path | click create/edit | Role guard applies |
| Access via direct URL | TC2-EP-6 | Alternate path | /job-roles/new | Same guard applies |

### Boundary Value Analysis

| Boundary Item | Test Data | Expected Result |
|---|---|---|
| Auth boundary | no session + /job-roles/new | Redirect to login |
| Role boundary non-admin | USER + /job-roles/new | Forbidden/blocked |
| Role boundary admin | ADMIN + /job-roles/new | Allowed |
| Route boundary detail edit | USER + /job-roles/1/edit | Forbidden/blocked |
| UI visibility boundary | switch USER to ADMIN session | Buttons hidden for USER, visible for ADMIN |

### Decision Table

| Conditions / Actions | R1 | R2 | R3 | R4 |
|---|---|---|---|---|
| Session exists | Y | N | Y | Y |
| Role is ADMIN | Y | - | N | N |
| Route is admin-only | Y | Y | Y | Y |
| Action: Redirect to login | N | Y | N | N |
| Action: Return 403/block | N | N | Y | Y |
| Action: Allow access | Y | N | N | N |
| Action: Show admin buttons | Y | N | N | N |

---

## Test Case 3: Admin Create Job Role with Full Validation

| Field | Value |
|---|---|
| ID | 3 |
| Severity | High |
| Priority | High |
| Preconditions | ADMIN logged in, create page accessible |

### Equivalence Partitioning

| Input Condition | Partition ID | Valid/Invalid | Example | Expected Result |
|---|---|---|---|---|
| roleName trimmed non-empty | TC3-EP-1 | Valid | "Senior Engineer" | Accepted |
| roleName blank | TC3-EP-2 | Invalid | "   " | Validation error |
| capabilityId positive int | TC3-EP-3 | Valid | 1 | Accepted |
| capabilityId non-positive/non-numeric | TC3-EP-4 | Invalid | 0, -1, "abc" | Validation error |
| bandId positive int | TC3-EP-5 | Valid | 2 | Accepted |
| bandId non-positive/non-numeric | TC3-EP-6 | Invalid | 0, -1, "abc" | Validation error |
| closingDate parseable | TC3-EP-7 | Valid | 2026-12-31 | Accepted |
| closingDate invalid | TC3-EP-8 | Invalid | not-a-date | Validation error |
| sharepointUrl valid URL | TC3-EP-9 | Valid | https://example.sharepoint.com/job-role | Accepted |
| sharepointUrl invalid | TC3-EP-10 | Invalid | not-a-url | Validation error |
| numberOfOpenPositions positive int | TC3-EP-11 | Valid | 1, 2 | Accepted |
| numberOfOpenPositions invalid | TC3-EP-12 | Invalid | 0, -1, 1.5 | Validation error |

### Boundary Value Analysis

| Boundary Item | Test Data | Expected Result |
|---|---|---|
| roleName lower boundary | "   " | Validation error |
| roleName first valid | "A" | Accepted |
| capabilityId lower boundary | 0 | Validation error |
| capabilityId first valid | 1 | Accepted |
| bandId lower boundary | 0 | Validation error |
| bandId first valid | 1 | Accepted |
| open positions lower boundary | 0 | Validation error |
| open positions first valid | 1 | Accepted |
| date boundary invalid format | not-a-date | Validation error |
| URL boundary invalid format | not-a-url | Validation error |

### Decision Table

| Conditions / Actions | R1 | R2 | R3 | R4 |
|---|---|---|---|---|
| User is ADMIN | Y | N | Y | Y |
| All required fields valid | Y | Y | N | Y |
| Numeric fields > 0 and integer | Y | Y | Y | N |
| Action: Return auth error/forbidden | N | Y | N | N |
| Action: Return validation errors | N | N | Y | Y |
| Action: Create role and redirect created=true | Y | N | N | N |

---

## Test Case 4: Admin Edit Job Role with Validation

| Field | Value |
|---|---|
| ID | 4 |
| Severity | High |
| Priority | High |
| Preconditions | ADMIN logged in, existing job role ID |

### Equivalence Partitioning

| Input Condition | Partition ID | Valid/Invalid | Example | Expected Result |
|---|---|---|---|---|
| Route id positive int | TC4-EP-1 | Valid | 1 | Continue edit flow |
| Route id invalid | TC4-EP-2 | Invalid | 0, -1, "abc" | 400 invalid ID |
| Payload has at least one field | TC4-EP-3 | Valid | { location: "Belfast" } | Accepted |
| Empty payload | TC4-EP-4 | Invalid | {} | Validation error |
| Field values valid | TC4-EP-5 | Valid | openPositions=2 | Accepted |
| Field value invalid | TC4-EP-6 | Invalid | openPositions=0 | Validation error |
| Backend update success | TC4-EP-7 | Valid | 200 | Redirect editSuccess=true |
| Backend update failure | TC4-EP-8 | Invalid | 400/404/500 | Error response/render |

### Boundary Value Analysis

| Boundary Item | Test Data | Expected Result |
|---|---|---|
| ID lower boundary | id=0 | 400 invalid ID |
| ID first valid | id=1 | Edit allowed |
| ID invalid type | id="abc" | 400 invalid ID |
| Payload lower boundary | {} | Validation error |
| Minimal valid payload | { roleName: "X" } | Accepted |
| open positions lower boundary | 0 | Validation error |
| open positions first valid | 1 | Accepted |

### Decision Table

| Conditions / Actions | R1 | R2 | R3 | R4 | R5 |
|---|---|---|---|---|---|
| User is ADMIN | Y | N | Y | Y | Y |
| Route id valid | Y | Y | N | Y | Y |
| Payload valid | Y | Y | Y | N | Y |
| Backend update success | Y | - | - | - | N |
| Action: Return auth error/forbidden | N | Y | N | N | N |
| Action: Return 400 invalid ID | N | N | Y | N | N |
| Action: Return validation errors | N | N | N | Y | N |
| Action: Redirect with editSuccess=true | Y | N | N | N | N |
| Action: Show update failure message | N | N | N | N | Y |

---

## Test Case 5: Admin Generate CSV Report

| Field | Value |
|---|---|
| ID | 5 |
| Severity | High |
| Priority | High |
| Preconditions | ADMIN logged in, report endpoint available |

### Equivalence Partitioning

| Input Condition | Partition ID | Valid/Invalid | Example | Expected Result |
|---|---|---|---|---|
| Role is ADMIN | TC5-EP-1 | Valid | ADMIN | Report allowed |
| Role not ADMIN | TC5-EP-2 | Invalid | USER | Hidden/forbidden |
| Dataset empty | TC5-EP-3 | Valid edge | 0 roles | Header-only CSV |
| Dataset non-empty | TC5-EP-4 | Valid | 1+ roles | CSV with rows |
| Backend report success | TC5-EP-5 | Valid | 200 CSV | File downloads |
| Backend report failure | TC5-EP-6 | Invalid | timeout/500 | Friendly error |

### Boundary Value Analysis

| Boundary Item | Test Data | Expected Result |
|---|---|---|
| Dataset lower boundary | 0 roles | CSV with headers only |
| Dataset first valid non-empty | 1 role | CSV with 1 data row |
| Dataset page boundary | 10 then 11 roles | CSV includes all roles |
| Access boundary non-admin | USER attempts report | Blocked |
| CSV escaping boundary | roleName="Engineer, Senior" | Valid CSV formatting |

### Decision Table

| Conditions / Actions | R1 | R2 | R3 | R4 |
|---|---|---|---|---|
| User is ADMIN | Y | N | Y | Y |
| Backend report success | Y | - | Y | N |
| Dataset has rows | Y | - | N | - |
| Action: Download CSV with data rows | Y | N | N | N |
| Action: Download header-only CSV | N | N | Y | N |
| Action: Block access | N | Y | N | N |
| Action: Show report error | N | N | N | Y |

---

## Test Case 6: Admin View and Manage Job Applications

| Field | Value |
|---|---|
| ID | 6 |
| Severity | High |
| Priority | High |
| Preconditions | ADMIN logged in, applications exist or empty state available |

### Equivalence Partitioning

| Input Condition | Partition ID | Valid/Invalid | Example | Expected Result |
|---|---|---|---|---|
| Role is ADMIN | TC6-EP-1 | Valid | ADMIN | Page accessible |
| Role not ADMIN | TC6-EP-2 | Invalid | USER | Access blocked |
| Application status actionable | TC6-EP-3 | Valid | Pending | Hire/Reject enabled |
| Application status non-actionable | TC6-EP-4 | Valid non-actionable | Hired/Rejected | Actions hidden/disabled |
| CV link exists | TC6-EP-5 | Valid | valid key/url | Download works |
| CV link missing | TC6-EP-6 | Invalid | missing key | Graceful error |
| Action API success | TC6-EP-7 | Valid | Hire/Reject 200 | Status persists |
| Action API failure | TC6-EP-8 | Invalid | 500/timeout | Friendly error |

### Boundary Value Analysis

| Boundary Item | Test Data | Expected Result |
|---|---|---|
| Application list lower boundary | 0 applications | Empty state |
| Application list first non-empty | 1 pending application | One row with actions |
| Valid transition boundary | Pending -> Hired | Persisted update |
| Valid transition boundary | Pending -> Rejected | Persisted update |
| Non-actionable boundary | Hired/Rejected row | No action allowed |
| CV availability boundary | Missing CV | Graceful failure message |
| Concurrent update boundary | two admins update same row | One success, one safe failure/refresh |

### Decision Table

| Conditions / Actions | R1 | R2 | R3 | R4 | R5 |
|---|---|---|---|---|---|
| User is ADMIN | Y | N | Y | Y | Y |
| Application status is Pending | Y | - | N | Y | Y |
| CV exists | Y | - | Y | N | Y |
| Action API success | Y | - | - | - | N |
| Action: Show access denied | N | Y | N | N | N |
| Action: Allow Hire/Reject | Y | N | N | N | N |
| Action: Disable actions | N | N | Y | N | N |
| Action: Show CV error | N | N | N | Y | N |
| Action: Persist new status + success message | Y | N | N | N | N |
| Action: Show action failure message | N | N | N | N | Y |
