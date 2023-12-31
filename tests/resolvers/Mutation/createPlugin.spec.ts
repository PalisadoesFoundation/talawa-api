import "dotenv/config";
import type mongoose from "mongoose";
import type { MutationCreatePluginArgs } from "../../../src/types/generatedGraphQLTypes";
import type { InterfacePlugin } from "../../../src/models";
import { connect, disconnect } from "../../helpers/db";
import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
  afterEach,
  vi,
} from "vitest";
import type {
  TestOrganizationType,
  TestUserType,
} from "../../helpers/userAndOrg";
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";
let testUser: TestUserType;
let testOrganization: TestOrganizationType;
let MONGOOSE_INSTANCE: typeof mongoose;

vi.mock("../../utilities/uploadEncodedImage", () => ({
  uploadEncodedImage: vi.fn(),
}));

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestUserAndOrganization();
  testUser = temp[0];
  testOrganization = temp[1];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> createPlugin", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
    vi.resetAllMocks();
  });

  it(`should create the plugin and returns `, async () => {
    const args: MutationCreatePluginArgs = {
      pluginCreatedBy: `${testUser?.firstName} ${testUser?.lastName}`,
      pluginDesc: "myplugindescription",
      pluginName: "myplugin",
      uninstalledOrgs: [],
    };
    const pubsub = {
      publish: (
        _action: "TALAWA_PLUGIN_UPDATED",
        _payload: {
          Plugin: InterfacePlugin;
        }
      ): {
        _action: string;
        _payload: { Plugin: InterfacePlugin };
      } => {
        return { _action, _payload };
      },
    };

    const context = {
      userId: testUser?.id,
      pubsub,
    };

    const { createPlugin: createPluginResolver } = await import(
      "../../../src/resolvers/Mutation/createPlugin"
    );

    const createdPluginPayload = await createPluginResolver?.(
      {},
      args,
      context
    );

    expect(createdPluginPayload).toEqual(
      expect.objectContaining({
        pluginCreatedBy: `${testUser?.firstName} ${testUser?.lastName}`,
        pluginDesc: "myplugindescription",
        pluginName: "myplugin",
      })
    );
  });
});
