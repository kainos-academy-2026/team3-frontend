import { describe, it, expect } from "vitest";
import request from "supertest";
import app from "../src/index.ts";

describe("GET /health", () => {
  it("should return 200 with status UP", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body.status).toBe("UP");
  });

  it("should include a timestamp in the response", async () => {
    const response = await request(app).get("/health");

    expect(response.body.time).toBeDefined();
    expect(new Date(response.body.time).getTime()).not.toBeNaN();
  });
});

describe("GET /unknown", () => {
  it("should return 404 for an unknown route", async () => {
    const response = await request(app).get("/unknown");

    expect(response.status).toBe(404);
  });
});
