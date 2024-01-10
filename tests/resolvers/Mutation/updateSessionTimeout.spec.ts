import type mongoose from "mongoose";
import { updateSessionTimeout } from "../../../src/resolvers/Mutation/updateSessionTimeout";
import { Community } from "../../../src/models";
import { errors } from "../../../src/libraries";
import { connect, disconnect } from "../../helpers/db";
import { createTestUserWithUserTypeFunc } from "../../helpers/user";
import type { TestUserType } from "../../helpers/user";
import { createTestOrganizationWithAdmin } from "../../helpers/userAndOrg";
import type { TestOrganizationType } from "../../helpers/userAndOrg";
import { afterAll, beforeAll, describe, expect, test, vi } from "vitest";
import {
  COMMUNITY_NOT_FOUND_ERROR,
  INVALID_TIMEOUT_RANGE,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import type {
  RequireFields,
  MutationUpdateSessionTimeoutArgs,
} from "../../../src/types/generatedGraphQLTypes";
import {
  createTestCommunityFunc,
  type TestCommunityType,
} from "../../helpers/community";

let MONGOOSE_INSTANCE: typeof mongoose;

let testOrganization: TestOrganizationType;
let testOrganization2: TestOrganizationType;
let testCommunity: TestCommunityType;

let testUser1: TestUserType;
let testUser2: TestUserType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();

  testUser1 = await createTestUserWithUserTypeFunc("SUPERADMIN");
  testUser2 = await createTestUserWithUserTypeFunc("USER");
  testCommunity = await createTestCommunityFunc();
  if (testUser1)
    testOrganization = await createTestOrganizationWithAdmin(
      testUser1._id,
      true,
      true,
      true
    );

  if (testUser2)
    testOrganization2 = await createTestOrganizationWithAdmin(
      testUser2._id,
      true,
      false,
      true
    );
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> updateSessionTimeout", () => {
  test("should throw InputValidationError if timeout is missing", async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => `Translated ${message}`
    );

    const context = { userId: testUser1 ? testUser1._id.toString() : null };
    const args = {} as RequireFields<
      MutationUpdateSessionTimeoutArgs,
      "timeout"
    >;

    await expect(updateSessionTimeout?.({}, args, context)).rejects.toThrow(
      errors.InputValidationError
    );
  });

  test("should throw NotFoundError if user does not exist", async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);
    const context = { userId: "6737904485008f171cf29924" };
    const args = { timeout: 20 };

    await expect(updateSessionTimeout?.({}, args, context)).rejects.toThrow(
      errors.NotFoundError
    );
    expect(spy).toHaveBeenCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
  });

  test("should throw ValidationError if timeout is not in valid range", async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);
    try {
      const context = { userId: testUser1 ? testUser1._id.toString() : null };
      const args = {
        timeout: 70,
      };

      await expect(updateSessionTimeout?.({}, args, context)).rejects.toThrow(
        errors.ValidationError
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        expect(spy).toHaveBeenCalledWith(INVALID_TIMEOUT_RANGE.MESSAGE);
        expect(error.message).toEqual(INVALID_TIMEOUT_RANGE.MESSAGE);
      }
    }
  });

  test("should update organization timeout", async () => {
    const { requestContext } = await import("../../../src/libraries");
    vi.spyOn(requestContext, "translate").mockImplementation(
      (message) => `Translated ${message}`
    );

    const context = { userId: testUser1 ? testUser1._id.toString() : null };
    const args = {
      timeout: 20,
    };

    await updateSessionTimeout?.({}, args, context);

    const updatedCommunity = await Community.findOne().lean();

    if (updatedCommunity) {
      expect(updatedCommunity.timeout).toBe(args.timeout);
    }
  });

  test("should throw NotFoundError if community does not exist", async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementation((message) => `Translated ${message}`);

    const context = { userId: testUser1 ? testUser1._id.toString() : null };
    const args = {
      timeout: 20,
    };

    await Community.deleteMany();

    await expect(updateSessionTimeout?.({}, args, context)).rejects.toThrow(
      errors.NotFoundError
    );
    expect(spy).toHaveBeenCalledWith(COMMUNITY_NOT_FOUND_ERROR.MESSAGE);
  });
});
