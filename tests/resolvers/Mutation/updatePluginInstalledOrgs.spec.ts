import "dotenv/config";
import { Document } from "mongoose";
import {
  User,
  Organization,
  Plugin,
  Interface_Plugin,
} from "../../../src/models";
import { MutationUpdatePluginInstalledOrgsArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { updatePluginInstalledOrgs as updatePluginInstalledOrgsResolver } from "../../../src/resolvers/Mutation/updatePluginInstalledOrgs";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import {
  createTestUserAndOrganization,
  testOrganizationType,
  testUserType,
} from "../../helpers/userAndOrg";

let testUser: testUserType;
let testPlugin: Interface_Plugin & Document<any, any, Interface_Plugin>;
let testOrganization: testOrganizationType;

beforeAll(async () => {
  await connect();
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
  await disconnect();
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
