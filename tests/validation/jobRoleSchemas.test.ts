import { describe, expect, it } from "vitest";
import { CreateJobRoleSchema } from "../../src/validation/jobRoleSchemas.ts";

const validPayload = {
	roleName: "Senior Backend Engineer",
	location: "Dublin",
	capabilityId: 1,
	bandId: 2,
	closingDate: "2026-08-31",
	description: "Own backend services and integrations.",
	responsibilities: "Build APIs, review code, support delivery.",
	sharepointUrl: "https://example.sharepoint.com/job-role",
	numberOfOpenPositions: 2,
};

describe("CreateJobRoleSchema", () => {
	it("accepts a valid payload", () => {
		const result = CreateJobRoleSchema.safeParse(validPayload);

		expect(result.success).toBe(true);
	});

	it("rejects missing required fields", () => {
		const result = CreateJobRoleSchema.safeParse({});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues.length).toBeGreaterThan(0);
		}
	});

	it("rejects invalid URL", () => {
		const result = CreateJobRoleSchema.safeParse({
			...validPayload,
			sharepointUrl: "not-a-url",
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0]?.message).toBe(
				"SharePoint URL must be a valid URL.",
			);
		}
	});

	it("rejects invalid date", () => {
		const result = CreateJobRoleSchema.safeParse({
			...validPayload,
			closingDate: "not-a-date",
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0]?.message).toBe(
				"Closing date must be valid.",
			);
		}
	});

	it("rejects non-positive ids", () => {
		const result = CreateJobRoleSchema.safeParse({
			...validPayload,
			capabilityId: 0,
			bandId: -1,
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			const messages = result.error.issues.map((issue) => issue.message);
			expect(messages).toContain("Capability is required.");
			expect(messages).toContain("Band is required.");
		}
	});

	it("rejects non-positive open positions", () => {
		const result = CreateJobRoleSchema.safeParse({
			...validPayload,
			numberOfOpenPositions: 0,
		});

		expect(result.success).toBe(false);
		if (!result.success) {
			expect(result.error.issues[0]?.message).toBe(
				"Number of open positions must be greater than 0.",
			);
		}
	});
});
