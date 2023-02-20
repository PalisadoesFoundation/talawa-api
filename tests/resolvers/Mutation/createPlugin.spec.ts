import "dotenv/config";
import { MutationCreatePluginArgs } from "../../../src/types/generatedGraphQLTypes";
import {
  connect,
  disconnect,
  dropAllCollectionsFromDatabase,
} from "../../helpers/db";
import mongoose from "mongoose";
import { createPlugin as createPluginResolver } from "../../../src/resolvers/Mutation/createPlugin";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createTestUserFunc, testUserType } from "../../helpers/user";

let testUser: testUserType;
let MONGOOSE_INSTANCE: typeof mongoose | null;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE!);
  testUser = await createTestUserFunc();
});

afterAll(async () => {
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE!);
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> Mutation -> createPlugin", () => {
  it(`creates the plugin and returns it`, async () => {
    const args: MutationCreatePluginArgs = {
      pluginCreatedBy: `pluginCreatedBy`,
      pluginDesc: "pluginDesc",
      pluginInstallStatus: true,
      pluginName: "pluginName",
      installedOrgs: [],
    };

    const context = {
      userId: testUser!.id,
    };

    const createPluginPayload = await createPluginResolver?.({}, args, context);

    expect(createPluginPayload).toEqual(
      expect.objectContaining({
        pluginCreatedBy: `pluginCreatedBy`,
        pluginDesc: "pluginDesc",
        pluginInstallStatus: true,
        pluginName: "pluginName",
        installedOrgs: [],
      })
    );
  });
});
