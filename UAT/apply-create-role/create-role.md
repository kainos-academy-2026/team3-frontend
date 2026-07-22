# Admin Creates a Job Role

## Test 1 — Admin navigates to the Create Job Role form from the job roles list

| Field | Detail |
|---|---|
| **Title** | Admin navigates to the Create Job Role form from the job roles list |
| **Environment** | localhost:3000, Chrome, development |
| **Steps to Reproduce** | 1. Sign in as an admin user. 2. Navigate to `/job-roles`. 3. Click the "Create new role" button. |
| **Expected Result** | The Create Job Role form loads at `/job-roles/new`. The Capability and Band dropdowns are populated with options from the API. All form fields are empty. |
| **Actual Result** | The Create Job Role form loads at `/job-roles/new`. The Capability and Band dropdowns are populated with options from the API. All form fields are empty. |
| **Severity** | High |
| **Priority** | High |
| **Attachments** | ![Alt text](/user-acceptance-testing/images/create-role/test.png) |
| **Result** | PASS |

---

## Test 2 — Admin successfully creates a job role with all valid fields

| Field | Detail |
|---|---|
| **Title** | Admin successfully creates a job role with all valid fields |
| **Environment** | localhost:3000, Chrome, development |
| **Steps to Reproduce** | 1. Sign in as an admin user and navigate to `/job-roles/new`. 2. Fill in: Role name = "Senior Backend Engineer", Location = "Dublin", Capability = any dropdown option, Band = any dropdown option, Closing date = a future date, Number of open positions = 2, Description = any non-empty text, Responsibilities = any non-empty text, SharePoint URL = a valid URL (e.g. `https://example.sharepoint.com/roles/1`). 3. Click "Create role". |
| **Expected Result** | The form submits successfully. The user is redirected to `/job-roles?created=true`. The job roles list page displays the success banner: "Job role created successfully." |
| **Actual Result** | The form submits successfully. The user is redirected to `/job-roles?created=true`. The job roles list page displays the success banner: "Job role created successfully."|
| **Severity** | High |
| **Priority** | High |
| **Attachments** | ![Alt Text](/user-acceptance-testing/images/create-role/test2.png) |
| **Result** | PASS |

---

## Test 3 — Newly created job role appears on the job roles list

| Field | Detail |
|---|---|
| **Title** | Newly created job role appears on the job roles list |
| **Environment** | localhost:3000, Chrome, development |
| **Steps to Reproduce** | 1. Complete Test 2 successfully. 2. After redirect, scan the job roles list for the newly created role name ("Senior Backend Engineer"). |
| **Expected Result** | The new role card is visible in the list showing the correct role name, location, capability, band, and closing date. |
| **Actual Result** | The new role card is visible in the list showing the correct role name, location, capability, band, and closing date. |
| **Severity** | Medium |
| **Priority** | High |
| **Attachments** | ![Alt text](/user-acceptance-testing/images/create-role/test3.png) |
| **Result** | PASS |

---

## Test 4 — Admin submits the Create Job Role form with no fields filled in

| Field | Detail |
|---|---|
| **Title** | Admin submits the Create Job Role form with no fields filled in |
| **Environment** | localhost:3000, Chrome, development |
| **Steps to Reproduce** | 1. Sign in as an admin user and navigate to `/job-roles/new`. 2. Leave all fields empty. 3. Click "Create role". |
| **Expected Result** | The form is not submitted. The user remains on `/job-roles/new`. Validation error messages are displayed for all required fields: Role name, Location, Capability, Band, Closing date, Number of open positions, Description, Responsibilities, and SharePoint URL. |
| **Actual Result** | The form is not submitted. The user does not remain on `/job-roles/new` but instead `/job-roles`. Validation error messages are displayed for all required fields: Role name, Location, Capability, Band, Closing date, Number of open positions, Description, Responsibilities, and SharePoint URL. |
| **Severity** | High |
| **Priority** | High |
| **Attachments** | ![Alt text](/user-acceptance-testing/images/create-role/test4.png) |
| **Result** | FAIL |

---

## Test 5 — Admin submits the Create Job Role form with only one field filled in

| Field | Detail |
|---|---|
| **Title** | Admin submits the Create Job Role form with only one field filled in |
| **Environment** | localhost:3000, Chrome, development |
| **Steps to Reproduce** | 1. Sign in as an admin user and navigate to `/job-roles/new`. 2. Enter a value only in the Role name field (e.g. "Senior Backend Engineer"). Leave all other fields empty. 3. Click "Create role". |
| **Expected Result** | The form is not submitted. The user remains on `/job-roles/new`. The Role name value is preserved. Validation error messages are displayed for all remaining required fields: Location, Capability, Band, Closing date, Number of open positions, Description, Responsibilities, and SharePoint URL. |
| **Actual Result** | The form is not submitted. The user does not remain on `/job-roles/new` but instead `/job-roles`. The Role name value is preserved. Validation error messages are displayed for all remaining required fields: Location, Capability, Band, Closing date, Number of open positions, Description, Responsibilities, and SharePoint URL. |
| **Severity** | High |
| **Priority** | High |
| **Attachments** | ![Alt text](/user-acceptance-testing/images/create-role/test5.png) |
| **Result** | FAIL |

---

## Test 6 — Admin submits the Create Job Role form with all required fields filled except one

| Field | Detail |
|---|---|
| **Title** | Admin submits the Create Job Role form with all required fields filled except one |
| **Environment** | localhost:3000, Chrome, development |
| **Steps to Reproduce** | 1. Sign in as an admin user and navigate to `/job-roles/new`. 2. Fill in all required fields except SharePoint URL: Role name = "Senior Backend Engineer", Location = "Dublin", Capability = any dropdown option, Band = any dropdown option, Closing date = a future date, Number of open positions = 2, Description = any non-empty text, Responsibilities = any non-empty text. Leave SharePoint URL empty. 3. Click "Create role". |
| **Expected Result** | The form is not submitted. The user remains on `/job-roles/new`. All previously entered values are preserved. A validation error message is displayed only for the SharePoint URL field. |
| **Actual Result** | The form is not submitted. The user does not remain on `/job-roles/new` but instead `/job-roles`. All previously entered values are preserved. A validation error message is displayed only for the SharePoint URL field. |
| **Severity** | High |
| **Priority** | High |
| **Attachments** | ![Alt text](/user-acceptance-testing/images/create-role/test6.png) |
| **Result** | FAIL |
