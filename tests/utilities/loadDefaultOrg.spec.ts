import type mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  ActionItemCategory,
  AppUserProfile,
  Community,
  Event,
  Organization,
  Post,
  User,
} from "../../src/models";
import { loadDefaultOrganiation } from "../../src/utilities/loadDefaultOrg";
import { connect, disconnect } from "../helpers/db";

let MONGOOSE_INSTANCE: typeof mongoose;
beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});
describe("load default data", () => {
  it("should load default data", async () => {
    const userDeleteSpy = vi.spyOn(User, "deleteMany");
    const organizationDeleteSpy = vi.spyOn(Organization, "deleteMany");
    const eventDeleteSpy = vi.spyOn(Event, "deleteMany");
    const postDeleteSpy = vi.spyOn(Post, "deleteMany");
    const communityDeleteSpy = vi.spyOn(Community, "deleteMany");
    const actionItemCategoryDeleteSpy = vi.spyOn(
      ActionItemCategory,
      "deleteMany",
    );
    const appUserProfileDeleteSpy = vi.spyOn(AppUserProfile, "deleteMany");
    await loadDefaultOrganiation();
    expect(userDeleteSpy).toBeCalled();
    expect(organizationDeleteSpy).toBeCalled();
    expect(eventDeleteSpy).toBeCalled();
    expect(postDeleteSpy).toBeCalled();
    expect(communityDeleteSpy).toBeCalled();
    expect(actionItemCategoryDeleteSpy).toBeCalled();
    expect(appUserProfileDeleteSpy).toBeCalled();
    const userCount = await User.countDocuments();
    const organizationCount = await Organization.countDocuments();
    const appUserProfileCount = await AppUserProfile.countDocuments();
    expect(userCount).toBeGreaterThan(0);
    expect(organizationCount).toBeGreaterThan(0);
    expect(appUserProfileCount).toBeGreaterThan(0);
  });
});
