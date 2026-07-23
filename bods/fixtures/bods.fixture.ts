import process from "node:process";
import {
	After,
	AfterAll,
	Before,
	BeforeAll,
	type IWorldOptions,
	setDefaultTimeout,
	setWorldConstructor,
	World,
} from "@cucumber/cucumber";
import {
	type APIRequestContext,
	type Browser,
	type BrowserContext,
	chromium,
	type Page,
	request,
} from "@playwright/test";
import type { CreateRoleInput } from "../data/jobRoles.ts";
import type { CreateUserInput } from "../data/users.ts";
import type { CreateUserPage } from "../pages/CreateUserPage.ts";

const DEFAULT_BASE_URL = "http://127.0.0.1:3000";
const DEFAULT_BACKEND_API_URL = "http://localhost:4000/api";

let browser: Browser;

setDefaultTimeout(30_000);

export class BddWorld extends World {
	baseUrl: string;
	context: BrowserContext | null;
	page: Page | null;
	requestContext: APIRequestContext | null;
	createUserPage: CreateUserPage | null;
	lastRegisteredUser: CreateUserInput | null;
	backendApiUrl: string;
	adminJwt: string | null;
	adminEmail: string | null;
	adminPassword: string | null;
	createdRoleId: number | null;
	createdRoleInput: CreateRoleInput | null;
	currentJobRoleId: number | null;
	lastStatus: number | null;

	constructor(options: IWorldOptions) {
		super(options);
		this.baseUrl = process.env.BDD_BASE_URL ?? DEFAULT_BASE_URL;
		this.backendApiUrl = process.env.BACKEND_API ?? DEFAULT_BACKEND_API_URL;
		this.context = null;
		this.page = null;
		this.requestContext = null;
		this.createUserPage = null;
		this.lastRegisteredUser = null;
		this.adminJwt = null;
		this.adminEmail = null;
		this.adminPassword = null;
		this.createdRoleId = null;
		this.createdRoleInput = null;
		this.currentJobRoleId = null;
		this.lastStatus = null;
	}
}

setWorldConstructor(BddWorld);

BeforeAll(async () => {
	browser = await chromium.launch({
		headless: process.env.BDD_HEADLESS !== "false",
		slowMo: Number(process.env.BDD_SLOW_MO ?? 0),
	});
});

Before(async function (this: BddWorld) {
	this.context = await browser.newContext();
	this.page = await this.context.newPage();
	this.requestContext = await request.newContext({
		baseURL: this.baseUrl,
	});
	this.createUserPage = null;
	this.lastRegisteredUser = null;
	this.adminJwt = null;
	this.adminEmail = null;
	this.adminPassword = null;
	this.createdRoleId = null;
	this.createdRoleInput = null;
	this.currentJobRoleId = null;
	this.lastStatus = null;
});

After(async function (this: BddWorld) {
	if (this.createdRoleId !== null && this.adminJwt && this.requestContext) {
		await this.requestContext.delete(
			`${this.backendApiUrl}/job-roles/${this.createdRoleId}`,
			{
				headers: { Authorization: `Bearer ${this.adminJwt}` },
			},
		);
	}

	await this.page?.close();
	await this.context?.close();
	await this.requestContext?.dispose();
	this.page = null;
	this.context = null;
	this.requestContext = null;
	this.createUserPage = null;
	this.lastRegisteredUser = null;
	this.adminJwt = null;
	this.adminEmail = null;
	this.adminPassword = null;
	this.createdRoleId = null;
	this.createdRoleInput = null;
	this.currentJobRoleId = null;
	this.lastStatus = null;
});

AfterAll(async () => {
	await browser.close();
});
