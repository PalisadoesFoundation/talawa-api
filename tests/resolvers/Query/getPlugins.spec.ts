import "dotenv/config";
import { getPlugins as getPluginsResolver } from "../../../src/resolvers/Query/getPlugins";
import { connect, disconnect } from "../../../src/db";
import { Organization, Plugin, User } from "../../../src/models";
import { nanoid } from "nanoid";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createTestPlugin } from "../../helpers/plugins";
beforeAll(async () => {
  await connect();
  const [testUser, testOrganization, testPlugin] = createTestPlugin();
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
