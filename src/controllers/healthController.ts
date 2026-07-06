import type { Request, Response } from "express";
import type { HealthService } from "../services/healthService";

export class HealthController {
    constructor(private healthService: HealthService) { }

    async getHealth(req: Request, res: Response) {
        const healthCheck = await this.healthService.healthCheck();
        res.json(healthCheck);
    }

    async getAll(req: Request, res: Response) {
        const healthData = await this.healthService.getAll();
        res.json(healthData);
    }
};
