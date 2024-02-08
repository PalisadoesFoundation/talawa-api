import {
  afterAll,
  beforeAll,
  describe,
  expect,
  it,
  vi,
  beforeEach,
} from "vitest";
import { generateUserData } from "../../../src/utilities/createSampleOrganizationUtil";
import { faker } from "@faker-js/faker";
import { createSampleOrganization } from "../../../src/resolvers/Mutation/createSampleOrganization";
import type mongoose from "mongoose";
import { SampleData } from "../../../src/models";

import {
  SAMPLE_ORGANIZATION_ALREADY_EXISTS,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { connect, disconnect } from "../../helpers/db";
import { Types } from "mongoose";

let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

beforeEach(async () => {
  await SampleData.deleteMany({});
});

describe("createSampleOrganization resolver", async () => {
  it("should NOT throw error when user is ADMIN", async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message
    );

    const ORGANIZATION_ID = faker.database.mongodbObjectId();
    const admin = await generateUserData(ORGANIZATION_ID, "ADMIN");
    admin.save();

    const args = {};
    const adminContext = { userId: admin._id };
    const parent = {};

    const adminResult = await createSampleOrganization!(
      parent,
      args,
      adminContext
    );
    expect(adminResult).toBe(true);
    await SampleData.deleteMany({});
  });

  it("should NOT throw error when user is SUPERADMIN", async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message
    );

    const ORGANIZATION_ID = faker.database.mongodbObjectId();
    const admin = await generateUserData(ORGANIZATION_ID, "SUPERADMIN");
    admin.save();

    const args = {};
    const adminContext = { userId: admin._id };
    const parent = {};

    const adminResult = await createSampleOrganization!(
      parent,
      args,
      adminContext
    );
    expect(adminResult).toBe(true);
    await SampleData.deleteMany({});
  });

  it("should throw unauthorized error for non-admins", async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message
    );

    const ORGANIZATION_ID = faker.database.mongodbObjectId();
    const admin = await generateUserData(ORGANIZATION_ID, "USER");
    admin.save();

    const args = {};
    const adminContext = { userId: admin._id };
    const parent = {};

    try {
      await createSampleOrganization!(parent, args, adminContext);
    } catch (error: any) {
      expect(error.message).toBe(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
    }
  });

  it("should throw error when the sample organization already exist", async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message
    );

    const ORGANIZATION_ID = faker.database.mongodbObjectId();
    const admin = await generateUserData(ORGANIZATION_ID, "ADMIN");
    admin.save();

    const args = {};
    const adminContext = { userId: admin._id };
    const parent = {};

    const adminResult = await createSampleOrganization!(
      parent,
      args,
      adminContext
    );

    expect(adminResult).toBe(true);

    try {
      await createSampleOrganization!(parent, args, adminContext);
    } catch (error: any) {
      expect(error.message).toBe(SAMPLE_ORGANIZATION_ALREADY_EXISTS.MESSAGE);
    }

    await SampleData.deleteMany({});
  });

  it("should throw error when the current user doesn't exist", async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message
    );

    const args = {};
    const adminContext = { userId: Types.ObjectId().toString() };
    const parent = {};

    try {
      await createSampleOrganization!(parent, args, adminContext);
    } catch (error: any) {
      expect(error.message).toBe(USER_NOT_FOUND_ERROR.MESSAGE);
    }

    await SampleData.deleteMany({});
  });
});
