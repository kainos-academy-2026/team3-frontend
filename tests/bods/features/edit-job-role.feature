@ui @admin @edit-job-role
Feature: Admin edits job roles
  To maintain accurate job posting information
  As an admin
  I want to edit existing job role details

  @smoke
  Scenario: Admin successfully edits job role fields
    Given I am authenticated as an admin
    When I navigate to the edit page for job role with ID 1
    And I update all fields with valid data
    And I click the submit button
    Then I should be redirected to the job role detail page
    And I should see a success banner

  Scenario: Admin edits only some fields
    Given I am authenticated as an admin
    When I navigate to the edit page for job role with ID 1
    And I update only the role name and location:
      | roleName | Updated Engineer |
      | location | Belfast          |
    And I click the submit button
    Then I should be redirected to the job role detail page
    And the detail page shows the updated role name "Updated Engineer"

  Scenario Outline: Admin sees validation errors for invalid data
    Given I am authenticated as an admin
    When I navigate to the edit page for job role with ID 1
    And I enter "<value>" in the <field> field
    And I click the submit button
    Then I should remain on the edit job role page
    And I should see an error message "<error>"

    Examples:
      | field                   | value        | error                                           |
      | roleName                |              | Role name is required.                          |
      | sharepointUrl           | not-a-url    | SharePoint URL must be a valid URL.              |
      | numberOfOpenPositions   | 0            | Number of open positions must be a positive integer. |
      | numberOfOpenPositions   | -5           | Number of open positions must be a positive integer. |

  Scenario: Non-admin user cannot access the edit page
    Given I am authenticated as a regular user
    When I try to access the edit page for job role with ID 1 directly
    Then I should receive a 403 Forbidden response

  Scenario: User is redirected to login when not authenticated
    When I try to access the edit page for job role with ID 1 directly without authentication
    Then I should be redirected to the login page
