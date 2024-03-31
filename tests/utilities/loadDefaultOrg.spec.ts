import { afterAll, describe, expect, it } from "vitest";
import { connect, disconnect } from "../../src/db";
import { AppUserProfile, Organization, User } from "../../src/models";
import { loadDefaultOrganiation } from "../../src/utilities/loadDefaultOrg";

afterAll(async () => {
  await disconnect();
});
describe("load default data", () => {
  it("should load default data", async () => {
    await loadDefaultOrganiation();
    await connect();

    const userCount = await User.countDocuments();
    const organizationCount = await Organization.countDocuments();
    const appUserProfileCount = await AppUserProfile.countDocuments();

    expect(userCount).toBeGreaterThan(0);
    expect(organizationCount).toBeGreaterThan(0);
    expect(appUserProfileCount).toBeGreaterThan(0);
  });
});
