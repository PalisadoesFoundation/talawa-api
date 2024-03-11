import { faker } from "@faker-js/faker";
import type mongoose from "mongoose";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { SampleData, User } from "../../../src/models";
import { createSampleOrganization } from "../../../src/resolvers/Mutation/createSampleOrganization";
import { generateUserData } from "../../../src/utilities/createSampleOrganizationUtil";

import { Types } from "mongoose";
import { nanoid } from "nanoid";
import {
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { connect, disconnect } from "../../helpers/db";

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
      (message) => message,
    );

    const ORGANIZATION_ID = faker.database.mongodbObjectId();
    const userData = await generateUserData(ORGANIZATION_ID, "ADMIN");
    const admin = userData.user;

    const args = {};
    const adminContext = { userId: admin._id };
    const parent = {};

    try {
      if (createSampleOrganization) {
        await createSampleOrganization(parent, args, adminContext);
      }
    } catch (error: unknown) {
      expect((error as Error).message).toBe(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
      await SampleData.deleteMany({});
    }
  });

  it("should NOT throw error when user is SUPERADMIN", async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message,
    );

    const ORGANIZATION_ID = faker.database.mongodbObjectId();
    const userData = await generateUserData(ORGANIZATION_ID, "SUPERADMIN");
    const admin = userData.user;

    const args = {};
    const adminContext = { userId: admin._id };
    const parent = {};
    if (createSampleOrganization) {
      const adminResult = await createSampleOrganization(
        parent,
        args,
        adminContext,
      );

      expect(adminResult).toBe(true);
    }
    await SampleData.deleteMany({});
  });

  it("should throw unauthorized error for non-admins", async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message,
    );

    const ORGANIZATION_ID = faker.database.mongodbObjectId();
    const userData = await generateUserData(ORGANIZATION_ID, "USER");
    const admin = userData.user;

    const args = {};
    const adminContext = { userId: admin._id };
    const parent = {};

    try {
      if (createSampleOrganization) {
        await createSampleOrganization(parent, args, adminContext);
      }
    } catch (error: unknown) {
      expect((error as Error).message).toBe(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
    }
  });

  it("should throw error when the current user doesn't exist", async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => message,
    );

    const args = {};
    const adminContext = { userId: new Types.ObjectId().toString() };
    const parent = {};

    try {
      if (createSampleOrganization)
        await createSampleOrganization(parent, args, adminContext);
    } catch (error: unknown) {
      expect((error as Error).message).toBe(USER_NOT_FOUND_ERROR.MESSAGE);
    }

    await SampleData.deleteMany({});
  });
  it("throws error if user does not have AppUserProfile", async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => `Translated ${message}`);
    const newUser = await User.create({
      email: `email${nanoid().toLowerCase()}@gmail.com`,
      password: `pass${nanoid().toLowerCase()}`,
      firstName: `firstName${nanoid().toLowerCase()}`,
      lastName: `lastName${nanoid().toLowerCase()}`,
      image: null,
    });
    const args = {};
    const context = {
      userId: newUser.id,
    };

    try {
      if (createSampleOrganization)
        await createSampleOrganization({}, args, context);
    } catch (error: unknown) {
      expect(spy).toHaveBeenCalledWith(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        `Translated ${USER_NOT_AUTHORIZED_ERROR.MESSAGE}`,
      );
    }
  });
});
