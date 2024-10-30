import { USER_NOT_FOUND_ERROR, BASE_URL } from "../../../src/constants";
import type mongoose from "mongoose";
import { user as userResolver } from "../../../src/resolvers/Query/user";
import { User } from "../../../src/models";
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
    expect.assertions(1);
    const args = {
      id: "invalidUserId",
    };

    const context = {
      userId: testUser?.id,
    };

    try {
      await userResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.DESC);
    }
  });

  // Test case 2: Unauthorized access scenario
  it("throws unauthorized error when trying to access another user's data", async () => {
    expect.assertions(1);
    const args = {
      id: anotherTestUser?.id,
    };

    const context = {
      userId: testUser?.id,
    };

    try {
      await userResolver?.({}, args, context);
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
      apiRootURL: BASE_URL,
    };

    const result = await userResolver?.({}, args, context);

    const user = await User.findById(testUser?._id).lean();

    expect(result?.user).toEqual({
      ...user,
      organizationsBlockedBy: [],
      image: user?.image ? `${BASE_URL}${user.image}` : null,
    });
  });
});
