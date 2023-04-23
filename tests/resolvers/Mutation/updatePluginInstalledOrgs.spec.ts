import "dotenv/config";
import type { Document } from "mongoose";
import type mongoose from "mongoose";
import type { InterfacePlugin } from "../../../src/models";
import { User, Organization, Plugin } from "../../../src/models";
import type { MutationUpdatePluginInstalledOrgsArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import { updatePluginInstalledOrgs as updatePluginInstalledOrgsResolver } from "../../../src/resolvers/Mutation/updatePluginInstalledOrgs";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testPlugin: InterfacePlugin & Document<any, any, InterfacePlugin>;
let testOrganization: TestOrganizationType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestUserAndOrganization();
  testUser = temp[0];
  testOrganization = temp[1];
  testPlugin = await Plugin.create({
    pluginName: "pluginName",
    pluginCreatedBy: `${testUser!.firstName} ${testUser!.lastName}`,
    pluginDesc: "pluginDesc",
    pluginInstallStatus: false,
    installedOrgs: [],
  });
});

afterAll(async () => {
  await User.deleteMany({});
  await Organization.deleteMany({});
  await Plugin.deleteMany({});
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> updatePluginInstalledOrgs", () => {
  it(`if organization with _id === args.orgId doesn't exist in plugin.installedOrgs
  for plugin with _id === args.id, adds it to plugin.installedOrgs`, async () => {
    const args: MutationUpdatePluginInstalledOrgsArgs = {
      id: testPlugin._id,
      orgId: testOrganization!._id,
    };

    const context = {
      userId: testUser!._id,
    };

    const updatePluginInstalledOrgsPayload =
      await updatePluginInstalledOrgsResolver?.({}, args, context);

    const testUpdatePluginStatusPayload = await Plugin.findOne({
      _id: testPlugin._id,
    }).lean();

    expect(updatePluginInstalledOrgsPayload).toEqual(
      testUpdatePluginStatusPayload
    );
  });

  it(`if organization with _id === args.orgId already exists in plugin.installedOrgs
    for plugin with _id === args.id, removes it from plugin.installedOrgs`, async () => {
    const args: MutationUpdatePluginInstalledOrgsArgs = {
      id: testPlugin._id,
      orgId: testOrganization!._id,
    };

    const context = {
      userId: testUser!._id,
    };

    const updatePluginInstalledOrgsPayload =
      await updatePluginInstalledOrgsResolver?.({}, args, context);

    const testUpdatePluginStatusPayload = await Plugin.findOne({
      _id: testPlugin._id,
    }).lean();

    expect(updatePluginInstalledOrgsPayload).toEqual(
      testUpdatePluginStatusPayload
    );
  });
});
