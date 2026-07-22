# Admin Edit Job Role - Comprehensive Test Suite Guide

## Overview

This document provides a complete guide to the comprehensive test suite for the **Admin Edit Job Role** feature using professional test design techniques from the test case design frameworks.

## Test Design Techniques Used

### 1. **Equivalence Partitioning (EP)**
Dividing inputs into classes where all members should behave similarly.

**Example:** Role names can be partitioned into:
- Valid names (non-empty strings)
- Empty strings
- Names with only whitespace

**Files:** 
- `TEST_CASES_ADMIN_EDIT.md` - TC-EDIT-001 to TC-EDIT-002
- `jobRoleController.edit.test.ts` - TC-EDIT-001 to TC-EDIT-002
- `jobRoleSchemas.update.test.ts` - TC-VAL-001

### 2. **Boundary Value Analysis (BVA)**
Testing at the edges of input domains (minimum, maximum, just above/below limits).

**Example:** Number of positions boundaries:
- Minimum valid: 1
- Just below minimum: 0
- Negative: -1
- Large valid: 999

**Files:**
- `TEST_CASES_ADMIN_EDIT.md` - TC-EDIT-003 to TC-EDIT-007
- `jobRoleController.edit.test.ts` - TC-EDIT-003 to TC-EDIT-007
- `jobRoleSchemas.update.test.ts` - TC-VAL-002 to TC-VAL-009

### 3. **Decision Tables (DT)**
Systematically testing combinations of inputs to identify logic errors.

**Example:** Combining valid/invalid fields to find which combinations pass:
- All valid: PASS
- One invalid: FAIL
- Multiple invalid: FAIL

**Files:**
- `TEST_CASES_ADMIN_EDIT.md` - TC-EDIT-008 to TC-EDIT-009
- `jobRoleController.edit.test.ts` - TC-EDIT-008 to TC-EDIT-009
- `jobRoleSchemas.update.test.ts` - TC-VAL-010

### 4. **Error Guessing (EG)**
Intuition-based testing focusing on common mistakes and error conditions.

**Examples:**
- Invalid IDs (non-numeric, zero, negative)
- Missing authentication tokens
- Non-admin access attempts
- Empty payloads
- Special characters and XSS attempts
- Whitespace handling

**Files:**
- `TEST_CASES_ADMIN_EDIT.md` - TC-EDIT-010 to TC-EDIT-016
- `jobRoleController.edit.test.ts` - TC-EDIT-010 to TC-EDIT-016
- `jobRoleSchemas.update.test.ts` - TC-VAL-011 to TC-VAL-013
- `jobRoleRoutes.edit.test.ts` - TC-ROUTE-004, TC-ROUTE-008

### 5. **Risk-Based Testing (RBT)**
Focusing on high-risk scenarios: failures, timeouts, concurrent requests, backend errors.

**Examples:**
- Backend service failures (500 errors)
- Network timeouts
- Concurrent edit attempts
- Backend validation conflicts
- Session validation failures

**Files:**
- `TEST_CASES_ADMIN_EDIT.md` - TC-EDIT-017 to TC-EDIT-020
- `jobRoleController.edit.test.ts` - TC-EDIT-017 to TC-EDIT-020
- `jobRoleRoutes.edit.test.ts` - TC-ROUTE-005, TC-ROUTE-010

### 6. **Use Case Testing (UCT)**
Testing complete workflows from user perspective, including error recovery.

**Examples:**
- Complete admin workflow (view → edit → confirm)
- Partial update workflow
- Error recovery workflow
- Authorization verification
- Real-world scenarios

**Files:**
- `TEST_CASES_ADMIN_EDIT.md` - TC-EDIT-021 to TC-EDIT-025
- `jobRoleController.edit.test.ts` - TC-EDIT-021 to TC-EDIT-025
- `jobRoleSchemas.update.test.ts` - TC-VAL-014 to TC-VAL-016
- `jobRoleRoutes.edit.test.ts` - TC-ROUTE-006, TC-ROUTE-011

---

## Test Case Organization

### **Document Files**

#### 1. `TEST_CASES_ADMIN_EDIT.md`
Main test case specification document with 25 detailed test cases covering all techniques.

