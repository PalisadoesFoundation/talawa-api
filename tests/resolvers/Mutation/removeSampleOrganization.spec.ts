import { faker } from "@faker-js/faker";
import type mongoose from "mongoose";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { AppUserProfile, Organization, SampleData } from "../../../src/models";
import { removeSampleOrganization } from "../../../src/resolvers/Mutation/removeSampleOrganization";
import { generateUserData } from "../../../src/utilities/createSampleOrganizationUtil";
import { connect, disconnect } from "../../helpers/db";
import { createTestUser } from "../../helpers/userAndOrg";
/* eslint-disable */

let ORGANIZATION_ID: mongoose.Types.ObjectId;

const createOrg = (): void => {
  const _id = faker.database.mongodbObjectId();
  const creatorId = faker.database.mongodbObjectId();
  const organization = new Organization({
    _id,
    name: faker.company.name(),
    description: faker.lorem.sentences(),
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
    createdAt: new Date(),
  });

  organization
    .save()
    .then(() => console.log("Organization saved"))
    .catch((err) => console.error(err));

  const sampleDocument = new SampleData({
    documentId: organization._id,
    collectionName: "Organization",
  });

  sampleDocument
    .save()
    .then(() => console.log("SampleData saved"))
    .catch((err) => {
      console.error("our error: 50", err);
      console.error(err);
    });

  ORGANIZATION_ID = organization._id;
};

let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  createOrg();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("Remove Sample Organization Resolver - User Authorization", async () => {
  it("should not throw an error when user is an admin for the organization", async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message,
    );

    const userData = await generateUserData(
      ORGANIZATION_ID.toString(),
      "ADMIN",
    );
    const admin = userData.user;

    const args = {};
    const context = { userId: admin._id };
    const parent = {};

    const result = await removeSampleOrganization!(parent, args, context);
    expect(result).toBe(true);
  });

  it("should not throw error when user is a SUPERADMIN", async () => {
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
      userRegistrationRequired: false,
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

    const sampleDocument = new SampleData({
      documentId: organization._id,
      collectionName: "Organization",
    });

    sampleDocument.save();

    const userData = await generateUserData(
      organization._id.toString(),
      "SUPERADMIN",
    );
    const superAdmin = userData.user;

    const args = {};
    const superAdminContext = { userId: superAdmin._id };
    const parent = {};

    const superAdminResult = await removeSampleOrganization!(
      parent,
      args,
      superAdminContext,
    );

    expect(superAdminResult).toBe(true);
  });

  it("should throw unauthorized error for non-admins", async () => {
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
      userRegistrationRequired: false,
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

    const sampleModal = new SampleData({
      documentId: organization._id,
      collectionName: "Organization",
    });

    sampleModal.save();
    const userData = await generateUserData(
      organization._id.toString(),
      "USER",
    );
    const newUser = userData.user;

    const args = {};
    const context = { userId: newUser._id };
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
      (message) => message,
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

  it("should NOT throw error when organization doesn't exist", async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message,
    );

    const userData = await generateUserData(
      ORGANIZATION_ID.toString(),
      "ADMIN",
    );
    const admin = userData.user;

    const args = {};
    const adminContext = { userId: admin._id };
    const parent = {};

    await SampleData.deleteMany({ collectionName: "Organization" });

    try {
      await removeSampleOrganization!(parent, args, adminContext);
    } catch (error: unknown) {
      expect((error as Error).message).toBe(
        ORGANIZATION_NOT_FOUND_ERROR.MESSAGE,
      );
    }
  });

  it("should throw error when the collection name is not a valid one", async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message,
    );

    const userData = await generateUserData(
      ORGANIZATION_ID.toString(),
      "ADMIN",
    );
    const admin = userData.user;

    const args = {};
    const adminContext = { userId: admin._id };
    const parent = {};

    try {
      await removeSampleOrganization!(parent, args, adminContext);
    } catch (error: any) {
      expect(error.message).toBe(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it("should throw user not found error when user is non-existent", async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message,
    );

    const testUser = await createTestUser();
    await AppUserProfile.deleteOne({
      userId: testUser?.id,
    });

    const args = {};
    const adminContext = { userId: testUser?._id };
    const parent = {};

    try {
      await removeSampleOrganization!(parent, args, adminContext);
    } catch (error: any) {
      expect(error.message).toBe(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
    }
  });
});
