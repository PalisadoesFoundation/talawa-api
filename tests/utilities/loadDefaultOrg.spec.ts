import { describe, expect, it } from "vitest";

import type mongoose from "mongoose";
import { AppUserProfile, Organization, User } from "../../src/models";
import { loadDefaultOrganiation } from "../../src/utilities/loadDefaultOrg";
import { connect, disconnect } from "../helpers/db";

let MONGOOSE_INSTANCE: typeof mongoose;

describe("load default data", () => {
  it("should load default data", async () => {
    await loadDefaultOrganiation("TALAWA_API_TEST_DATABASE");
    MONGOOSE_INSTANCE = await connect();

    const userCount = await User.countDocuments();
    const organizationCount = await Organization.countDocuments();
    const appUserProfileCount = await AppUserProfile.countDocuments();

    expect(userCount).toBeGreaterThan(0);
    expect(organizationCount).toBeGreaterThan(0);
    expect(appUserProfileCount).toBeGreaterThan(0);
    await disconnect(MONGOOSE_INSTANCE);
  });
  it("should throw error if database name is undefined", async () => {
    try {
      await loadDefaultOrganiation(undefined);
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
    }
  });
});