**Structure:**
- Scope clarification
- What is already done
- Backend contract
- End-to-end flow
- Detailed test cases (25 total)
- Execution summary matrix

**Key Sections:**
- Test case design overview
- Each test case includes:
  - ID, Priority, Status
  - Title
  - Preconditions
  - Test Steps
  - Expected Results
  - Test Data
  - Pass/Fail Criteria

### **Unit Test Files**

#### 2. `tests/controllers/jobRoleController.edit.test.ts`
Comprehensive controller tests using all test design techniques.

**Coverage:**
- 25+ test cases organized by technique
- 6 test suites (EP, BVA, DT, EG, RBT, UCT)
- Tests for:
  - `getEditJobRolePage()` - GET /job-roles/:id/edit
  - `submitEditJobRole()` - POST /job-roles/:id/edit
  - Validation handling
  - Error scenarios
  - Success flows

**Example Test Categories:**
```
TC-EDIT-001: EP - Valid Single Field Update
TC-EDIT-003: BVA - Minimum String Length
TC-EDIT-008: DT - Multiple Field Updates
TC-EDIT-010: EG - Invalid Job Role ID
TC-EDIT-017: RBT - Backend Service Failure
TC-EDIT-021: UCT - Complete Admin Workflow
```

#### 3. `tests/validation/jobRoleSchemas.update.test.ts`
Comprehensive schema validation tests.

**Coverage:**
- 17+ test suites with 80+ individual test cases
- Tests for each field:
  - roleName, location, capabilityId, bandId
  - closingDate, status, numberOfOpenPositions
  - description, responsibilities, sharepointUrl
- Type coercion tests
- Special character handling
- Whitespace trimming

**Test Organization:**
```
TC-VAL-002 to TC-VAL-009: BVA for each field
TC-VAL-010: DT - Status values
TC-VAL-011 to TC-VAL-013: EG - Empty, null, malformed
TC-VAL-014 to TC-VAL-016: UCT - Real-world scenarios
TC-VAL-017: Comprehensive validation matrix
```

#### 4. `tests/routes/jobRoleRoutes.edit.test.ts`
Route-level integration tests.

**Coverage:**
- Authentication and authorization tests
- Invalid parameter handling
- HTTP method validation
- Content type handling
- Malicious input detection
- Performance under load
- Error recovery scenarios

**Test Organization:**
```
TC-ROUTE-001: EP - Authentication
TC-ROUTE-002: EG - Admin authorization
TC-ROUTE-003 to TC-ROUTE-004: BVA/EG - Parameters
TC-ROUTE-005 to TC-ROUTE-010: RBT - Security, Performance
TC-ROUTE-011 to TC-ROUTE-012: UCT - Workflows, Matrix
```

---

## Test Execution Strategy

### **Phase 1: Unit Tests (Controller)**

Run controller tests to verify business logic:
```bash
npm test tests/controllers/jobRoleController.edit.test.ts
```

**What it tests:**
- Form rendering with current values
- Validation error handling
- Successful updates
- Authorization checks
- Error mapping

**Pass Criteria:**
- All EP, BVA, DT, EG, RBT, UCT tests pass
- Error messages are user-friendly
- Form values preserved on validation failure

### **Phase 2: Validation Tests**

Run schema tests to verify data validation:
```bash
npm test tests/validation/jobRoleSchemas.update.test.ts
```

**What it tests:**
- Field-level validation
- Type coercion
- Boundary values
- Special characters
- Required/optional fields

**Pass Criteria:**
- All field validations work as specified
- Error messages are clear
- Edge cases handled correctly

### **Phase 3: Route Tests**

Run route tests to verify HTTP layer:
```bash
npm test tests/routes/jobRoleRoutes.edit.test.ts
```

**What it tests:**
- Route registration
- Middleware execution
- Authentication flow
- Authorization checks
- HTTP method handling

**Pass Criteria:**
- Routes are protected by requireAdmin middleware
- Unauthenticated users redirected to login
- Non-admin users get 403
- Invalid IDs return proper error codes

### **Phase 4: Full Test Coverage**

