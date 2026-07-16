import { describe, expect, it } from "vitest";
import { UpdateJobRoleRequestSchema } from "../../src/validation/jobRoleSchemas.ts";

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
