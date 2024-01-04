import type mongoose from "mongoose";
import { getOrganizationTimeout } from "../../../src/resolvers/Query/getOrganizationTimeout";
import { errors } from "../../../src/libraries";
import { connect, disconnect } from "../../helpers/db";
import { createTestUserWithUserTypeFunc } from "../../helpers/user";
import {
  createTestOrganizationWithAdmin,
  createdOrganizationWithoutTimeout,
} from "../../helpers/userAndOrg";
import type { TestUserType } from "../../helpers/user";
import type { TestOrganizationType } from "../../helpers/userAndOrg";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  ORGANIZATION_NOT_FOUND_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { Types } from "mongoose";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testUser2: TestUserType;
let testOrganization: TestOrganizationType;
let testOrganizationWithoutTimeout: TestOrganizationType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();

  testUser = await createTestUserWithUserTypeFunc("ADMIN");
  testUser2 = await createTestUserWithUserTypeFunc("ADMIN");

  if (testUser) {
    testOrganization = await createTestOrganizationWithAdmin(testUser._id);
  }
  if (testUser2) {
    testOrganizationWithoutTimeout = await createdOrganizationWithoutTimeout(
      testUser2._id
    );
  }
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> getOrganizationTimeout", () => {
  it("should return 0 if organization has no timeout", async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => `Translated ${message}`
    );
    const context = { userId: testUser2?._id?.toString() };
    const args = { id: testOrganizationWithoutTimeout?._id?.toString() };

    const result = await getOrganizationTimeout?.({}, args, context);
    expect(result).toBe(0);
  });

  it("should return organization timeout for admin user", async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => `Translated ${message}`
    );
    const context = { userId: testUser?._id?.toString() };
    const args = { id: testOrganization?._id?.toString() };

    const result = await getOrganizationTimeout?.({}, args, context);

    expect(result).toBe(testOrganization?.timeout);
  });

  it("should throw NotFoundError if user does not exist", async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);
    const context = { userId: Types.ObjectId().toString() };
    const args = { id: testOrganization?._id?.toString() };

    await expect(getOrganizationTimeout?.({}, args, context)).rejects.toThrow(
      errors.NotFoundError
    );
    expect(spy).toHaveBeenCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
  });

  it("should throw NotFoundError if organization does not exist", async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);
    const context = { userId: testUser?._id?.toString() };
    const args = { id: Types.ObjectId().toString() };

    await expect(getOrganizationTimeout?.({}, args, context)).rejects.toThrow(
      errors.NotFoundError
    );
    expect(spy).toHaveBeenCalledWith(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE);
  });
});
