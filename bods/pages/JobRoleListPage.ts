import type { Locator, Page } from "@playwright/test";

export class JobRoleListPage {
	constructor(private readonly page: Page) {}

	async goto(baseUrl: string): Promise<void> {
		await this.page.goto(`${baseUrl}/job-roles`);
	}

	getCreateRoleButton(): Locator {
		return this.page.getByRole("link", { name: "Create new role" });
	}

	getSuccessBanner(): Locator {
		return this.page
			.getByRole("status")
			.filter({ hasText: "Job role created successfully." });
	}
}
