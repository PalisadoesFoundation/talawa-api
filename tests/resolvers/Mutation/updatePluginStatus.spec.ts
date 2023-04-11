import "dotenv/config";
import { Document } from "mongoose";
import { Plugin, Interface_Plugin } from "../../../src/models";
import { MutationUpdatePluginStatusArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import { updatePluginStatus as updatePluginStatusResolver } from "../../../src/resolvers/Mutation/updatePluginStatus";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import {
  createTestUserAndOrganization,
  TestUserType,
} from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testPlugin: Interface_Plugin & Document<any, any, Interface_Plugin>;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestUserAndOrganization();
  testUser = temp[0];
  const testOrganization = temp[1];
  testPlugin = await Plugin.create({
    pluginName: "pluginName",
    pluginCreatedBy: `${testUser!.firstName} ${testUser!.lastName}`,
    pluginDesc: "pluginDesc",
    pluginInstallStatus: false,
    installedOrgs: [testOrganization!._id],
  });
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> updatePluginStatus", () => {
  it(`updates the pluginInstallStatus field of plugin with
   _id === args.id and returns it`, async () => {
    const args: MutationUpdatePluginStatusArgs = {
      id: testPlugin._id,
      status: true,
    };

    const context = {
      userId: testUser!._id,
    };

    const updatePluginStatusPayload = await updatePluginStatusResolver?.(
      {},
      args,
      context
    );

    const updatedTestPlugin = await Plugin.findOne({
      _id: testPlugin._id,
    }).lean();

    expect(updatePluginStatusPayload).toEqual(updatedTestPlugin);
  });
});
