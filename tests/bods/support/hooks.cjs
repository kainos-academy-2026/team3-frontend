const {
	Before,
	After,
	BeforeAll,
	AfterAll,
	setWorldConstructor,
} = require("@cucumber/cucumber");
const { chromium } = require("@playwright/test");
const { CustomWorld } = require("./world.cjs");

let globalBrowser;

setWorldConstructor(CustomWorld);

BeforeAll(async () => {
	globalBrowser = await chromium.launch({
		headless: process.env.HEADED !== "true",
	});
});

Before(async function () {
	this.context = await globalBrowser.newContext();
	this.page = await this.context.newPage();
	this.page.setDefaultTimeout(10000);
});

After(async function () {
	if (this.apiContext) {
		await this.apiContext.dispose();
	}
	if (this.context) {
		await this.context.close();
	}
});

AfterAll(async () => {
	if (globalBrowser) {
		await globalBrowser.close();
	}
});
