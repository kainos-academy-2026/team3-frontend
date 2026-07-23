import { expect, type Locator, type Page } from "@playwright/test";

export class DeleteJobRolePage {
	readonly emailInput: Locator;
	readonly passwordInput: Locator;
	readonly signInButton: Locator;
	readonly deleteRoleButton: Locator;

	constructor(private readonly page: Page) {
		this.emailInput = page.getByLabel("Email");
		this.passwordInput = page.getByLabel("Password");
		this.signInButton = page.getByRole("button", { name: "Sign in" });
		this.deleteRoleButton = page.getByRole("button", { name: "Delete role" });
	}

	async signIn(email: string, password: string): Promise<void> {
		await this.page.goto("/login");
		await this.emailInput.fill(email);
		await this.passwordInput.fill(password);
		await this.signInButton.click();

		const invalidCredentialsMessage = this.page.getByText(
			"Invalid email or password.",
			{ exact: true },
		);
		const unavailableMessage = this.page.getByText(
			"Unable to sign in right now.",
			{ exact: true },
		);
		const missingFieldsMessage = this.page.getByText(
			"Email and password are required.",
			{ exact: true },
		);

		const outcome = await Promise.any([
			this.page
				.waitForURL(/\/job-roles(?:\?.*)?$/, { timeout: 10_000 })
				.then(() => "success" as const),
			invalidCredentialsMessage
				.waitFor({ state: "visible", timeout: 10_000 })
				.then(() => "invalid-credentials" as const),
			unavailableMessage
				.waitFor({ state: "visible", timeout: 10_000 })
				.then(() => "service-unavailable" as const),
			missingFieldsMessage
				.waitFor({ state: "visible", timeout: 10_000 })
				.then(() => "missing-fields" as const),
		]).catch(() => "timeout" as const);

		switch (outcome) {
			case "success":
				return;
			case "invalid-credentials":
				throw new Error(
					`Sign in failed for ${email}: invalid email or password.`,
				);
			case "service-unavailable":
				throw new Error(
					`Sign in failed for ${email}: application reported it could not sign in right now.`,
				);
			case "missing-fields":
				throw new Error(
					`Sign in failed for ${email}: login form reported missing fields.`,
				);
			default:
				throw new Error(
					`Sign in for ${email} did not reach /job-roles within 10 seconds. Check credentials, backend availability, or frontend startup.`,
				);
		}
	}

	async gotoJobRoleDetails(jobRoleId: number): Promise<void> {
		await this.page.goto(`/job-roles/${jobRoleId}`);
	}

	async findRoleWithApplicationsId(): Promise<number> {
		await this.page.goto("/job-roles");

		for (let pageNumber = 1; pageNumber <= 10; pageNumber += 1) {
			const roleLinks = await this.page
				.locator('.role-card-wrapper a[href^="/job-roles/"]')
				.evaluateAll((links) =>
					links
						.map((link) => link.getAttribute("href"))
						.filter((href): href is string => Boolean(href)),
				);

			for (const roleLink of roleLinks) {
				const match = roleLink.match(/\/job-roles\/(\d+)$/);
				if (!match) {
					continue;
				}

				const jobRoleId = Number(match[1]);
				await this.gotoAdminApplicationsPage(jobRoleId);

				if ((await this.page.locator(".admin-applications__item").count()) > 0) {
					return jobRoleId;
				}
			}

			const nextLink = this.page.getByRole("link", { name: "Next" });
			if ((await nextLink.count()) === 0) {
				break;
			}

			await nextLink.click();
		}

		throw new Error(
			"Could not find a job role with existing applications from the job role list.",
		);
	}

	private async gotoAdminApplicationsPage(jobRoleId: number): Promise<void> {
		await this.page.goto(`/job-roles/${jobRoleId}/applications`);
	}

	async deleteRole(): Promise<void> {
		await Promise.all([
			this.page.waitForEvent("dialog").then(async (dialog) => {
				await dialog.accept();
			}),
			this.deleteRoleButton.click(),
		]);
	}

	async expectDeleteActionVisible(): Promise<void> {
		await expect(this.deleteRoleButton).toBeVisible();
	}

	async expectDeleteActionHidden(): Promise<void> {
		await expect(this.deleteRoleButton).toHaveCount(0);
	}

	async expectDeleteSuccess(): Promise<void> {
		await expect(this.page).toHaveURL(/\/job-roles\?roleDeleted=true$/);
		await expect(
			this.page.getByText("Role deleted successfully.", { exact: true }),
		).toBeVisible();
	}

	async expectHasApplicationsError(jobRoleId: number): Promise<void> {
		await expect(this.page).toHaveURL(
			new RegExp(`/job-roles/${jobRoleId}\\?deleteError=has-applications$`),
		);
		await expect(
			this.page.getByText(
				"This role cannot be deleted because it already has applications.",
				{ exact: true },
			),
		).toBeVisible();
	}
}
