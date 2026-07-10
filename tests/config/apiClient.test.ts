import { afterEach, describe, expect, it, vi } from "vitest";

describe("apiClient config", () => {
	afterEach(() => {
		vi.resetModules();
		vi.unmock("axios");
		vi.unstubAllEnvs();
	});

	it("should use fallback BACKEND_API when env var is missing", async () => {
		const create = vi.fn();
		vi.doMock("axios", () => ({
			default: { create },
		}));
		vi.stubEnv("BACKEND_API", undefined);

		await import("../../src/config/apiClient.ts");

		expect(create).toHaveBeenCalledWith({
			baseURL: "http://localhost:4000/api",
			headers: { "Content-Type": "application/json" },
			timeout: 5000,
		});
	});

	it("should use BACKEND_API from environment when provided", async () => {
		const create = vi.fn();
		vi.doMock("axios", () => ({
			default: { create },
		}));
		vi.stubEnv("BACKEND_API", "https://example.test/api");

		await import("../../src/config/apiClient.ts");

		expect(create).toHaveBeenCalledWith({
			baseURL: "https://example.test/api",
			headers: { "Content-Type": "application/json" },
			timeout: 5000,
		});
	});
});
