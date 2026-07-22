import { type Locator, type Page } from "@playwright/test";
import type { CreateUserInput } from "../data/users.ts";

export class CreateUserPage {
	readonly page: Page;
	readonly emailInput: Locator;
	readonly passwordInput: Locator;
	readonly confirmPasswordInput: Locator;
	readonly submitButton: Locator;
	readonly successHeading: Locator;

	constructor(page: Page) {
		this.page = page;
		this.emailInput = page.getByLabel("Email");
		this.passwordInput = page.getByLabel("Password", { exact: true });
		this.confirmPasswordInput = page.getByLabel("Confirm Password");
		this.submitButton = page.getByRole("button", { name: "Create account" });
		this.successHeading = page.getByRole("heading", {
			name: "Well done, you are now registered.",
		});
	}

	async goto(baseUrl: string): Promise<void> {
		await this.page.goto(`${baseUrl}/register`);
	}

	async fillRegistrationForm(user: CreateUserInput): Promise<void> {
		await this.emailInput.fill(user.email);
		await this.passwordInput.fill(user.password);
		await this.confirmPasswordInput.fill(user.confirmPassword);
	}

	async submit(): Promise<void> {
		await this.submitButton.click();
	}
}
