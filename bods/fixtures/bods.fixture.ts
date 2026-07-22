import {
	After,
	AfterAll,
	Before,
	BeforeAll,
	World,
	type IWorldOptions,
	setDefaultTimeout,
	setWorldConstructor,
} from "@cucumber/cucumber";
import {
	type APIRequestContext,
	type Browser,
	type BrowserContext,
	type Page,
	chromium,
	request,
} from "@playwright/test";
import type { CreateUserInput } from "../data/users.ts";
import { CreateUserPage } from "../pages/CreateUserPage.ts";

const DEFAULT_BASE_URL = "http://127.0.0.1:3000";

let browser: Browser;

setDefaultTimeout(30_000);

export class BddWorld extends World {
	baseUrl: string;
	context: BrowserContext | null;
	page: Page | null;
	requestContext: APIRequestContext | null;
	createUserPage: CreateUserPage | null;
	lastRegisteredUser: CreateUserInput | null;

	constructor(options: IWorldOptions) {
		super(options);
		this.baseUrl = process.env.BDD_BASE_URL ?? DEFAULT_BASE_URL;
		this.context = null;
		this.page = null;
		this.requestContext = null;
		this.createUserPage = null;
		this.lastRegisteredUser = null;
	}
}

setWorldConstructor(BddWorld);

BeforeAll(async () => {
	browser = await chromium.launch({ headless: true });
});

Before(async function (this: BddWorld) {
	this.context = await browser.newContext();
	this.page = await this.context.newPage();
	this.requestContext = await request.newContext({
		baseURL: this.baseUrl,
	});
	this.createUserPage = null;
	this.lastRegisteredUser = null;
});

After(async function (this: BddWorld) {
	await this.page?.close();
	await this.context?.close();
	await this.requestContext?.dispose();
	this.page = null;
	this.context = null;
	this.requestContext = null;
	this.createUserPage = null;
	this.lastRegisteredUser = null;
});

AfterAll(async () => {
	await browser.close();
});
