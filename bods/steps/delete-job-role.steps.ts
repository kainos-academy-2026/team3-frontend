import { Given, Then, When } from "@cucumber/cucumber";
import {
	getAdminCredentials,
	getDeletableRoleId,
	getOptionalRoleWithApplicationsId,
	getReadonlyRoleId,
	getStandardUserCredentials,
} from "../data/jobRoles.ts";
import type { BddWorld } from "../fixtures/bods.fixture.ts";
import { DeleteJobRolePage } from "../pages/DeleteJobRolePage.ts";

const getPageObject = (world: BddWorld): DeleteJobRolePage => {
	if (!world.page) {
		throw new Error("Playwright page was not initialised for this scenario.");
	}

	return new DeleteJobRolePage(world.page);
};

Given("an admin user is signed in", async function (this: BddWorld) {
	const adminCredentials = getAdminCredentials();
	await this.signInWithSession(
		adminCredentials.email,
		adminCredentials.password,
	);
});

Given("a standard user is signed in", async function (this: BddWorld) {
	const standardUserCredentials = getStandardUserCredentials();
	await this.signInWithSession(
		standardUserCredentials.email,
		standardUserCredentials.password,
	);
});

Given("a deletable job role exists", async function (this: BddWorld) {
	const deletableRoleId = getDeletableRoleId();
	this.currentJobRoleId = deletableRoleId;
	const pageObject = getPageObject(this);
	await pageObject.gotoJobRoleDetails(deletableRoleId);
	await pageObject.expectDeleteActionVisible();
});

Given(
	"a job role with existing applications exists",
	async function (this: BddWorld) {
		const roleWithApplicationsId =
			getOptionalRoleWithApplicationsId() ??
			(await getPageObject(this).findRoleWithApplicationsId());
		this.currentJobRoleId = roleWithApplicationsId;
		const pageObject = getPageObject(this);
		await pageObject.gotoJobRoleDetails(roleWithApplicationsId);
		await pageObject.expectDeleteActionVisible();
	},
);

When("the admin deletes the job role", async function (this: BddWorld) {
	await getPageObject(this).deleteRole();
});

When(
	"the admin attempts to delete the job role",
	async function (this: BddWorld) {
		await getPageObject(this).deleteRole();
	},
);

When("the user opens a job role detail page", async function (this: BddWorld) {
	const readonlyRoleId = getReadonlyRoleId();
	this.currentJobRoleId = readonlyRoleId;
	await getPageObject(this).gotoJobRoleDetails(readonlyRoleId);
});

Then(
	"the admin is returned to the job role list with a delete success message",
	async function (this: BddWorld) {
		await getPageObject(this).expectDeleteSuccess();
	},
);

Then(
	"the job role detail page shows that the role cannot be deleted",
	async function (this: BddWorld) {
		if (!this.currentJobRoleId) {
			throw new Error("No current job role ID was stored for this scenario.");
		}

		await getPageObject(this).expectHasApplicationsError(this.currentJobRoleId);
	},
);

Then("the delete action is not shown", async function (this: BddWorld) {
	await getPageObject(this).expectDeleteActionHidden();
});
