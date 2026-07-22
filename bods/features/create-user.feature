@ui @bdd @auth
Feature: Create user account
	To access job role features
	As a new visitor
	I want to create an account

	@smoke
	Scenario: New visitor successfully creates an account
		Given a visitor is on the registration page
		When they submit valid registration details
		Then their account is created and they are shown the registration success page
