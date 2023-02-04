import "dotenv/config";
import { Document } from "mongoose";
import {
  Interface_User,
  User,
  Organization,
  Plugin,
  Interface_Plugin,
} from "../../../src/models";
import { MutationUpdatePluginStatusArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { updatePluginStatus as updatePluginStatusResolver } from "../../../src/resolvers/Mutation/updatePluginStatus";
import { nanoid } from "nanoid";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

let testUser: Interface_User & Document<any, any, Interface_User>;
let testPlugin: Interface_Plugin & Document<any, any, Interface_Plugin>;

beforeAll(async () => {
  await connect("TALAWA_TESTING_DB");

  testUser = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: "password",
    firstName: "firstName",
    lastName: "lastName",
    appLanguageCode: "en",
  });

  const testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creator: testUser._id,
    admins: [testUser._id],
    members: [testUser._id],
  });

  await User.updateOne(
    {
      _id: testUser._id,
    },
    {
      $set: {
        createdOrganizations: [testOrganization._id],
        adminFor: [testOrganization._id],
        joinedOrganizations: [testOrganization._id],
      },
    }
  );

  testPlugin = await Plugin.create({
    pluginName: "pluginName",
    pluginCreatedBy: `${testUser.firstName} ${testUser.lastName}`,
    pluginDesc: "pluginDesc",
    pluginInstallStatus: false,
    installedOrgs: [testOrganization._id],
  });
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Mutation -> updatePluginStatus", () => {
  it(`updates the pluginInstallStatus field of plugin with
   _id === args.id and returns it`, async () => {
    const args: MutationUpdatePluginStatusArgs = {
      id: testPlugin._id,
      status: true,
    };

    const context = {
      userId: testUser._id,
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
