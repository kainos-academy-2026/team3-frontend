import { afterEach, describe, expect, it, vi } from "vitest";

describe("app session config", () => {
	afterEach(() => {
		vi.resetModules();
		vi.unmock("express-session");
		vi.unstubAllEnvs();
	});

	it("should set secure cookie when NODE_ENV is production", async () => {
		const sessionMock = vi.fn(() => {
			return (_req: unknown, _res: unknown, next: () => void) => next();
		});

		vi.doMock("express-session", () => ({
			default: sessionMock,
		}));

		vi.stubEnv("NODE_ENV", "production");
		vi.stubEnv("SESSION_SECRET", "test-secret");

		await import("../src/app.ts");

		expect(sessionMock).toHaveBeenCalledWith(
			expect.objectContaining({
				secret: "test-secret",
				cookie: expect.objectContaining({ secure: true }),
			}),
		);
	});

	it("should use fallback secret when SESSION_SECRET is missing", async () => {
		const sessionMock = vi.fn(() => {
			return (_req: unknown, _res: unknown, next: () => void) => next();
		});

		vi.doMock("express-session", () => ({
			default: sessionMock,
		}));

		vi.stubEnv("NODE_ENV", "development");
		vi.stubEnv("SESSION_SECRET", "");

		await import("../src/app.ts");

		expect(sessionMock).toHaveBeenCalledWith(
			expect.objectContaining({
				secret: "dev-secret-change-me",
			}),
		);
	});
});
