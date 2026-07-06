import type { HealthCheckResponse } from "../dto/healthdto";

export class HealthService {
    async healthCheck(): Promise<HealthCheckResponse> {
        return {
            status: "UP",
            time: new Date().toISOString(),
        };
    }

    async getAll(): Promise<string> {
        return "Hello World";
    }
};