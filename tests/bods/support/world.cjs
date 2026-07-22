const { World } = require("@cucumber/cucumber");

class CustomWorld extends World {
	constructor(options) {
		super(options);
		this.baseURL = process.env.BASE_URL || "http://127.0.0.1:3000";
		this.browser = null;
		this.context = null;
		this.page = null;
		this.lastResponse = null;
		this.lastJson = null;
		this.lastStatus = null;
		this.currentJobRole = null;
		this.adminToken = null;
		this.userToken = null;
		this.formValues = {};
		this.errorMessage = null;
	}

	// Playwright page navigation helpers
	async navigateTo(path) {
		if (!this.page) throw new Error("Page not initialized");
		await this.page.goto(`${this.baseURL}${path}`, {
			waitUntil: "domcontentloaded",
		});
	}

	// API call helpers using page.request
	async apiGet(endpoint, token = null) {
		if (!this.page) throw new Error("Page not initialized");
		const headers = token ? { Authorization: `Bearer ${token}` } : {};
		this.lastResponse = await this.page.request.get(
			`${this.baseURL}${endpoint}`,
			{ headers },
		);
		this.lastStatus = this.lastResponse.status();
		this.lastJson = await this.lastResponse.json().catch(() => null);
		return this.lastResponse;
	}

	async apiPost(endpoint, payload, token = null) {
		if (!this.page) throw new Error("Page not initialized");
		const headers = token ? { Authorization: `Bearer ${token}` } : {};
		this.lastResponse = await this.page.request.post(
			`${this.baseURL}${endpoint}`,
			{
				data: payload,
				headers,
			},
		);
		this.lastStatus = this.lastResponse.status();
		this.lastJson = await this.lastResponse.json().catch(() => null);
		return this.lastResponse;
	}

	async apiPatch(endpoint, payload, token = null) {
		if (!this.page) throw new Error("Page not initialized");
		const headers = token ? { Authorization: `Bearer ${token}` } : {};
		this.lastResponse = await this.page.request.patch(
			`${this.baseURL}${endpoint}`,
			{
				data: payload,
				headers,
			},
		);
		this.lastStatus = this.lastResponse.status();
		this.lastJson = await this.lastResponse.json().catch(() => null);
		return this.lastResponse;
	}

	// UI interaction helpers
	async fillForm(fieldValues) {
		if (!this.page) throw new Error("Page not initialized");
		for (const [fieldName, value] of Object.entries(fieldValues)) {
			// Try multiple ways to find and fill the field
			try {
				// Try by name attribute (for both input and select)
				const field = this.page.locator(`[name="${fieldName}"]`);
				if (await field.isVisible({ timeout: 1000 }).catch(() => false)) {
					const type = await field.getAttribute("type").catch(() => null);

					if (type === "date") {
						// For date inputs, set value directly
						await field.evaluate((el, val) => {
							el.value = val;
							el.dispatchEvent(new Event("change", { bubbles: true }));
						}, String(value));
					} else if (type === "number") {
						// For number inputs
						await field.fill(String(value));
					} else if (type === "select-one" || type === null) {
						// For selects and text inputs
						const tagName = await field.evaluate((el) => el.tagName);
						if (tagName === "SELECT") {
							await field.selectOption(String(value));
						} else {
							await field.clear();
							await field.fill(String(value));
						}
					} else {
						// For other types (text, url, email, etc)
						await field.clear();
						await field.fill(String(value));
					}
					continue;
				}

				// Try by label as fallback
				const label = this.page.getByLabel(new RegExp(fieldName, "i"));
				if (await label.isVisible({ timeout: 500 }).catch(() => false)) {
					await label.clear();
					await label.fill(String(value));
				}
			} catch (_e) {
				// Field might not exist or be hidden, skip it
				console.log(`Could not fill field: ${fieldName}`);
			}
		}
		this.formValues = fieldValues;
	}

	async fillField(fieldName, value) {
		if (!this.page) throw new Error("Page not initialized");
		try {
			// Try by name attribute first
			const field = this.page.locator(`[name="${fieldName}"]`);
			if (await field.isVisible({ timeout: 2000 }).catch(() => false)) {
				const type = await field.getAttribute("type").catch(() => null);

				if (type === "date") {
					await field.evaluate((el, val) => {
						el.value = val;
						el.dispatchEvent(new Event("change", { bubbles: true }));
					}, String(value));
				} else if (type === "number") {
					await field.fill(String(value));
				} else {
					await field.clear();
					await field.fill(String(value));
				}
				return;
			}

			// Try by label as fallback
			const label = this.page.getByLabel(new RegExp(fieldName, "i"));
			if (await label.isVisible({ timeout: 2000 }).catch(() => false)) {
				await label.clear();
				await label.fill(String(value));
				return;
			}

			throw new Error(`Field "${fieldName}" not found`);
		} catch (e) {
			throw new Error(`Failed to fill field "${fieldName}": ${e.message}`);
		}
	}

	async clickButton(buttonPattern) {
		if (!this.page) throw new Error("Page not initialized");

		// Try to find button by role and name pattern (case-insensitive regex)
		const button = this.page.getByRole("button", {
			name: new RegExp(buttonPattern, "i"),
		});

		const isVisible = await button
			.isVisible({ timeout: 2000 })
			.catch(() => false);
		if (!isVisible) {
			// List available buttons for debugging
			const allButtons = await this.page
				.locator("button")
				.allTextContents()
				.catch(() => []);
			throw new Error(
				`Button with pattern "${buttonPattern}" not found. Available buttons: ${allButtons.join(", ")}`,
			);
		}

		await button.click();
		// Wait for navigation or network idle
		await Promise.race([
			this.page.waitForNavigation({ timeout: 5000 }).catch(() => null),
			this.page.waitForLoadState("networkidle").catch(() => null),
		]);
	}

	// Assertion helpers
	async isOnPage(expectedPath) {
		if (!this.page) throw new Error("Page not initialized");
		const currentUrl = this.page.url();
		return currentUrl.includes(expectedPath);
	}

	async hasText(text) {
		if (!this.page) throw new Error("Page not initialized");
		return this.page
			.getByText(text)
			.isVisible()
			.catch(() => false);
	}

	async hasErrorMessage(errorText) {
		if (!this.page) throw new Error("Page not initialized");
		const alert = this.page.locator('[role="alert"]');
		return alert
			.filter({ hasText: errorText })
			.isVisible()
			.catch(() => false);
	}
}

module.exports = { CustomWorld };
