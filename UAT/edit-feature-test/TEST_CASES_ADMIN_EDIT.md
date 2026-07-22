# Test Case Scenarios: Admin Edit Job Role Feature

**Feature:** Admin Edit Job Role  
**Module:** Job Role Management  
**Project:** Team 3 Frontend  
**Last Updated:** 2026-07-20  

---

## Overview

This document contains comprehensive test cases for the Admin Edit Job Role feature using multiple test design techniques:
- Equivalence Partitioning (EP)
- Boundary Value Analysis (BVA)
- Decision Tables (DT)
- Error Guessing (EG)
- Risk Based Testing (RBT)
- Use Case Testing (UCT)

---

## TEST CASE 1: Equivalence Partitioning - Valid Single Field Update

| **Field** | **Value** |
|-----------|-----------|
| **ID** | TC-EDIT-001 |
| **Module/Area** | Job Role Management |
| **Priority** | High |
| **Status** | Ready |

**Title:** Update Job Role with Valid Role Name Only

**Preconditions:**
- Admin user is logged in
- Valid JWT token exists in session
- Job role with ID 1 exists in system
- Edit page is rendered with current job role values

**Test Steps:**
1. Navigate to `/job-roles/1/edit`
2. Clear the current role name field
3. Enter new role name: "Name Test 1"
4. Leave all other fields unchanged
5. Click "Update" button
6. Verify redirect occurs

**Expected Results:**
- Request body contains only `{ roleName: "Name Test 1" }`
- Backend receives PATCH request with Authorization header
- Server responds with 200 OK
- Redirect to `/job-roles/1?editSuccess=true`
- Success banner appears on job role detail page

**Test Data:**
```json
{
  "roleName": "Name Test 1"
}
```

**Pass/Fail Criteria:** ✓ PASS if redirected successfully with success banner

| **Attachments** | ![Job Role Update Success](/images/Screenshot%202026-07-20%20at%2011.41.07.png)
|---|---|

---

## TEST CASE 2: Equivalence Partitioning - Valid Location Update

| **Field** | **Value** |
|-----------|-----------|
| **ID** | TC-EDIT-002 |
| **Module/Area** | Job Role Management |
| **Priority** | High |
| **Status** | Ready |

**Title:** Update Job Role with Valid Location Only

**Preconditions:**
- Admin user is logged in
- Valid JWT token exists in session
- Job role with ID 1 exists
- Current location is "Dublin"

**Test Steps:**
1. Navigate to `/job-roles/1/edit`
2. Update location field to "London"
3. Submit the form
4. Verify response status

**Expected Results:**
- Request body: `{ location: "London" }`
- Response: 200 OK with updated job role
- Redirect to success page
- Location change persists

**Test Data:**
```json
{
  "location": "London"
}
```

**Pass/Fail Criteria:** ✓ PASS if location successfully updates

---

## TEST CASE 3: Boundary Value Analysis - Minimum String Length (Role Name)

| **Field** | **Value** |
|-----------|-----------|
| **ID** | TC-EDIT-003 |
| **Module/Area** | Job Role Management |
| **Priority** | High |
| **Status** | Ready |

**Title:** Update Role Name with Minimum Valid Length (1 Character)

**Preconditions:**
- Admin is logged in
- Edit page is loaded for job role ID 1

**Test Steps:**
1. Navigate to `/job-roles/1/edit`
2. Clear role name field
3. Enter single character: "A"
4. Submit form

**Expected Results:**
- Validation passes (minimum length is 1)
- PATCH request sent with `{ roleName: "A" }`
- 200 OK response
- Update succeeds

**Test Data:**
```json
{
  "roleName": "A"
}
```

**Pass/Fail Criteria:** ✓ PASS if accepted and updated

---

## TEST CASE 4: Boundary Value Analysis - Empty String (Role Name)

| **Field** | **Value** |
|-----------|-----------|
| **ID** | TC-EDIT-004 |
| **Module/Area** | Job Role Management |
| **Priority** | High |
| **Status** | Ready |

**Title:** Update Role Name with Empty String Should Fail

**Preconditions:**
- Admin is logged in
- Edit page is loaded

**Test Steps:**
1. Navigate to `/job-roles/1/edit`
2. Clear role name field completely
3. Leave field empty (or enter whitespace only)
4. Submit form

**Expected Results:**
- Validation error: "Role name is required."
- Form re-renders with error message
- No PATCH request sent
- Page stays on edit form

