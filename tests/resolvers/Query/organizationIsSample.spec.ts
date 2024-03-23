/* eslint-disable @typescript-eslint/no-explicit-any */
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type mongoose from "mongoose";
import { isSampleOrganization } from "../../../src/resolvers/Query/organizationIsSample";
import { Organization, SampleData } from "../../../src/models";
import { faker } from "@faker-js/faker";
import { ORGANIZATION_NOT_FOUND_ERROR } from "../../../src/constants";
import { connect, disconnect } from "../../helpers/db";

let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("determine whether organization is a sample or not", async () => {
  it("isSampleOrganization should return true if organizationId exists in SampleData collection", async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message,
    );

    const _id = faker.database.mongodbObjectId();
    const creatorId = faker.database.mongodbObjectId();
    const organization = new Organization({
      _id,
      name: faker.company.name(),
      description: faker.lorem.sentences(),
      location: `${faker.location.country()}, ${faker.location.city()}`,
      isPublic: true,
      creatorId: creatorId,
      status: "ACTIVE",
      members: [creatorId],
      admins: [creatorId],
      groupChats: [],
      posts: [],
      pinnedPosts: [],
      membershipRequests: [],
      blockedUsers: [],
      visibleInSearch: true,
      createdAt: Date.now(),
    });

    organization.save();

    const sampleOrganization = new SampleData({
      documentId: organization._id,
      collectionName: "Organization",
    });
    await sampleOrganization.save();

    const parent = {};
    const args = { id: organization._id.toString() };
    const context = {};

    let result: any;

    if (isSampleOrganization) {
      result = await isSampleOrganization(parent, args, context);
    }

    expect(result).toBe(true);
  });

  it("isSampleOrganization should return false if organizationId does not exist in SampleData collection", async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message,
    );

    const _id = faker.database.mongodbObjectId();
    const creatorId = faker.database.mongodbObjectId();
    const organization = new Organization({
      _id,
      name: faker.company.name(),
      description: faker.lorem.sentences(),
      location: `${faker.location.country()}, ${faker.location.city()}`,
      isPublic: true,
      creatorId: creatorId,
      status: "ACTIVE",
      members: [creatorId],
      admins: [creatorId],
      groupChats: [],
      posts: [],
      pinnedPosts: [],
      membershipRequests: [],
      blockedUsers: [],
      visibleInSearch: true,
      createdAt: Date.now(),
    });

    await organization.save();

    const args = { id: _id };

    let result: any;
    if (isSampleOrganization) {
      result = await isSampleOrganization({}, args, {});
    }
    expect(result).toBe(false);
  });
});

describe("ensure organization exists in organization collection", async () => {
  it("should throw error when organization doesn't exist in the 'Organization' collection", async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message,
    );

    const randomId = faker.database.mongodbObjectId();

    const parent = {};
    const args = { id: randomId };
    const context = {};
    try {
      if (isSampleOrganization) {
        await isSampleOrganization(parent, args, context);
      }
    } catch (error: any) {
      expect(error.message).toBe(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
    }
  });
});