Run all tests together:
```bash
npm test
npm run test:coverage
```

**Expected Coverage:**
- Controllers: > 95%
- Routes: > 90%
- Schemas: > 95%

---

## Test Case Mapping to Features

### **Feature 1: Form Rendering (GET /job-roles/:id/edit)**

| Test Technique | Test Case | Coverage |
|---|---|---|
| EP | TC-EDIT-002 | Single field reads |
| BVA | TC-ROUTE-003 | Invalid ID handling |
| EG | TC-ROUTE-008 | Malicious input |
| RBT | TC-ROUTE-005 | Session validation |
| UCT | TC-ROUTE-006 | Complete workflow |

### **Feature 2: Form Submission (POST /job-roles/:id/edit)**

| Test Technique | Test Case | Coverage |
|---|---|---|
| EP | TC-EDIT-001 | Valid updates |
| BVA | TC-EDIT-003 to TC-EDIT-007 | Boundary values |
| DT | TC-EDIT-008 to TC-EDIT-009 | Field combinations |
| EG | TC-EDIT-010 to TC-EDIT-016 | Error conditions |
| RBT | TC-EDIT-017 to TC-EDIT-020 | Risk scenarios |
| UCT | TC-EDIT-021 to TC-EDIT-025 | User workflows |

### **Feature 3: Validation**

| Test Technique | Test Case | Coverage |
|---|---|---|
| EP | TC-VAL-001 | Single field updates |
| BVA | TC-VAL-002 to TC-VAL-009 | Boundary values per field |
| DT | TC-VAL-010 | Status combinations |
| EG | TC-VAL-011 to TC-VAL-013 | Error cases |
| UCT | TC-VAL-014 to TC-VAL-017 | Real scenarios |

### **Feature 4: Authorization**

| Test Technique | Test Case | Coverage |
|---|---|---|
| EG | TC-ROUTE-002 | Admin check |
| RBT | TC-ROUTE-005 | Session validation |
| UCT | TC-ROUTE-012 | Access matrix |

---

## Test Execution Plan

### **Pre-Development**
- Review all test case scenarios in `TEST_CASES_ADMIN_EDIT.md`
- Understand test design techniques
- Set up test environment

### **During Development**
1. Implement feature based on instructions
2. Run controller tests: `npm test tests/controllers/jobRoleController.edit.test.ts`
3. Run validation tests: `npm test tests/validation/jobRoleSchemas.update.test.ts`
4. Run route tests: `npm test tests/routes/jobRoleRoutes.edit.test.ts`
5. Fix any failing tests

### **Before PR Submission**
1. Run full test suite: `npm test`
2. Check coverage: `npm run test:coverage`
3. Run linter: `npm run lint`
4. Run formatter: `npm run format`
5. Build: `npm run build`

### **Manual Testing Checklist**
- [ ] Admin can open edit form
- [ ] Form pre-populated with current values
- [ ] Valid single field update works
- [ ] Valid multi-field update works
- [ ] Validation errors display inline
- [ ] Form values preserved on error
- [ ] Successful update redirects with success banner
- [ ] Non-admin cannot access edit
- [ ] Unauthenticated user redirected to login
- [ ] Special characters handled correctly
- [ ] Large input rejected
- [ ] Empty update rejected

---

## Test Results Interpretation

### **Expected Outcomes**

#### All Tests Pass
✓ Feature implementation is correct
✓ All edge cases handled
✓ Error messages user-friendly
✓ Authorization working
✓ Ready for PR

#### Tests Fail - Validation
- Fix: Update validation schema in `jobRoleSchemas.ts`
- Tests affected: `TC-VAL-*` tests
- Action: Re-run validation tests

#### Tests Fail - Controller Logic
- Fix: Update controller methods
- Tests affected: `TC-EDIT-*` tests
- Action: Check error handling and form rendering

#### Tests Fail - Routes
- Fix: Check middleware and route registration
- Tests affected: `TC-ROUTE-*` tests
- Action: Verify `requireAdmin` middleware applied

#### Tests Fail - Authorization
- Fix: Ensure `requireAdmin` middleware on routes
- Tests affected: Authorization tests
- Action: Add/fix middleware on routes