**Test Data:**
```json
{
  "roleName": ""
}
```

**Pass/Fail Criteria:** ✓ PASS if validation error displayed

---

## TEST CASE 5: Boundary Value Analysis - Number of Open Positions

| **Field** | **Value** |
|-----------|-----------|
| **ID** | TC-EDIT-005 |
| **Module/Area** | Job Role Management |
| **Priority** | High |
| **Status** | Ready |

**Title:** Update Number of Open Positions with Boundary Values

**Preconditions:**
- Admin is logged in
- Edit page is loaded

**Test Steps:**
1. Navigate to `/job-roles/1/edit`
2. Update `numberOfOpenPositions` to: 1 (minimum)
3. Submit form
4. Verify update succeeds
5. Repeat with: 999 (large valid number)
6. Repeat with: 0 (should fail)

**Expected Results:**
- Value 1: ✓ PASS - updates successfully
- Value 999: ✓ PASS - updates successfully
- Value 0: ✗ FAIL - validation error "must be greater than 0"
- Value -1: ✗ FAIL - validation error

**Test Data:**
```json
[
  { "numberOfOpenPositions": 1 },
  { "numberOfOpenPositions": 999 },
  { "numberOfOpenPositions": 0 },
  { "numberOfOpenPositions": -1 }
]
```

**Pass/Fail Criteria:** ✓ PASS if only positive integers accepted

---

## TEST CASE 6: Boundary Value Analysis - Closing Date

| **Field** | **Value** |
|-----------|-----------|
| **ID** | TC-EDIT-006 |
| **Module/Area** | Job Role Management |
| **Priority** | High |
| **Status** | Ready |

**Title:** Update Closing Date with Valid and Invalid Dates

**Preconditions:**
- Admin is logged in
- Edit page loaded

**Test Steps:**
1. Test with valid future date: "2026-12-31"
2. Test with valid past date: "2025-01-01"
3. Test with invalid format: "31/12/2026"
4. Test with invalid date: "2026-02-30"

**Expected Results:**
- Valid dates: ✓ PASS - updates successfully
- Invalid formats/dates: ✗ FAIL - "Closing date must be a valid date" error

**Test Data:**
```json
[
  { "closingDate": "2026-12-31" },
  { "closingDate": "2025-01-01" },
  { "closingDate": "31/12/2026" },
  { "closingDate": "2026-02-30" }
]
```

**Pass/Fail Criteria:** ✓ PASS if only ISO date format accepted

---

## TEST CASE 7: Boundary Value Analysis - SharePoint URL

| **Field** | **Value** |
|-----------|-----------|
| **ID** | TC-EDIT-007 |
| **Module/Area** | Job Role Management |
| **Priority** | Medium |
| **Status** | Ready |

**Title:** Update SharePoint URL with Valid and Invalid URLs

**Preconditions:**
- Admin is logged in
- Edit page loaded

**Test Steps:**
1. Test valid URL: "https://example.sharepoint.com/site"
2. Test valid HTTPS only
3. Test invalid (HTTP only): "http://example.com"
4. Test malformed: "not a url"
5. Test with special chars: "https://example.com/path?query=value"

**Expected Results:**
- Valid HTTPS URLs: ✓ PASS
- Invalid formats: ✗ FAIL - "SharePoint URL must be a valid URL" error

**Test Data:**
```json
[
  { "sharepointUrl": "https://example.sharepoint.com/site" },
  { "sharepointUrl": "https://company.sharepoint.com/job-roles/role1" },
  { "sharepointUrl": "http://example.com" },
  { "sharepointUrl": "not a url" },
  { "sharepointUrl": "https://example.com/path?query=value" }
]
```

**Pass/Fail Criteria:** ✓ PASS if valid HTTPS URLs accepted and invalid rejected

---

## TEST CASE 8: Decision Table - Multiple Field Updates

| **Field** | **Value** |
|-----------|-----------|
| **ID** | TC-EDIT-008 |
| **Module/Area** | Job Role Management |
| **Priority** | High |
| **Status** | Ready |

**Title:** Update Multiple Fields Simultaneously

