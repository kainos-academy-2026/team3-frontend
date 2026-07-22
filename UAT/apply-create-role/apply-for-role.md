# User Applies for a Job Role

## Test 1 — User sees the Apply button on an open role with available positions

| Field | Detail |
|---|---|
| **Title** | User sees the Apply button on an open role with available positions |
| **Environment** | localhost:3000, Chrome, development |
| **Steps to Reproduce** | 1. Sign in as a standard (non-admin) user. 2. Navigate to `/job-roles`. 3. Click on a job role that has a status of "Open" and at least one open position. |
| **Expected Result** | The role detail page loads. An "Apply for this role" button is visible on the page. |
| **Actual Result** | The role detail page loads. An "Apply for this role" button is visible on the page. |
| **Severity** | High |
| **Priority** | High |
| **Attachments** | ![Apply button visible](/user-acceptance-testing/images/apply-for-role/test.png) |
| **Result** | |

---

## Test 2 — User navigates to the application form from the role detail page

| Field | Detail |
|---|---|
| **Title** | User navigates to the application form from the role detail page |
| **Environment** | localhost:3000, Chrome, development |
| **Steps to Reproduce** | 1. Sign in as a standard user. 2. Navigate to a job role detail page for an open role with available positions. 3. Click the "Apply for this role" button. |
| **Expected Result** | The application form page loads at `/job-roles/:id/apply`. The page includes a file upload input that accepts PDF, DOC, and DOCX files, and a "Submit application" button. |
| **Actual Result** | |
| **Severity** | High |
| **Priority** | High |
| **Attachments** | ![Application form page](/user-acceptance-testing/images/apply-for-role/test2.png) |
| **Result** | |

---

## Test 3 — User uploads a valid PDF CV and submits the application

| Field | Detail |
|---|---|
| **Title** | User uploads a valid PDF CV and submits the application |
| **Environment** | localhost:3000, Chrome, development |
| **Steps to Reproduce** | 1. Sign in as a standard user and navigate to `/job-roles/:id/apply` for an open role. 2. Click the file upload input and select a valid PDF file under 5MB. 3. Click "Submit application". |
| **Expected Result** | The file is accepted. The form submits without errors. The user is redirected away from the application page. |
| **Actual Result** | |
| **Severity** | High |
| **Priority** | High |
| **Attachments** | ![Successful submission](/user-acceptance-testing/images/apply-for-role/test3.png) |
| **Result** | |

---

## Test 4 — User is redirected to the role detail page with a success banner after submission

| Field | Detail |
|---|---|
| **Title** | User is redirected to the role detail page with a success banner after submission |
| **Environment** | localhost:3000, Chrome, development |
| **Steps to Reproduce** | 1. Complete Test 3 successfully. 2. Observe the page the user is redirected to after submission. |
| **Expected Result** | The user is redirected to `/job-roles/:id?applicationSubmitted=true`. The role detail page displays the success banner: "Application submitted successfully. Your status is now in progress." |
| **Actual Result** | |
| **Severity** | High |
| **Priority** | High |
| **Attachments** | ![Success banner on role detail page](/user-acceptance-testing/images/apply-for-role/test4.png) |
| **Result** | |
