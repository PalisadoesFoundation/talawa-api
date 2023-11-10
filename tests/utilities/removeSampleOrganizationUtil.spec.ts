import { describe, it, beforeAll, afterAll, expect } from "vitest";
import { createSampleOrganization } from "../../src/utilities/createSampleOrganizationUtil";
import { removeSampleOrganization } from "../../src/utilities/removeSampleOrganizationUtil";
import type mongoose from "mongoose";
import { Organization, SampleData } from "../../src/models";
import { connect, disconnect } from "../helpers/db";

let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("Sample Organization", () => {
  it("should create and remove a sample organization", async () => {
    await createSampleOrganization();

    const organization = await Organization.findOne();

    expect(organization).toBeDefined();

    await removeSampleOrganization();
    const sampleDataAfterRemoval = await SampleData.find();

    expect(sampleDataAfterRemoval.length).toBe(0);
  });
});