| Test Case | roleName | location | capabilityId | bandId | closingDate | Expected Result |
|-----------|----------|----------|--------------|--------|-------------|-----------------|
| DT-01 | Valid | Valid | Valid | Valid | Valid | ✓ SUCCESS |
| DT-02 | Empty | Valid | Valid | Valid | Valid | ✗ FAIL - roleName error |
| DT-03 | Valid | Empty | Valid | Valid | Valid | ✗ FAIL - location error |
| DT-04 | Valid | Valid | 0 | Valid | Valid | ✗ FAIL - capabilityId error |
| DT-05 | Valid | Valid | Valid | 0 | Valid | ✗ FAIL - bandId error |
| DT-06 | Valid | Valid | Valid | Valid | Invalid | ✗ FAIL - closingDate error |
| DT-07 | Valid | Valid | Valid | Valid | Valid | ✓ SUCCESS |

**Preconditions:**
- Admin is logged in
- Edit page loaded with job role ID 1
- Valid values: roleName="Manager", location="NYC", capabilityId=2, bandId=3, closingDate="2026-12-31"

**Test Steps:**
1. For each row in decision table
2. Update specified fields with given values
3. Submit form
4. Verify expected result

**Test Data:**
```json
[
  {
    "case": "DT-01",
    "data": { "roleName": "Manager", "location": "NYC", "capabilityId": 2, "bandId": 3, "closingDate": "2026-12-31" },
    "expected": "SUCCESS"
  },
  {
    "case": "DT-02",
    "data": { "roleName": "", "location": "NYC", "capabilityId": 2, "bandId": 3, "closingDate": "2026-12-31" },
    "expected": "FAIL"
  },
  {
    "case": "DT-03",
    "data": { "roleName": "Manager", "location": "", "capabilityId": 2, "bandId": 3, "closingDate": "2026-12-31" },
    "expected": "FAIL"
  }
]
```

**Pass/Fail Criteria:** ✓ PASS if all decision table outcomes match expected results

---

## TEST CASE 9: Decision Table - Status and Position Updates

| **Field** | **Value** |
|-----------|-----------|
| **ID** | TC-EDIT-009 |
| **Module/Area** | Job Role Management |
| **Priority** | High |
| **Status** | Ready |

**Title:** Update Status and Number of Positions with Various Combinations

| status | numberOfOpenPositions | Expected | Validation |
|--------|----------------------|----------|-----------|
| Open | 1 | ✓ SUCCESS | Valid |
| Closed | 0 | ✓ SUCCESS | Valid |
| Open | 5 | ✓ SUCCESS | Valid |
| Closed | 5 | ✓ SUCCESS | Valid |
| Invalid | 1 | ✗ FAIL | Invalid status |
| Open | 0 | ✗ FAIL | Invalid position count |
| Open | -1 | ✗ FAIL | Invalid position count |

**Preconditions:**
- Admin is logged in
- Edit page loaded

**Test Steps:**
1. Update status to "Open", numberOfOpenPositions to 1
2. Submit and verify success
3. Update status to "Closed", numberOfOpenPositions to 0
4. Submit and verify success
5. Attempt invalid status value
6. Verify validation error

**Test Data:**
```json
[
  { "status": "Open", "numberOfOpenPositions": 1 },
  { "status": "Closed", "numberOfOpenPositions": 0 },
  { "status": "Open", "numberOfOpenPositions": 5 },
  { "status": "InvalidStatus", "numberOfOpenPositions": 1 },
  { "status": "Open", "numberOfOpenPositions": 0 }
]
```

**Pass/Fail Criteria:** ✓ PASS if only valid combinations accepted

---

## TEST CASE 10: Error Guessing - Invalid Job Role ID

| **Field** | **Value** |
|-----------|-----------|
| **ID** | TC-EDIT-010 |
| **Module/Area** | Job Role Management |
| **Priority** | High |
| **Status** | Ready |

**Title:** Attempt Edit with Invalid Job Role ID

**Preconditions:**
- Admin is logged in

**Test Steps:**
1. Navigate to `/job-roles/abc/edit` (non-numeric ID)
2. Navigate to `/job-roles/0/edit` (zero ID)
3. Navigate to `/job-roles/-1/edit` (negative ID)
4. Navigate to `/job-roles/999999/edit` (non-existent ID)

**Expected Results:**
- Non-numeric ID: 400 Bad Request "Invalid job role ID"
- Zero ID: 400 Bad Request "Invalid job role ID"
- Negative ID: 400 Bad Request "Invalid job role ID"
- Non-existent ID: 404 Not Found from backend

