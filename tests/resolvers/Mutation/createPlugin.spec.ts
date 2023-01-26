import "dotenv/config";
import { Document } from "mongoose";
import { Interface_User, User } from "../../../src/models";
import { MutationCreatePluginArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { createPlugin as createPluginResolver } from "../../../src/resolvers/Mutation/createPlugin";
import { nanoid } from "nanoid";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

let testUser: Interface_User & Document<any, any, Interface_User>;

beforeAll(async () => {
  await connect();

  testUser = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: "password",
    firstName: "firstName",
    lastName: "lastName",
    appLanguageCode: "en",
  });
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
      userId: testUser.id,
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