---

## Common Issues and Solutions

### Issue 1: Form Values Not Preserved on Error
**Symptom:** Test expects form values in re-render but they're missing
**Solution:** 
1. In controller, capture form values: `formValues: req.body`
2. Pass to render: `res.render(..., { formValues, fieldErrors, ... })`
3. In template, use: `value="{{ formValues.fieldName }}"`

### Issue 2: Whitespace Not Being Trimmed
**Symptom:** BVA tests fail for whitespace boundaries
**Solution:**
1. Verify Zod schema uses `.trim()`
2. Check that middleware doesn't modify body
3. Ensure service receives trimmed values

### Issue 3: Empty Payload Not Rejected
**Symptom:** TC-EDIT-014 fails (empty payload accepted)
**Solution:**
1. Add `.refine()` check to schema
2. Ensure at least one field must be present
3. Check validation error message

### Issue 4: Authorization Bypass
**Symptom:** Non-admin can access edit route
**Solution:**
1. Verify `requireAdmin` middleware on route
2. Check session role extraction
3. Ensure middleware runs before controller

### Issue 5: Backend Error Not Mapped
**Symptom:** TC-EDIT-020 fails (backend error not handled)
**Solution:**
1. Use `axios.isAxiosError()` to check error type
2. Map specific status codes (404, 400)
3. Use user-friendly fallback message

---

## Coverage Metrics

### **Target Coverage**
- Lines: > 95%
- Branches: > 90%
- Functions: > 95%
- Statements: > 95%

### **Coverage by Component**

| Component | Target | Status |
|---|---|---|
| Controller methods | 100% | - |
| Service calls | 100% | - |
| Route handlers | 100% | - |
| Validation logic | 100% | - |
| Error handling | 95% | - |

---

## Test Design Technique Benefits

### **Why Each Technique Matters**

**Equivalence Partitioning**
- Reduces test cases from infinite to manageable set
- Ensures coverage of all input categories
- Finds bugs in boundary logic

**Boundary Value Analysis**
- Catches off-by-one errors
- Tests limits (min/max)
- Finds boundary condition bugs

**Decision Tables**
- Tests complex logic combinations
- Identifies missing cases
- Maps all valid/invalid combinations

**Error Guessing**
- Finds obvious bugs
- Tests common mistakes
- Based on real-world failures

**Risk-Based Testing**
- Focuses on critical functionality
- Tests failure scenarios
- Ensures system resilience

**Use Case Testing**
- Tests from user perspective
- Verifies end-to-end flows
- Ensures real-world usability

---

## References

### **Files in This Suite**
- `TEST_CASES_ADMIN_EDIT.md` - Main test case specification
- `tests/controllers/jobRoleController.edit.test.ts` - Controller unit tests
- `tests/validation/jobRoleSchemas.update.test.ts` - Schema validation tests
- `tests/routes/jobRoleRoutes.edit.test.ts` - Route integration tests

### **Related Instruction Files**
- `.github/instructions/US015-edit-job-role.instructions.md` - Feature requirements
- `.github/instructions/frontend-standards.instructions.md` - Frontend standards

### **Test Data Locations**
All test data is embedded in test files as constants:
- Valid payloads
- Invalid payloads
- Boundary values
- Error scenarios

---

## Next Steps

1. **Run all tests**
   ```bash
   npm test
   ```

2. **Check coverage**
   ```bash
   npm run test:coverage
   ```

3. **Review failures**
   - Check test output for specific errors
   - Map to test case in `TEST_CASES_ADMIN_EDIT.md`
   - Fix implementation based on requirements

4. **Iterate**
   - Fix code
   - Re-run tests
   - Verify no regressions

5. **Submit PR**
   - All tests passing
   - Coverage > 90%
   - Code formatted and linted

---

## Support

For questions about:
- **Test design techniques**: See attachments with test case design slides
- **Specific test cases**: See `TEST_CASES_ADMIN_EDIT.md`
- **Test implementation**: Check the test files with detailed comments
- **Feature requirements**: See `.github/instructions/US015-edit-job-role.instructions.md`