**Test Data:**
```json
{
  "invalidIds": ["abc", "0", "-1", "999999", "1.5"]
}
```

**Pass/Fail Criteria:** ✓ PASS if proper error handling for all invalid IDs

---

## TEST CASE 11: Error Guessing - Missing Authentication Token

| **Field** | **Value** |
|-----------|-----------|
| **ID** | TC-EDIT-011 |
| **Module/Area** | Job Role Management |
| **Priority** | Critical |
| **Status** | Ready |

**Title:** Attempt Edit Without Valid JWT Token

**Preconditions:**
- Session exists but JWT token is missing or null
- Attempting to access edit page

**Test Steps:**
1. Clear session JWT token
2. Navigate to `/job-roles/1/edit`
3. Try to submit form without token

**Expected Results:**
- GET request: Redirect to `/login`
- POST request: Redirect to `/login` or 401 Unauthorized response

**Pass/Fail Criteria:** ✓ PASS if redirected to login on both GET and POST

---

## TEST CASE 12: Error Guessing - Non-Admin User Access

| **Field** | **Value** |
|-----------|-----------|
| **ID** | TC-EDIT-012 |
| **Module/Area** | Job Role Management |
| **Priority** | Critical |
| **Status** | Ready |

**Title:** Non-Admin User Attempts to Access Edit Page

**Preconditions:**
- User with role "user" (not "admin") is logged in
- Valid JWT token exists

**Test Steps:**
1. User with role="user" navigates to `/job-roles/1/edit`
2. User attempts to POST to `/job-roles/1/edit`

**Expected Results:**
- GET request: 403 Forbidden or redirect to unauthorized page
- POST request: 403 Forbidden
- No edit form rendered
- Edit action not visible on detail page

**Pass/Fail Criteria:** ✓ PASS if non-admin access blocked

---

## TEST CASE 13: Error Guessing - Malformed Request Body

| **Field** | **Value** |
|-----------|-----------|
| **ID** | TC-EDIT-013 |
| **Module/Area** | Job Role Management |
| **Priority** | High |
| **Status** | Ready |

**Title:** Submit Edit with Malformed Request Data

**Preconditions:**
- Admin is logged in
- Edit page loaded

**Test Steps:**
1. Submit with capabilityId as string: `{ capabilityId: "abc" }`
2. Submit with bandId as string: `{ bandId: "xyz" }`
3. Submit with numberOfOpenPositions as string: `{ numberOfOpenPositions: "not-a-number" }`
4. Submit with all fields as null: `{ roleName: null, location: null }`

**Expected Results:**
- String numbers attempted to coerce: "abc" → NaN → validation error
- null values: Treated as optional, not sent to backend
- All invalid coercions result in validation error

**Test Data:**
```json
[
  { "capabilityId": "abc" },
  { "bandId": "xyz" },
  { "numberOfOpenPositions": "not-a-number" },
  { "roleName": null }
]
```

**Pass/Fail Criteria:** ✓ PASS if proper validation for type coercion

---

## TEST CASE 14: Error Guessing - Empty Payload

| **Field** | **Value** |
|-----------|-----------|
| **ID** | TC-EDIT-014 |
| **Module/Area** | Job Role Management |
| **Priority** | High |
| **Status** | Ready |

**Title:** Submit Edit with Empty Payload (No Fields Modified)

**Preconditions:**
- Admin is logged in
- Edit form loaded with all current values

**Test Steps:**
1. Load edit form (all fields have current values)
2. Without changing any fields, click "Update"
3. Submit form

**Expected Results:**
- Validation error: "At least one field must be provided."
- Form re-renders with error message
- No PATCH request sent to backend

**Pass/Fail Criteria:** ✓ PASS if empty payload rejected

---

## TEST CASE 15: Error Guessing - Special Characters in Text Fields

| **Field** | **Value** |
|-----------|-----------|
| **ID** | TC-EDIT-015 |
| **Module/Area** | Job Role Management |
| **Priority** | Medium |
| **Status** | Ready |

**Title:** Update Fields with Special Characters

**Preconditions:**
- Admin is logged in
- Edit page loaded

**Test Steps:**
1. Update roleName with: "Senior Backend Engineer <script>alert('xss')</script>"
2. Update description with: "Responsibilities & duties + more"
3. Update location with: "Dublin; New York"
4. Submit form

