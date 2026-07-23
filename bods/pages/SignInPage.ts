import type { Page } from "@playwright/test";

export class SignInPage {
	constructor(private readonly page: Page) {}

	async goto(baseUrl: string): Promise<void> {
		await this.page.goto(`${baseUrl}/login`);
	}

	async login(email: string, password: string): Promise<void> {
		await this.page.getByLabel("Email").fill(email);
		await this.page.getByLabel("Password").fill(password);
		await this.page.getByRole("button", { name: "Sign in" }).click();
		await this.page.waitForURL(/\/job-roles(?:\?|$)/);
	}
}
