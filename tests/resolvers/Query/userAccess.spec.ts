import { USER_NOT_FOUND_ERROR } from "../../../src/constants";
import type mongoose from "mongoose";
import { user } from "../../../src/resolvers/Query/user";
import { connect, disconnect } from "../../helpers/db";
import type { TestUserType } from "../../helpers/userAndOrg";
import { createTestUser } from "../../helpers/userAndOrg";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

let testUser: TestUserType;
let anotherTestUser: TestUserType;
let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser = await createTestUser();
  anotherTestUser = await createTestUser();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("user Query", () => {
  // Test case 1: Invalid user ID scenario
  it("throws error if user doesn't exist", async () => {
    const args = {
      id: "invalidUserId",
    };

    const context = {
      userId: testUser?.id,
    };

    try {
      await user?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.DESC);
    }
  });

  // Test case 2: Unauthorized access scenario
  it("throws unauthorized error when trying to access another user's data", async () => {
    const args = {
      id: anotherTestUser?.id,
    };

    const context = {
      userId: testUser?.id,
    };

    try {
      await user?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        "Access denied. You can only view your own profile.",
      );
    }
  });

  // Test case 3: Successful access scenario
  it("successfully returns user data when accessing own profile", async () => {
    const args = {
      id: testUser?.id,
    };

    const context = {
      userId: testUser?.id,
    };

    const result = await user?.({}, args, context);

    expect(result).toBeDefined();
  });
});
