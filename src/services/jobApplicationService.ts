export interface HealthCheckResponse {
    status: string;
    time: string;
}

export class JobApplicationService {
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