const { Given, When, Then } = require("@cucumber/cucumber");
const { expect } = require("@playwright/test");

const DEFAULT_ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "AdminPassword123";
const DEFAULT_USER_EMAIL = process.env.USER_EMAIL || "test@example.com";
const DEFAULT_USER_PASSWORD = process.env.USER_PASSWORD || "TestPassword123";

// Given steps
Given("I am authenticated as an admin", { timeout: 30000 }, async function () {
	await this.navigateTo("/login");

	console.log(`Filling login form with email: ${DEFAULT_ADMIN_EMAIL}`);
	const emailField = this.page.getByLabel(/email|username/i);
	const passwordField = this.page.getByLabel(/password/i);

	await emailField.fill(DEFAULT_ADMIN_EMAIL);
	await passwordField.fill(DEFAULT_ADMIN_PASSWORD);

	console.log(`Clicking sign in button...`);
	const signInBtn = this.page.getByRole("button", { name: /sign in|login/i });
	await signInBtn.click();

	// Allow slower environments to complete redirect without waiting for full page load.
	try {
		await this.page.waitForURL(/\/job-roles(?:\/|$)/, {
			timeout: 20000,
			waitUntil: "domcontentloaded",
		});
	} catch (_error) {
		const loginAlert = await this.page
			.locator('[role="alert"]')
			.first()
			.textContent({ timeout: 1000 })
			.catch(() => "");
		throw new Error(
			`Admin login did not redirect to /job-roles within 20s. Alert: ${loginAlert || "none"}. Check ADMIN_EMAIL/ADMIN_PASSWORD values.`,
		);
	}

	const currentUrl = this.page.url();
	const pageTitle = await this.page.title();
	console.log(`After sign in - URL: ${currentUrl}, Title: ${pageTitle}`);

	// Get actual error text from alert
	const alertText = await this.page
		.locator('[role="alert"]')
		.textContent()
		.catch(() => "");
	if (alertText) {
		console.log(`Alert on page: ${alertText}`);
	}

	// Capture cookies
	const cookies = await this.context.cookies();
	console.log(
		`Cookies after login:`,
		cookies.map((c) => `${c.name}`),
	);

	if (cookies.length === 0) {
		console.log(`ERROR: No cookies set after login attempt`);
		// Get more page details for debugging
		const allText = await this.page.locator("body").textContent();
		console.log(`Page text preview: ${allText.substring(0, 500)}`);
	}

	this.loginCookies = cookies;
});

Given(
	"I am authenticated as a regular user",
	{ timeout: 30000 },
	async function () {
		await this.navigateTo("/login");

		console.log(`Logging in as regular user: ${DEFAULT_USER_EMAIL}`);
		await this.page.getByLabel(/email|username/i).fill(DEFAULT_USER_EMAIL);
		await this.page.getByLabel(/password/i).fill(DEFAULT_USER_PASSWORD);

		const signInBtn = this.page.getByRole("button", { name: /sign in|login/i });
		await signInBtn.click();

		try {
			await this.page.waitForURL(/\/job-roles(?:\/|$)/, {
				timeout: 20000,
				waitUntil: "domcontentloaded",
			});
		} catch (_error) {
			const loginAlert = await this.page
				.locator('[role="alert"]')
				.first()
				.textContent({ timeout: 1000 })
				.catch(() => "");
			throw new Error(
				`User login did not redirect to /job-roles within 20s. Alert: ${loginAlert || "none"}. Check USER_EMAIL/USER_PASSWORD values.`,
			);
		}

		const currentUrl = this.page.url();
		const cookies = await this.context.cookies();
		console.log(
			`After user login - URL: ${currentUrl}, Cookies: ${cookies.map((c) => c.name).join(",")}`,
		);
	},
);

// When steps
When(
	"I navigate to the edit page for job role with ID {int}",
	async function (jobRoleId) {
		const detailUrl = `${this.baseURL}/job-roles/${jobRoleId}`;
		console.log(`Navigating to detail page first: ${detailUrl}`);

		const response = await this.page.goto(detailUrl, {
			waitUntil: "domcontentloaded",
		});
		console.log(`Detail page response status: ${response?.status()}`);

		await this.page.getByRole("link", { name: /edit job role/i }).click();
		await this.page.waitForURL(
			new RegExp(`/job-roles/${jobRoleId}/edit(?:\\?.*)?$`),
			{
				timeout: 10000,
			},
		);

		const pageUrl = this.page.url();
		console.log(`Page URL after clicking edit: ${pageUrl}`);

		if (!pageUrl.includes(`/job-roles/${jobRoleId}/edit`)) {
			throw new Error(`Expected to be on edit page, got: ${pageUrl}`);
		}

		this.currentJobRoleId = jobRoleId;
	},
);

