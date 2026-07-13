import { beforeEach, describe, expect, it, vi } from "vitest";
import apiClient from "../../src/config/apiClient.ts";
import { AuthService } from "../../src/services/authService.ts";

vi.mock("../../src/config/apiClient.ts", () => ({
	default: {
		post: vi.fn(),
	},
}));

describe("AuthService", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it("should return token from backend on successful login", async () => {
		vi.mocked(apiClient.post).mockResolvedValue({
			data: { token: "jwt-token" },
		});

		const service = new AuthService();
		const result = await service.login("user@example.com", "password123");

		expect(apiClient.post).toHaveBeenCalledWith("/auth/login", {
			email: "user@example.com",
			password: "password123",
		});
		expect(result).toEqual({ token: "jwt-token" });
	});

	it("should return register payload on successful register", async () => {
		vi.mocked(apiClient.post).mockResolvedValue({
			data: { id: 1, email: "new@example.com", role: "user" },
		});

		const service = new AuthService();
		const result = await service.register("new@example.com", "StrongPass!1");

		expect(apiClient.post).toHaveBeenCalledWith("/auth/register", {
			email: "new@example.com",
			password: "StrongPass!1",
		});
		expect(result).toEqual({ id: 1, email: "new@example.com", role: "user" });
	});

	it("should throw when backend login request fails", async () => {
		const error = new Error("Network failure");
		vi.mocked(apiClient.post).mockRejectedValue(error);

		const service = new AuthService();

		await expect(
			service.login("user@example.com", "password123"),
		).rejects.toThrow("Network failure");
	});

	it("should throw when backend register request fails", async () => {
		const error = new Error("Register failure");
		vi.mocked(apiClient.post).mockRejectedValue(error);

		const service = new AuthService();

		await expect(
			service.register("new@example.com", "StrongPass!1"),
		).rejects.toThrow("Register failure");
	});
});
