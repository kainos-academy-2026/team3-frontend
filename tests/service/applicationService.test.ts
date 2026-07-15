import { describe, expect, it } from "vitest";
import { getFileExtension } from "../../src/services/applicationService.ts";

describe("applicationService", () => {
	describe("getFileExtension", () => {
		it("should return lowercase extension when a file has extension", () => {
			expect(getFileExtension("My-CV.PDF")).toBe(".pdf");
		});

		it("should return empty string when file has no extension", () => {
			expect(getFileExtension("cv")).toBe("");
		});
	});
});
