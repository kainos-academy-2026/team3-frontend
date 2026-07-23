export type CreateRoleInput = {
	roleName: string;
	location: string;
	capabilityOption: string;
	bandOption: string;
	closingDate: string;
	numberOfOpenPositions: string;
	description: string;
	responsibilities: string;
	sharepointUrl: string;
};

export function generateUniqueRoleName(prefix = "BDD Test Role"): string {
	const timestamp = Date.now();
	const randomSuffix = Math.floor(Math.random() * 100000);
	return `${prefix} ${timestamp}-${randomSuffix}`;
}

export function buildJobRoleData(
	overrides: Partial<CreateRoleInput> = {},
): CreateRoleInput {
	const futureDate = new Date();
	futureDate.setFullYear(futureDate.getFullYear() + 1);
	const closingDate = futureDate.toISOString().split("T")[0] ?? "";

	return {
		roleName: generateUniqueRoleName(),
		location: "Belfast",
		capabilityOption: "",
		bandOption: "",
		closingDate,
		numberOfOpenPositions: "1",
		description: "A role created during BDD test execution.",
		responsibilities: "Responsibilities defined during BDD test execution.",
		sharepointUrl: "https://example.sharepoint.com/sites/bdd-test-role",
		...overrides,
	};
}
