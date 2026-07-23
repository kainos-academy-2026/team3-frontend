import type { Locator, Page } from "@playwright/test";
import type { CreateRoleInput } from "../data/jobRoles.ts";

export class CreateJobRolePage {
	constructor(private readonly page: Page) {}

	async goto(baseUrl: string): Promise<void> {
		await this.page.goto(`${baseUrl}/job-roles/new`);
	}

	async fillForm(data: Partial<CreateRoleInput>): Promise<void> {
		if (data.roleName !== undefined) {
			await this.page.getByLabel("Role name").fill(data.roleName);
		}
		if (data.location !== undefined) {
			await this.page.getByLabel("Location").fill(data.location);
		}
		if (data.closingDate !== undefined) {
			await this.page.getByLabel("Closing date").fill(data.closingDate);
		}
		if (data.numberOfOpenPositions !== undefined) {
			await this.page
				.getByLabel("Number of open positions")
				.fill(data.numberOfOpenPositions);
		}
		if (data.description !== undefined) {
			await this.page.getByLabel("Description").fill(data.description);
		}
		if (data.responsibilities !== undefined) {
			await this.page
				.getByLabel("Responsibilities")
				.fill(data.responsibilities);
		}
		if (data.sharepointUrl !== undefined) {
			await this.page.getByLabel("SharePoint URL").fill(data.sharepointUrl);
		}

		const capabilitySelect = this.page.getByLabel("Capability");
		if (data.capabilityOption) {
			await capabilitySelect.selectOption({ label: data.capabilityOption });
		} else {
			await this.selectFirstNonEmptyOption(capabilitySelect);
		}

		const bandSelect = this.page.getByLabel("Band");
		if (data.bandOption) {
			await bandSelect.selectOption({ label: data.bandOption });
		} else {
			await this.selectFirstNonEmptyOption(bandSelect);
		}
	}

	async submit(): Promise<void> {
		await this.page.getByRole("button", { name: "Create role" }).click();
	}

	getFieldError(labelText: string): Locator {
		return this.page
			.locator(".job-role-form__field")
			.filter({ has: this.page.getByText(labelText, { exact: true }) })
			.locator(".job-role-form__field-error");
	}

	private async selectFirstNonEmptyOption(select: Locator): Promise<void> {
		const options = await select.locator("option").all();
		for (const option of options) {
			const value = await option.getAttribute("value");
			if (value) {
				await select.selectOption(value);
				return;
			}
		}
	}
}
