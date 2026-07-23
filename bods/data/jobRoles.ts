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

const getRequiredEnv = (name: string, fallback?: string): string => {
	const value = process.env[name]?.trim() || fallback;

	if (!value) {
		throw new Error(
			`Missing required BDD environment variable: ${name}. ` +
				"Provide credentials and role IDs before running delete-role BDD tests.",
		);
	}

	return value;
};

const getRequiredCredential = (name: string, fallback?: string): string => {
	const value = getRequiredEnv(name, fallback);

	if (value.startsWith("real-") || value.includes("your-")) {
		throw new Error(
			`BDD environment variable ${name} is using a placeholder value (${value}). Replace it with a real credential for this environment.`,
		);
	}

	return value;
};

const getRequiredPositiveIntegerEnv = (name: string): number => {
	const value = Number(getRequiredEnv(name));

	if (!Number.isInteger(value) || value <= 0) {
		throw new Error(
			`BDD environment variable ${name} must be a positive integer.`,
		);
	}

	return value;
};

export const getAdminCredentials = () => ({
	email: getRequiredCredential("BDD_ADMIN_EMAIL", "admin@kainos.com"),
	password: getRequiredCredential("BDD_ADMIN_PASSWORD", "AdminPassword123!"),
});

export const getStandardUserCredentials = () => ({
	email: getRequiredCredential("BDD_USER_EMAIL"),
	password: getRequiredCredential("BDD_USER_PASSWORD"),
});

export const getDeletableRoleId = () =>
	getRequiredPositiveIntegerEnv("BDD_DELETABLE_ROLE_ID");

export const getRoleWithApplicationsId = () =>
	getRequiredPositiveIntegerEnv("BDD_ROLE_WITH_APPLICATIONS_ID");

export const getOptionalRoleWithApplicationsId = (): number | null => {
	const rawValue = process.env.BDD_ROLE_WITH_APPLICATIONS_ID?.trim();

	if (!rawValue) {
		return null;
	}

	const parsedValue = Number(rawValue);
	if (!Number.isInteger(parsedValue) || parsedValue <= 0) {
		throw new Error(
			"BDD_ROLE_WITH_APPLICATIONS_ID must be a positive integer.",
		);
	}

	return parsedValue;
};

export const getReadonlyRoleId = () =>
	Number(process.env.BDD_READONLY_ROLE_ID)
		? getRequiredPositiveIntegerEnv("BDD_READONLY_ROLE_ID")
		: getDeletableRoleId();
