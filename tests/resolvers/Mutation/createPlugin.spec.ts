import type { MutationCreatePluginArgs } from "../../../src/types/generatedGraphQLTypes";

import { pubsub } from "../../../src/index";
import { describe, it, expect, afterAll, beforeAll } from "vitest";
import { createPlugin as createPluginResolver } from "../../../src/resolvers/Mutation/createPlugin";
import { nanoid } from "nanoid";
import type mongoose from "mongoose";
import { connect, disconnect } from "../../helpers/db";

let MONGOOSE_INSTANCE: typeof mongoose;
beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> createPlugin", () => {
  it(`Creates a Plugin and returns it`, async () => {
    const data: MutationCreatePluginArgs = {
      pluginCreatedBy: nanoid(),
      pluginDesc: nanoid(),
      pluginName: nanoid(),
    };
    const args: MutationCreatePluginArgs = {
      ...data,
    };

    const context = {
      pubsub,
    };

    const createPluginPayload = await createPluginResolver?.({}, args, context);

    expect(createPluginPayload).toEqual(
      expect.objectContaining({
        ...data,
      }),
    );
  });
});