**Expected Results:**
- Special characters accepted but escaped in output
- No XSS vulnerability
- Characters preserved in backend storage
- Success redirect with sanitized display

**Test Data:**
```json
{
  "roleName": "Senior <backend/> Engineer",
  "description": "Handle APIs & integrations",
  "location": "Dublin; New York",
  "responsibilities": "Code review <process> + testing"
}
```

**Pass/Fail Criteria:** ✓ PASS if characters escaped and no XSS

---

## TEST CASE 16: Error Guessing - Whitespace Handling

| **Field** | **Value** |
|-----------|-----------|
| **ID** | TC-EDIT-016 |
| **Module/Area** | Job Role Management |
| **Priority** | Medium |
| **Status** | Ready |

**Title:** Update Fields with Leading/Trailing Whitespace

**Preconditions:**
- Admin is logged in
- Edit page loaded

**Test Steps:**
1. Update roleName with: "   Senior Engineer   "
2. Update location with: "  Dublin  "
3. Submit form

**Expected Results:**
- Whitespace trimmed before validation
- Values accepted as: "Senior Engineer" and "Dublin"
- Backend receives trimmed values
- Success redirect

**Test Data:**
```json
{
  "roleName": "   Senior Engineer   ",
  "location": "  Dublin  "
}
```

**Pass/Fail Criteria:** ✓ PASS if whitespace trimmed correctly

---

## TEST CASE 17: Risk Based Testing - Backend Service Failure

| **Field** | **Value** |
|-----------|-----------|
| **ID** | TC-EDIT-017 |
| **Module/Area** | Job Role Management |
| **Priority** | Critical |
| **Status** | Ready |

**Title:** Handle Backend API Service Failure (500 Error)

**Preconditions:**
- Admin is logged in
- Edit page loaded
- Backend service is temporarily unavailable

**Test Steps:**
1. Update job role with valid data
2. Backend returns 500 Internal Server Error
3. Observe controller error handling

**Expected Results:**
- User-friendly error message: "Could not update the job role. Please try again."
- Form stays on edit page with previously entered values preserved
- Stack trace not exposed to user
- Error logged server-side

**Pass/Fail Criteria:** ✓ PASS if generic error message displayed

---

## TEST CASE 18: Risk Based Testing - Network Timeout

| **Field** | **Value** |
|-----------|-----------|
| **ID** | TC-EDIT-018 |
| **Module/Area** | Job Role Management |
| **Priority** | Critical |
| **Status** | Ready |

**Title:** Handle Network Timeout During Update Request

**Preconditions:**
- Admin submits valid edit form
- Network experiences timeout

**Test Steps:**
1. Submit form with network delay > timeout threshold
2. Verify timeout handling
3. Check if user is informed

**Expected Results:**
- Request times out gracefully
- User sees error message: "Request timed out. Please try again."
- Form remains on edit page with values preserved
- No partial updates

**Pass/Fail Criteria:** ✓ PASS if timeout handled gracefully

---

## TEST CASE 19: Risk Based Testing - Concurrent Edit Attempts

| **Field** | **Value** |
|-----------|-----------|
| **ID** | TC-EDIT-019 |
| **Module/Area** | Job Role Management |
| **Priority** | High |
| **Status** | Ready |

**Title:** Handle Concurrent Edit Requests from Same Admin

**Preconditions:**
- Admin has edit form open in two browser tabs
- Job role ID 1 loaded in both

**Test Steps:**
1. In Tab 1: Update roleName to "Engineer" and submit
2. In Tab 2: Update location to "London" and submit
3. Verify both updates succeed or conflict handling works

**Expected Results:**
- Both updates succeed if independent fields
- Backend handles partial updates correctly
- Latest updates take precedence
- No data corruption

**Pass/Fail Criteria:** ✓ PASS if updates handled correctly without data loss

---

## TEST CASE 20: Risk Based Testing - Backend Validation Conflicts

| **Field** | **Value** |
|-----------|-----------|
| **ID** | TC-EDIT-020 |
| **Module/Area** | Job Role Management |
| **Priority** | High |
| **Status** | Ready |

**Title:** Backend Validation Failure After Frontend Validation Passes

**Preconditions:**
- Admin submits form that passes frontend validation
- Backend has stricter validation rules

**Test Steps:**
1. Submit valid frontend data: `{ numberOfOpenPositions: 1000 }`
2. Backend business logic rejects: "Cannot exceed 100 open positions"
3. Verify error handling

