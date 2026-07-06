import type { Request, Response } from "express";
import type { JobApplicationService } from "../services/jobApplicationService";

export class JobApplicationController {
    constructor(private jobApplicationService: JobApplicationService) { }

    async getHealth(req: Request, res: Response) {
        const healthCheck = await this.jobApplicationService.healthCheck();
        res.json(healthCheck);
    }

    async getAll(req: Request, res: Response) {
        const jobApplications = await this.jobApplicationService.getAll();
        res.json(jobApplications);
    }
};
