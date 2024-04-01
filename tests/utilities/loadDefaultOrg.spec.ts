import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type mongoose from "mongoose";
import { AppUserProfile, Organization, User } from "../../src/models";
import { loadDefaultOrganiation } from "../../src/utilities/loadDefaultOrg";
import {
  connect,
  disconnect,
  dropAllCollectionsFromDatabase,
} from "../helpers/db";

let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE);
});
afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});
describe("load default data", () => {
  it("should load default data", async () => {
    await loadDefaultOrganiation("TALAWA_API_TEST_DATABASE");
    await connect();

    const userCount = await User.countDocuments();
    const organizationCount = await Organization.countDocuments();
    const appUserProfileCount = await AppUserProfile.countDocuments();

    expect(userCount).toBeGreaterThan(0);
    expect(organizationCount).toBeGreaterThan(0);
    expect(appUserProfileCount).toBeGreaterThan(0);
  });
});