**Expected Results:**
- Backend returns 400 Bad Request with error message
- Controller maps backend error to user message
- Form re-renders with error: "Cannot exceed 100 open positions"
- Form values preserved

**Pass/Fail Criteria:** ✓ PASS if backend error properly displayed

---

## TEST CASE 21: Use Case Testing - Complete Admin Workflow

| **Field** | **Value** |
|-----------|-----------|
| **ID** | TC-EDIT-021 |
| **Module/Area** | Job Role Management |
| **Priority** | Critical |
| **Status** | Ready |

**Title:** Complete Admin Workflow: View → Edit → Confirm

**Preconditions:**
- Admin is logged in
- Job roles list is accessible

**Test Steps:**
1. Admin navigates to `/job-roles` (list page)
2. Admin clicks on job role "Senior Backend Engineer"
3. Admin sees job role details on `/job-roles/1`
4. Admin clicks "Edit Job Role" button
5. Edit form loads at `/job-roles/1/edit` with current values
6. Admin updates roleName to "Principal Backend Engineer"
7. Admin updates location to "Remote"
8. Admin clicks "Save Changes"
9. Redirect to `/job-roles/1?editSuccess=true`
10. Success banner displays: "Job role updated successfully"
11. Job role details show updated values

**Expected Results:**
- Each step executes correctly
- All navigation works
- Values updated correctly
- Success banner appears
- Detail page reflects changes

**Test Data:**
```json
{
  "initialRoleName": "Senior Backend Engineer",
  "newRoleName": "Principal Backend Engineer",
  "newLocation": "Remote"
}
```

**Pass/Fail Criteria:** ✓ PASS if complete workflow succeeds with updates reflected

---

## TEST CASE 22: Use Case Testing - Partial Update Workflow

| **Field** | **Value** |
|-----------|-----------|
| **ID** | TC-EDIT-022 |
| **Module/Area** | Job Role Management |
| **Priority** | High |
| **Status** | Ready |

**Title:** Admin Updates Single Field While Keeping Others Unchanged

**Preconditions:**
- Admin is viewing job role details
- Job role has multiple fields with values

**Test Steps:**
1. Navigate to edit page: `/job-roles/1/edit`
2. Modify ONLY the `closingDate` field
3. Leave all other fields unchanged
4. Submit form
5. Verify redirect to `/job-roles/1?editSuccess=true`

**Expected Results:**
- Request body contains: `{ closingDate: "2026-12-31" }`
- Only specified field sent to backend
- Backend updates only that field
- Other fields remain unchanged
- Success banner shows

**Test Data:**
```json
{
  "closingDate": "2026-12-31"
}
```

**Pass/Fail Criteria:** ✓ PASS if single field update works correctly

---

## TEST CASE 23: Use Case Testing - Error Recovery Workflow

| **Field** | **Value** |
|-----------|-----------|
| **ID** | TC-EDIT-023 |
| **Module/Area** | Job Role Management |
| **Priority** | High |
| **Status** | Ready |

**Title:** Admin Encounters Validation Error and Retries Successfully

**Preconditions:**
- Admin is on edit form

**Test Steps:**
1. Enter invalid numberOfOpenPositions: -5
2. Submit form
3. Validation error displays: "Number of open positions must be greater than 0."
4. Admin corrects value to: 10
5. Submit form again
6. Redirect to success page

**Expected Results:**
- First submission: Form re-renders with error message
- Original values preserved in form
- Second submission: Success redirect
- Job role updated with corrected value

**Test Data:**
```json
{
  "attempt1": { "numberOfOpenPositions": -5 },
  "attempt2": { "numberOfOpenPositions": 10 }
}
```

**Pass/Fail Criteria:** ✓ PASS if error recovery workflow succeeds

---

## TEST CASE 24: Use Case Testing - Admin Updates All Fields

| **Field** | **Value** |
|-----------|-----------|
| **ID** | TC-EDIT-024 |
| **Module/Area** | Job Role Management |
| **Priority** | High |
| **Status** | Ready |

**Title:** Admin Updates All Editable Fields Simultaneously

**Preconditions:**
- Admin on edit form

**Test Steps:**
1. Update all editable fields:
   - roleName: "Executive Principal Engineer"
   - location: "San Francisco"
   - capabilityId: 5
   - bandId: 7
   - closingDate: "2027-06-30"
   - description: "Lead engineering initiatives..."
   - responsibilities: "Strategic planning and team leadership..."
   - sharepointUrl: "https://corp.sharepoint.com/jobs/exec-engineer"
   - numberOfOpenPositions: 2
   - status: "Open"
