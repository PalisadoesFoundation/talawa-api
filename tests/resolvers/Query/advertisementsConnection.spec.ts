import "dotenv/config";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { Advertisement } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createTestAdvertisement } from "../../helpers/advertisement";
import { advertisementsConnection } from "../../../src/resolvers/Query/advertisementsConnection";

let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  await createTestAdvertisement();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> advertisments", () => {
  const context = {
    apiRootUrl: "",
  };

  it(`returns list of all existing advertisement`, async () => {
    const adsPayload = await advertisementsConnection?.({}, {}, context);

    let ads = await Advertisement.find().lean();
    ads = ads.map((advertisement) => ({
      ...advertisement,
      mediaUrl: `${context.apiRootUrl}${advertisement.mediaUrl}`,
      organization: { _id: advertisement.organizationId },
    }));
    expect(adsPayload).toEqual(ads);
  });
});
