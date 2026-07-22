const { Before, After, BeforeAll, AfterAll, setWorldConstructor } = require('@cucumber/cucumber');
const { chromium } = require('@playwright/test');
const { CustomWorld } = require('./bods.world.cjs');

let browser;

setWorldConstructor(CustomWorld);

BeforeAll(async () => {
    browser = await chromium.launch({
  headless: process.env.BDD_HEADLESS !== "false",
  slowMo: Number(process.env.BDD_SLOW_MO ?? 0),
});
});

Before(async function () {
	this.context = await browser.newContext();
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
	if (browser) {
		await browser.close();
	}
});
