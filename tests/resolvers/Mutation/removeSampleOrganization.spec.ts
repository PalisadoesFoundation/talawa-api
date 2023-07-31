import type { InterfaceOrganization } from "../../../src/models";
import { SampleData, Organization } from "../../../src/models";
import { generateUserData } from "../../../src/utilities/createSampleOrganizationUtil";
import { expect, describe, it, vi, afterAll, beforeAll } from "vitest";
import { removeSampleOrganization } from "../../../src/resolvers/Mutation/removeSampleOrganization";
import type mongoose from "mongoose";
import { faker } from "@faker-js/faker";
import { connect, disconnect } from "../../helpers/db";
import {
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";

const ORGANIZATION_ID = ((): InterfaceOrganization &
  mongoose.Document<any, any, InterfaceOrganization> => {
  const _id = faker.database.mongodbObjectId();
  const creatorId = faker.database.mongodbObjectId();
  const organization = new Organization({
    _id,
    name: faker.company.name(),
    description: faker.lorem.sentences(),
    location: `${faker.location.country()}, ${faker.location.city()}`,
    isPublic: true,
    creator: creatorId,
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

  const sampleDocument = new SampleData({
    documentId: organization._id,
    collectionName: "Organization",
  });

  sampleDocument.save();
  return organization._id;
})();

let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("Remove Sample Organization Resolver - User Authorization", async () => {
  it("should NOT throw error when user is ADMIN", async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message
    );

    const admin = generateUserData(ORGANIZATION_ID.toString(), "ADMIN");
    (await admin).save();

    const args = {};
    const adminContext = { userId: (await admin)._id };
    const parent = {};

    const adminResult = await removeSampleOrganization!(
      parent,
      args,
      adminContext
    );
    expect(adminResult).toBe(true);
  });

  it("should not throw error when user is a SUPERADMIN", async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message
    );

    const _id = faker.database.mongodbObjectId();
    const creatorId = faker.database.mongodbObjectId();
    const organization = new Organization({
      _id,
      name: faker.company.name(),
      description: faker.lorem.sentences(),
      location: `${faker.location.country()}, ${faker.location.city()}`,
      isPublic: true,
      creator: creatorId,
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

    const sampleDocument = new SampleData({
      documentId: organization._id,
      collectionName: "Organization",
    });

    sampleDocument.save();
    const superadmin = generateUserData(
      organization._id.toString(),
      "SUPERADMIN"
    );

    (await superadmin).save();

    const args = {};
    const superAdminContext = { userId: (await superadmin)._id };
    const parent = {};

    const superAdminResult = await removeSampleOrganization!(
      parent,
      args,
      superAdminContext
    );

    expect(superAdminResult).toBe(true);
  });

  it("should throw unauthorized error for non-admins", async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message
    );

    const _id = faker.database.mongodbObjectId();
    const creatorId = faker.database.mongodbObjectId();
    const organization = new Organization({
      _id,
      name: faker.company.name(),
      description: faker.lorem.sentences(),
      location: `${faker.location.country()}, ${faker.location.city()}`,
      isPublic: true,
      creator: creatorId,
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

    const sampleModal = new SampleData({
      documentId: organization._id,
      collectionName: "Organization",
    });

    sampleModal.save();
    const newUser = generateUserData(organization._id.toString(), "USER");

    const args = {};
    const context = { userId: (await newUser)._id };
    const parent = {};

    try {
      await removeSampleOrganization!(parent, args, context);
    } catch (error: any) {
      expect(error.message).toBe(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
    }
  });

  it("should throw user not found error when user is non-existent", async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message
    );

    const randomUserId = faker.database.mongodbObjectId();

    const args = {};
    const adminContext = { userId: randomUserId };
    const parent = {};

    try {
      await removeSampleOrganization!(parent, args, adminContext);
    } catch (error: any) {
      expect(error.message).toBe(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it("should NOT throw error when user is ADMIN", async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message
    );

    const randomOrganizationId = faker.database.mongodbObjectId();

    const admin = generateUserData(randomOrganizationId, "ADMIN");
    (await admin).save();

    const args = {};
    const adminContext = { userId: (await admin)._id };
    const parent = {};

    try {
      await removeSampleOrganization!(parent, args, adminContext);
    } catch (error: any) {
      expect(error.message).toBe(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
    }
  });
});