When(
	"I update all fields with valid data",
	{ timeout: 15000 },
	async function () {
		const updateData = {
			roleName: "Principal Engineer",
			location: "London",
			capabilityId: 2,
			bandId: 3,
			closingDate: "2026-06-30",
			description: "Lead backend strategy",
			responsibilities: "Architecture, mentoring",
			sharepointUrl: "https://example.com/new-role",
			numberOfOpenPositions: 3,
		};

		console.log(`Filling form with data:`, Object.keys(updateData));
		const pageUrl = this.page.url();
		console.log(`Current page URL before filling: ${pageUrl}`);

		// Check what buttons are visible
		const allButtons = await this.page
			.locator("button")
			.allTextContents()
			.catch(() => []);
		console.log(`Available buttons on page:`, allButtons);

		await this.fillForm(updateData);
		this.lastUpdateData = updateData;
	},
);

When("I update only the role name and location:", async function (dataTable) {
	const entries = dataTable.rowsHash();
	const data = {};
	Object.entries(entries).forEach(([key, value]) => {
		if (
			key === "numberOfOpenPositions" ||
			key === "capabilityId" ||
			key === "bandId"
		) {
			data[key] = Number(value);
		} else {
			data[key] = value;
		}
	});
	await this.fillForm(data);
	this.lastUpdateData = data;
});

When("I click the submit button", { timeout: 15000 }, async function () {
	await this.clickButton("save|update");
});

When("I enter {string} in the {word} field", async function (value, fieldName) {
	if (value === "") {
		await this.fillField(fieldName, value);
	} else {
		await this.fillField(fieldName, value);
	}
});

When(
	"I try to access the edit page for job role with ID {int} directly",
	async function (jobRoleId) {
		// Store current cookies to verify auth is still there
		const cookiesBefore = await this.context.cookies();
		console.log(
			`Cookies before accessing edit page: ${cookiesBefore.map((c) => c.name).join(",")}`,
		);
		console.log(
			`Session userRole should be: ${this.page._userRole || "unknown"}`,
		);

		const response = await this.page.goto(
			`${this.baseURL}/job-roles/${jobRoleId}/edit`,
		);
		this.lastStatus = response?.status();

		const finalUrl = this.page.url();
		console.log(
			`After accessing edit page - Status: ${this.lastStatus}, Final URL: ${finalUrl}`,
		);
	},
);

When(
	"I try to access the edit page for job role with ID {int} directly without authentication",
	async function (jobRoleId) {
		// Navigate without logging in
		const response = await this.page.goto(
			`${this.baseURL}/job-roles/${jobRoleId}/edit`,
		);
		this.lastStatus = response?.status();
	},
);

// Then steps
Then("I should be redirected to the job role detail page", async function () {
	await this.page.waitForLoadState("networkidle");
	const url = this.page.url();
	expect(url).toContain(`/job-roles/${this.currentJobRoleId}`);
	expect(url).not.toContain("/edit");
});

Then("I should see a success banner", async function () {
	const banner = this.page.locator('[role="alert"]');
	await expect(banner).toBeVisible();
});

Then(
	"the detail page shows the updated role name {string}",
	{ timeout: 15000 },
	async function (roleName) {
		const heading = this.page.locator("#job-role-heading");
		await expect(heading).toContainText(roleName, { timeout: 10000 });
	},
);

Then("I should remain on the edit job role page", async function () {
	const url = this.page.url();
	expect(url).toContain("/edit");
});

Then("I should see an error message {string}", async function (errorMessage) {
	const hasError = await this.hasErrorMessage(errorMessage);
	expect(hasError).toBe(true);
});

Then(
	"I should receive a {int} Forbidden response",
	async function (statusCode) {
		expect(this.lastStatus).toBe(statusCode);
	},
);

Then("I should be redirected to the login page", async function () {
	await this.page.waitForLoadState("networkidle");
	const url = this.page.url();
	expect(url).toContain("/login");
});
