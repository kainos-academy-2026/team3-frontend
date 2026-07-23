@ui @bdd @create-role
Feature: Create Job Role
	To manage open positions at Kainos
	As an admin
	I want to create a new job role from the frontend

	Rule: Admins can create job roles

		Background:
			Given I am logged in as an admin

		@smoke
		Scenario: Admin creates a valid job role and sees a success message
			When I click the "Create new role" button on the job roles list
			And I fill in the role details with valid data
			And I submit the create role form
			Then I should be on the job roles list page
			And I should see the success message "Job role created successfully."

		Scenario: Admin submits the form with missing role name and invalid SharePoint URL
			When I click the "Create new role" button on the job roles list
			And I submit the create role form without a role name and with an invalid SharePoint URL
			Then I should remain on the create role form
			And I should see a field error for "Role name"
			And I should see a field error for "SharePoint URL"

	Rule: Access to the create role form is restricted

		Scenario: Non-admin user cannot access the create role form
			Given I am logged in as a regular user
			When I navigate directly to the create role form
			Then I should see "You do not have permission to access this page."

		Scenario: Unauthenticated user is redirected to the login page
			Given I am not logged in
			When I navigate directly to the create role form
			Then I should be on the login page