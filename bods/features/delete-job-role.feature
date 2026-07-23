@ui @bdd @job-roles @delete-role
Feature: Delete a job role
	To keep the vacancies list accurate
	As a recruiter or hiring admin
	I want job roles to be deletable only when there are no applications

	@smoke
	Scenario: Admin deletes a job role that has no applications
		Given an admin user is signed in
		And a deletable job role exists
		When the admin deletes the job role
		Then the admin is returned to the job role list with a delete success message

	@has-applications
	Scenario: Admin cannot delete a job role that already has applications
		Given an admin user is signed in
		And a job role with existing applications exists
		When the admin attempts to delete the job role
		Then the job role detail page shows that the role cannot be deleted

	Scenario: Non-admin users do not see the delete action
		Given a standard user is signed in
		When the user opens a job role detail page
		Then the delete action is not shown
