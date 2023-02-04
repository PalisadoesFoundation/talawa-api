import "dotenv/config";
import { getPlugins as getPluginsResolver } from "../../../src/resolvers/Query/getPlugins";
import { connect, disconnect } from "../../../src/db";
import { Organization, Plugin, User } from "../../../src/models";
import { nanoid } from "nanoid";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

beforeAll(async () => {
  await connect("TALAWA_TESTING_DB");

  const testUser = await User.create({
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

  await Plugin.create({
    pluginName: "pluginName",
    pluginCreatedBy: `${testUser.firstName} ${testUser.lastName}`,
    pluginDesc: "pluginDesc",
    pluginInstallStatus: true,
    installedOrgs: [testOrganization._id],
  });
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Query -> getPlugins", () => {
  it(`returns list of all existing plugins`, async () => {
    const getPluginsPayload = await getPluginsResolver?.({}, {}, {});

    const plugins = await Plugin.find().lean();

    expect(getPluginsPayload).toEqual(plugins);
  });
});