2. Submit form
3. Verify all changes applied

**Expected Results:**
- All fields updated successfully
- Backend receives complete update payload
- Redirect to success page
- Detail page shows all updates

**Test Data:**
```json
{
  "roleName": "Executive Principal Engineer",
  "location": "San Francisco",
  "capabilityId": 5,
  "bandId": 7,
  "closingDate": "2027-06-30",
  "description": "Lead engineering initiatives and drive technical excellence",
  "responsibilities": "Strategic planning, team leadership, and technical mentoring",
  "sharepointUrl": "https://corp.sharepoint.com/jobs/exec-engineer",
  "numberOfOpenPositions": 2,
  "status": "Open"
}
```

**Pass/Fail Criteria:** ✓ PASS if all fields updated correctly

---

## TEST CASE 25: Use Case Testing - Authorization Check During Edit

| **Field** | **Value** |
|-----------|-----------|
| **ID** | TC-EDIT-025 |
| **Module/Area** | Job Role Management |
| **Priority** | Critical |
| **Status** | Ready |

**Title:** Verify Admin Authorization at Each Step of Edit Workflow

**Preconditions:**
- User with "user" role is logged in

**Test Steps:**
1. User navigates to `/job-roles/1/edit`
2. User attempts to access edit form
3. User tries direct POST to `/job-roles/1/edit`
4. User attempts API call bypassing UI

**Expected Results:**
- GET request: Blocked by `requireAdmin` middleware → Redirect or 403
- POST request: Blocked by `requireAdmin` middleware → Redirect or 403
- Direct API call: Backend returns 403 Unauthorized
- Edit action not visible on detail page for non-admin

**Pass/Fail Criteria:** ✓ PASS if all access attempts blocked for non-admin

---

## Test Execution Summary Matrix

| Test ID | Category | Technique | Status | Result |
|---------|----------|-----------|--------|--------|
| TC-EDIT-001 | Valid Input | EP | Not Started | - |
| TC-EDIT-002 | Valid Input | EP | Not Started | - |
| TC-EDIT-003 | Boundary | BVA | Not Started | - |
| TC-EDIT-004 | Boundary | BVA | Not Started | - |
| TC-EDIT-005 | Boundary | BVA | Not Started | - |
| TC-EDIT-006 | Boundary | BVA | Not Started | - |
| TC-EDIT-007 | Boundary | BVA | Not Started | - |
| TC-EDIT-008 | Decision | DT | Not Started | - |
| TC-EDIT-009 | Decision | DT | Not Started | - |
| TC-EDIT-010 | Error | EG | Not Started | - |
| TC-EDIT-011 | Error | EG | Not Started | - |
| TC-EDIT-012 | Error | EG | Not Started | - |
| TC-EDIT-013 | Error | EG | Not Started | - |
| TC-EDIT-014 | Error | EG | Not Started | - |
| TC-EDIT-015 | Error | EG | Not Started | - |
| TC-EDIT-016 | Error | EG | Not Started | - |
| TC-EDIT-017 | Risk | RBT | Not Started | - |
| TC-EDIT-018 | Risk | RBT | Not Started | - |
| TC-EDIT-019 | Risk | RBT | Not Started | - |
| TC-EDIT-020 | Risk | RBT | Not Started | - |
| TC-EDIT-021 | Workflow | UCT | Not Started | - |
| TC-EDIT-022 | Workflow | UCT | Not Started | - |
| TC-EDIT-023 | Workflow | UCT | Not Started | - |
| TC-EDIT-024 | Workflow | UCT | Not Started | - |
| TC-EDIT-025 | Security | UCT | Not Started | - |

---

## Abbreviations

- **EP** — Equivalence Partitioning
- **BVA** — Boundary Value Analysis
- **DT** — Decision Tables
- **EG** — Error Guessing
- **RBT** — Risk Based Testing
- **UCT** — Use Case Testing

---

## Notes

- All test cases assume the backend API is functional unless testing error scenarios
- Tests should be executed in a controlled environment with test data
- Authorization tests should verify both frontend middleware and backend security
- Date tests should account for timezone considerations
- All validation errors should be user-friendly and not expose system internals
