import { describe, it, beforeAll, afterAll, expect } from "vitest";
import { createSampleOrganization } from "../../src/utilities/createSampleOrganizationUtil";
import { removeSampleOrganization } from "../../src/utilities/removeSampleOrganizationUtil";
import type mongoose from "mongoose";
import {
  User,
  Organization,
  Post,
  Event,
  Plugin,
  SampleData,
} from "../../src/models";
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

    const organizationsAfterRemoval = await Organization.find();
    const usersAfterRemoval = await User.find();
    const postsAfterRemoval = await Post.find();
    const eventsAfterRemoval = await Event.find();
    const pluginsAfterRemoval = await Plugin.find();
    const sampleDataAfterRemoval = await SampleData.find();

    expect(organizationsAfterRemoval.length).toBe(0);
    expect(usersAfterRemoval.length).toBe(0);
    expect(postsAfterRemoval.length).toBe(0);
    expect(eventsAfterRemoval.length).toBe(0);
    expect(pluginsAfterRemoval.length).toBe(0);
    expect(sampleDataAfterRemoval.length).toBe(0);
  });
});
