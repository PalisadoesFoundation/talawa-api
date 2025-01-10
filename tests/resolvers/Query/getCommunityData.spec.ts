import "dotenv/config";
import type mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { Community } from "../../../src/models";
import { connect, disconnect } from "../../helpers/db";
import { createTestPlugin } from "../../helpers/plugins";

let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  await createTestPlugin();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> community", () => {
  it(`returns pre-login data `, async () => {
    const { getCommunityData: getCommunityDataResolver } = await import(
      "../../../src/resolvers/Query/getCommunityData"
    );
    const getPayload = await getCommunityDataResolver?.({}, {}, {});

    const communityData = await Community.findOne();

    expect(getPayload).toEqual(communityData);
  });
});
