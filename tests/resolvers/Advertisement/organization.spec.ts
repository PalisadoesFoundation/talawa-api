import "dotenv/config";
import { organization as advertisementResolver } from "../../../src/resolvers/Advertisement/organization";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import {
  type TestAdvertisementType,
  createTestAdvertisement,
} from "../../helpers/advertisement";
import { Organization } from "../../../src/models";

let MONGOOSE_INSTANCE: typeof mongoose;
let testAdvertisement: TestAdvertisementType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testAdvertisement = await createTestAdvertisement();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Advertisement -> organization", () => {
  it(`returns the organization object for parent event`, async () => {
    const parent = testAdvertisement;

    const orgPayload = await advertisementResolver?.(parent, {}, {});

    const orgObject = await Organization.findOne({
      _id: testAdvertisement.organizationId,
    }).lean();

    expect(orgPayload).toEqual(orgObject);
  });
});
