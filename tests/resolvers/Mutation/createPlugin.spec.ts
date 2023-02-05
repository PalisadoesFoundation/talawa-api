import "dotenv/config";
import { MutationCreatePluginArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { createPlugin as createPluginResolver } from "../../../src/resolvers/Mutation/createPlugin";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createTestUserFunc, testUserType } from "../../helpers/user";

let testUser: testUserType;

beforeAll(async () => {
  await connect("TALAWA_TESTING_DB");
  testUser = await createTestUserFunc();
});

afterAll(async () => {
  await disconnect();
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
