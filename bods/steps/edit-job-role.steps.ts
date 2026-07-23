import process from "node:process";
import { Given, Then, When } from "@cucumber/cucumber";
import { expect, type Page } from "@playwright/test";
import type { DataTable } from "@cucumber/cucumber";
import type { BddWorld } from "../fixtures/bods.fixture.ts";
import { SignInPage } from "../pages/SignInPage.ts";

type EditableJobRoleFields = {
	roleName: string;
	location: string;
	closingDate: string;
	status: "Open" | "Closed";
	numberOfOpenPositions: string;
	description: string;
	responsibilities: string;
	sharepointUrl: string;
};

const DEFAULT_ADMIN_EMAIL =
	process.env.TEST_ADMIN_EMAIL ?? process.env.ADMIN_EMAIL ?? "admin@example.com";
const DEFAULT_ADMIN_PASSWORD =
	process.env.TEST_ADMIN_PASSWORD ??
	process.env.ADMIN_PASSWORD ??
	"AdminPassword123";
const DEFAULT_USER_EMAIL =
	process.env.TEST_USER_EMAIL ?? process.env.USER_EMAIL ?? "test@example.com";
const DEFAULT_USER_PASSWORD =
	process.env.TEST_USER_PASSWORD ??
	process.env.USER_PASSWORD ??
	"TestPassword123";

function ensurePage(world: BddWorld): Page {
	if (!world.page) {
		throw new Error("Browser page was not initialised.");
	}
	return world.page;
}

async function fillFieldByName(
	page: Page,
	fieldName: string,
	value: string,
): Promise<void> {
	const field = page.locator(`[name="${fieldName}"]`);
	if (!(await field.isVisible({ timeout: 1500 }).catch(() => false))) {
		throw new Error(`Field \"${fieldName}\" is not visible.`);
	}

	const tagName = await field.evaluate((el) => el.tagName.toLowerCase());
	if (tagName === "select") {
		await field.selectOption(value);
		return;
	}

	await field.fill(value);
}

async function fillEditForm(
	page: Page,
	data: Partial<EditableJobRoleFields>,
): Promise<void> {
	const entries = Object.entries(data) as Array<[keyof EditableJobRoleFields, string]>;
	for (const [fieldName, value] of entries) {
		await fillFieldByName(page, fieldName, value);
	}
}

Given("I am authenticated as an admin", { timeout: 30_000 }, async function (this: BddWorld) {
	const signInPage = new SignInPage(ensurePage(this));
	await signInPage.goto(this.baseUrl);
	await signInPage.login(DEFAULT_ADMIN_EMAIL, DEFAULT_ADMIN_PASSWORD);
});

Given(
	"I am authenticated as a regular user",
	{ timeout: 30_000 },
	async function (this: BddWorld) {
		const signInPage = new SignInPage(ensurePage(this));
		await signInPage.goto(this.baseUrl);
		await signInPage.login(DEFAULT_USER_EMAIL, DEFAULT_USER_PASSWORD);
	},
);

When(
	"I navigate to the edit page for job role with ID {int}",
	async function (this: BddWorld, jobRoleId: number) {
		const page = ensurePage(this);
		await page.goto(`${this.baseUrl}/job-roles/${jobRoleId}`, {
			waitUntil: "domcontentloaded",
		});
		await page.getByRole("link", { name: /edit job role/i }).click();
		await page.waitForURL(new RegExp(`/job-roles/${jobRoleId}/edit(?:\\?.*)?$`));
		this.currentJobRoleId = jobRoleId;
	},
);

When("I update all fields with valid data", async function (this: BddWorld) {
	const page = ensurePage(this);
	await fillEditForm(page, {
		roleName: "Principal Engineer",
		location: "London",
		closingDate: "2026-06-30",
		status: "Open",
		numberOfOpenPositions: "3",
		description: "Lead backend strategy",
		responsibilities: "Architecture, mentoring",
		sharepointUrl: "https://example.com/new-role",
	});
});

When(
	"I update only the role name and location:",
	async function (this: BddWorld, dataTable: DataTable) {
		const page = ensurePage(this);
		const row = dataTable.rowsHash() as Record<string, string>;
		await fillEditForm(page, {
			roleName: row.roleName,
			location: row.location,
		});
	},
);

When("I click the submit button", async function (this: BddWorld) {
	const page = ensurePage(this);
	await page.getByRole("button", { name: /save changes/i }).click();
	await page.waitForLoadState("networkidle");
});

When(
	"I enter {string} in the {word} field",
	async function (this: BddWorld, value: string, fieldName: string) {
		await fillFieldByName(ensurePage(this), fieldName, value);
	},
);

When(
	"I try to access the edit page for job role with ID {int} directly",
	async function (this: BddWorld, jobRoleId: number) {
		const page = ensurePage(this);
		const response = await page.goto(`${this.baseUrl}/job-roles/${jobRoleId}/edit`, {
			waitUntil: "domcontentloaded",
		});
		this.lastStatus = response?.status() ?? null;
	},
);

When(
	"I try to access the edit page for job role with ID {int} directly without authentication",
	async function (this: BddWorld, jobRoleId: number) {
		const page = ensurePage(this);
		const response = await page.goto(`${this.baseUrl}/job-roles/${jobRoleId}/edit`, {
			waitUntil: "domcontentloaded",
		});
		this.lastStatus = response?.status() ?? null;
	},
);

Then("I should be redirected to the job role detail page", async function (this: BddWorld) {
	const page = ensurePage(this);
	if (!this.currentJobRoleId) {
		throw new Error("No current job role ID set for redirect assertion.");
	}
	await expect(page).toHaveURL(new RegExp(`/job-roles/${this.currentJobRoleId}(?:\\?.*)?$`));
	await expect(page).not.toHaveURL(/\/edit(?:\?|$)/);
});

Then("I should see a success banner", async function (this: BddWorld) {
	await expect(ensurePage(this).getByRole("alert")).toContainText(
		"Job role updated successfully.",
	);
});

Then(
	"the detail page shows the updated role name {string}",
	async function (this: BddWorld, roleName: string) {
		await expect(ensurePage(this).locator("#job-role-heading")).toContainText(roleName);
	},
);

Then("I should remain on the edit job role page", async function (this: BddWorld) {
	await expect(ensurePage(this)).toHaveURL(/\/job-roles\/\d+\/edit(?:\?|$)/);
});

Then(
	"I should see an error message {string}",
	async function (this: BddWorld, errorMessage: string) {
		await expect(ensurePage(this).getByRole("alert")).toContainText(errorMessage);
	},
);

Then(
	"I should receive a {int} Forbidden response",
	function (this: BddWorld, statusCode: number) {
		expect(this.lastStatus).toBe(statusCode);
	},
);

Then("I should be redirected to the login page", async function (this: BddWorld) {
	await expect(ensurePage(this)).toHaveURL(/\/login(?:\?|$)/);
});
