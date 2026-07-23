import process from "node:process";
import { Given, Then, When } from "@cucumber/cucumber";
import { expect } from "@playwright/test";
import { buildJobRoleData } from "../data/jobRoles.ts";
import type { BddWorld } from "../fixtures/bods.fixture.ts";
import { CreateJobRolePage } from "../pages/CreateJobRolePage.ts";
import { JobRoleListPage } from "../pages/JobRoleListPage.ts";
import { SignInPage } from "../pages/SignInPage.ts";

const DEFAULT_ADMIN_EMAIL = "admin@example.com";
const DEFAULT_ADMIN_PASSWORD = "AdminPassword123";
const DEFAULT_USER_EMAIL = "test@example.com";
const DEFAULT_USER_PASSWORD = "TestPassword123";

function resolveCredential(
	primaryKey: string,
	fallbackKey: string,
): string | undefined {
	return process.env[primaryKey] ?? process.env[fallbackKey];
}

function ensurePage(world: BddWorld) {
	if (!world.page) {
		throw new Error("Browser page was not initialised.");
	}
	return world.page;
}

function ensureRequestContext(world: BddWorld) {
	if (!world.requestContext) {
		throw new Error("Request context was not initialised.");
	}
	return world.requestContext;
}

async function loginForCleanup(
	world: BddWorld,
	email: string,
	password: string,
): Promise<void> {
	const requestContext = ensureRequestContext(world);
	const response = await requestContext.post(
		`${world.backendApiUrl}/auth/login`,
		{
			data: { email, password },
		},
	);

	if (!response.ok()) {
		throw new Error(
			`Backend admin login failed with status ${response.status()}. Check TEST_ADMIN_EMAIL/TEST_ADMIN_PASSWORD (or ADMIN_EMAIL/ADMIN_PASSWORD).`,
		);
	}

	const body = (await response.json()) as { token?: string };
	if (typeof body.token !== "string" || body.token.length === 0) {
		throw new Error("Backend admin login did not return a token.");
	}

	world.adminJwt = body.token;
}

async function resolveCreatedRoleId(world: BddWorld): Promise<number | null> {
	const requestContext = ensureRequestContext(world);
	const token = world.adminJwt;
	const roleName = world.createdRoleInput?.roleName;

	if (!token || !roleName) {
		return null;
	}

	let page = 1;

	while (true) {
		const response = await requestContext.get(
			`${world.backendApiUrl}/job-roles?limit=30&page=${page}`,
			{
				headers: { Authorization: `Bearer ${token}` },
			},
		);

		if (!response.ok()) {
			throw new Error(
				`Unable to resolve created job role ID. Backend returned ${response.status()}.`,
			);
		}

		const body = (await response.json()) as {
			data?: Array<{ id: number; roleName: string }>;
			pagination?: { hasNext?: boolean };
		};

		const match = body.data?.find((role) => role.roleName === roleName);
		if (match) {
			return match.id;
		}

		if (!body.pagination?.hasNext) {
			return null;
		}

		page += 1;
	}
}

Given("I am logged in as an admin", async function (this: BddWorld) {
	const email =
		resolveCredential("TEST_ADMIN_EMAIL", "ADMIN_EMAIL") ??
		DEFAULT_ADMIN_EMAIL;
	const password =
		resolveCredential("TEST_ADMIN_PASSWORD", "ADMIN_PASSWORD") ??
		DEFAULT_ADMIN_PASSWORD;

	await loginForCleanup(this, email, password);
	this.adminEmail = email;
	this.adminPassword = password;

	const signInPage = new SignInPage(ensurePage(this));
	await signInPage.goto(this.baseUrl);
	await signInPage.login(email, password);
});

Given("I am logged in as a regular user", async function (this: BddWorld) {
	const email =
		resolveCredential("TEST_USER_EMAIL", "USER_EMAIL") ?? DEFAULT_USER_EMAIL;
	const password =
		resolveCredential("TEST_USER_PASSWORD", "USER_PASSWORD") ??
		DEFAULT_USER_PASSWORD;

	const signInPage = new SignInPage(ensurePage(this));
	await signInPage.goto(this.baseUrl);
	await signInPage.login(email, password);
});

Given("I am not logged in", () => undefined);

When(
	'I click the "Create new role" button on the job roles list',
	async function (this: BddWorld) {
		const page = ensurePage(this);
		const listPage = new JobRoleListPage(page);
		await listPage.goto(this.baseUrl);
		await listPage.getCreateRoleButton().click();
		await page.waitForURL(/\/job-roles\/new(?:\?|$)/);
	},
);

When(
	"I navigate directly to the create role form",
	async function (this: BddWorld) {
		const createRolePage = new CreateJobRolePage(ensurePage(this));
		await createRolePage.goto(this.baseUrl);
	},
);

When(
	"I fill in the role details with valid data",
	async function (this: BddWorld) {
		const createPage = new CreateJobRolePage(ensurePage(this));
		const jobRoleInput = buildJobRoleData();
		this.createdRoleInput = jobRoleInput;
		await createPage.fillForm(jobRoleInput);
	},
);

When(
	"I submit the create role form without a role name and with an invalid SharePoint URL",
	async function (this: BddWorld) {
		const createPage = new CreateJobRolePage(ensurePage(this));
		await createPage.fillForm(
			buildJobRoleData({ roleName: "", sharepointUrl: "not-a-valid-url" }),
		);
		await createPage.submit();
	},
);

When("I submit the create role form", async function (this: BddWorld) {
	const page = ensurePage(this);
	const createPage = new CreateJobRolePage(page);
	await createPage.submit();
	await page.waitForURL(/\/job-roles\?created=true/);
	this.createdRoleId = await resolveCreatedRoleId(this);
	if (this.createdRoleId === null) {
		throw new Error("Unable to resolve created job role ID for cleanup.");
	}
});

Then("I should be on the job roles list page", async function (this: BddWorld) {
	await expect(ensurePage(this)).toHaveURL(/\/job-roles(?:\?|$)/);
});

Then(
	"I should see the success message {string}",
	async function (this: BddWorld, message: string) {
		const listPage = new JobRoleListPage(ensurePage(this));
		await expect(listPage.getSuccessBanner()).toContainText(message);
	},
);

Then(
	"I should remain on the create role form",
	async function (this: BddWorld) {
		const page = ensurePage(this);
		await expect(page.getByRole("heading", { name: "Create a new role" })).toBeVisible();
		await expect(page).toHaveURL(/\/job-roles(?:\/new)?(?:\?|$)/);
	},
);

Then(
	"I should see a field error for {string}",
	async function (this: BddWorld, labelText: string) {
		const createPage = new CreateJobRolePage(ensurePage(this));
		await expect(createPage.getFieldError(labelText)).toBeVisible();
	},
);

Then("I should see {string}", async function (this: BddWorld, text: string) {
	await expect(ensurePage(this).getByText(text)).toBeVisible();
});

Then("I should be on the login page", async function (this: BddWorld) {
	await expect(ensurePage(this)).toHaveURL(/\/login(?:\?|$)/);
});

Then("I should be on the home page", async function (this: BddWorld) {
	await expect(
		ensurePage(this).getByRole("heading", { name: "Find your next role" }),
	).toBeVisible();
});
