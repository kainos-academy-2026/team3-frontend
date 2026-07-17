import { describe, expect, it } from "vitest";
import {
	CreateJobRoleSchema,
	JobRolePaginationQuerySchema,
	UpdateJobRoleRequestSchema,
} from "../../src/validation/jobRoleSchemas.ts";

describe("UpdateJobRoleRequestSchema", () => {
	it("should accept a valid partial payload", () => {
		const result = UpdateJobRoleRequestSchema.safeParse({
			roleName: "Software Engineer",
		});
		expect(result.success).toBe(true);
	});

	it("should accept a valid full payload", () => {
		const result = UpdateJobRoleRequestSchema.safeParse({
			roleName: "Software Engineer",
			location: "Belfast",
			capabilityId: "1",
			bandId: "2",
			closingDate: "2027-01-01",
			status: "Open",
			description: "A great role",
			responsibilities: "Write great code",
			sharepointUrl: "https://example.com/sharepoint",
			numberOfOpenPositions: "3",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.capabilityId).toBe(1);
			expect(result.data.bandId).toBe(2);
			expect(result.data.numberOfOpenPositions).toBe(3);
		}
	});

	it("should reject an empty payload", () => {
		const result = UpdateJobRoleRequestSchema.safeParse({});
		expect(result.success).toBe(false);
	});

	it("should reject an invalid status", () => {
		const result = UpdateJobRoleRequestSchema.safeParse({
			status: "Pending",
		});
		expect(result.success).toBe(false);
	});

	it("should reject a non-positive capabilityId", () => {
		const result = UpdateJobRoleRequestSchema.safeParse({
			capabilityId: "0",
		});
		expect(result.success).toBe(false);
	});

	it("should reject a non-numeric bandId", () => {
		const result = UpdateJobRoleRequestSchema.safeParse({
			bandId: "abc",
		});
		expect(result.success).toBe(false);
	});

	it("should reject an invalid closingDate", () => {
		const result = UpdateJobRoleRequestSchema.safeParse({
			closingDate: "not-a-date",
		});
		expect(result.success).toBe(false);
	});

	it("should reject an invalid sharepointUrl", () => {
		const result = UpdateJobRoleRequestSchema.safeParse({
			sharepointUrl: "not-a-url",
		});
		expect(result.success).toBe(false);
	});

	it("should reject a non-positive numberOfOpenPositions", () => {
		const result = UpdateJobRoleRequestSchema.safeParse({
			numberOfOpenPositions: "0",
		});
		expect(result.success).toBe(false);
	});

	it("should trim whitespace from roleName", () => {
		const result = UpdateJobRoleRequestSchema.safeParse({
			roleName: "  Engineer  ",
		});
		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data.roleName).toBe("Engineer");
		}
	});

	it("should reject a blank roleName after trimming", () => {
		const result = UpdateJobRoleRequestSchema.safeParse({
			roleName: "   ",
		});
		expect(result.success).toBe(false);
	});
});

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

describe("JobRolePaginationQuerySchema", () => {
	it("applies defaults when query is missing", () => {
		const result = JobRolePaginationQuerySchema.safeParse({});

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toEqual({ limit: 10, page: 1 });
		}
	});

	it("accepts valid explicit query", () => {
		const result = JobRolePaginationQuerySchema.safeParse({
			limit: "10",
			page: "2",
		});

		expect(result.success).toBe(true);
		if (result.success) {
			expect(result.data).toEqual({ limit: 10, page: 2 });
		}
	});

	it("rejects invalid limit values", () => {
		expect(
			JobRolePaginationQuerySchema.safeParse({ limit: "0", page: "1" }).success,
		).toBe(false);
		expect(
			JobRolePaginationQuerySchema.safeParse({ limit: "31", page: "1" })
				.success,
		).toBe(false);
		expect(
			JobRolePaginationQuerySchema.safeParse({ limit: "1.5", page: "1" })
				.success,
		).toBe(false);
	});

	it("rejects invalid page values", () => {
		expect(
			JobRolePaginationQuerySchema.safeParse({ limit: "10", page: "0" })
				.success,
		).toBe(false);
		expect(
			JobRolePaginationQuerySchema.safeParse({ limit: "10", page: "2.3" })
				.success,
		).toBe(false);
	});
});
