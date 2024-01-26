import "dotenv/config";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { Advertisement } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createTestPlugin } from "../../helpers/plugins";
import { getAdvertisements } from "../../../src/resolvers/Query/getAdvertisements";

let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  await createTestPlugin();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> getAdvertisment", () => {
  const context = {
    apiRootUrl: "",
  };

  it(`returns list of all existing advertisement`, async () => {
    const adsPayload = await getAdvertisements?.({}, {}, context);

    const ads = await Advertisement.find().lean();

    expect(adsPayload).toEqual(ads);
  });
});
