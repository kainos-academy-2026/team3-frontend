export type CreateUserInput = {
	email: string;
	password: string;
	confirmPassword: string;
};

const DEFAULT_PASSWORD = "StrongPass!1";

export function generateUniqueEmail(prefix = "bdd-user"): string {
	const timestamp = Date.now();
	const randomSuffix = Math.floor(Math.random() * 100000);
	return `${prefix}+${timestamp}-${randomSuffix}@example.com`;
}

export function buildUser(
	overrides: Partial<CreateUserInput> = {},
): CreateUserInput {
	const email = overrides.email ?? generateUniqueEmail();
	const password = overrides.password ?? DEFAULT_PASSWORD;

	return {
		email,
		password,
		confirmPassword: overrides.confirmPassword ?? password,
	};
}
