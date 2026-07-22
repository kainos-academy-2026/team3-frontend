import { Given, Then, When } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { buildUser } from "../data/users.ts";
import { type BddWorld } from "../fixtures/bods.fixture.ts";
import { CreateUserPage } from "../pages/CreateUserPage.ts";

Given("a visitor is on the registration page", async function (this: BddWorld) {
	if (!this.page) {
		throw new Error("Browser page was not initialised.");
	}

	this.createUserPage = new CreateUserPage(this.page);
	await this.createUserPage.goto(this.baseUrl);
});

When(
	"they submit valid registration details",
	async function (this: BddWorld) {
		if (!this.createUserPage) {
			throw new Error("Create user page is not available in the world context.");
		}

		const user = buildUser();
		this.lastRegisteredUser = user;
		await this.createUserPage.fillRegistrationForm(user);
		await this.createUserPage.submit();
	},
);

Then(
	"their account is created and they are shown the registration success page",
	async function (this: BddWorld) {
		if (!this.page || !this.createUserPage) {
			throw new Error("Scenario state is incomplete for success assertions.");
		}

		await expect(this.page).toHaveURL(`${this.baseUrl}/register/success`);
		await expect(this.createUserPage.successHeading).toBeVisible();
	},
);
