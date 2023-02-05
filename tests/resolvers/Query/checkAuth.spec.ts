import "dotenv/config";
import { connect, disconnect } from "../../../src/db";
import { checkAuth as checkAuthResolver } from "../../../src/resolvers/Query/checkAuth";
import { Types } from "mongoose";
import { USER_NOT_FOUND } from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createTestUser } from "../../helpers/userAndOrg";
beforeAll(async () => {
  await connect();
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Query -> checkAuth", () => {
  it("throws NotFoundError if no user exists with _id === context.userId", async () => {
    try {
      const context = {
        userId: Types.ObjectId().toString(),
      };

      await checkAuthResolver?.({}, {}, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it("returns user object", async () => {
    const testUser = await createTestUser();

    const context = {
      userId: testUser._id,
    };

    const user = await checkAuthResolver?.({}, {}, context);

    expect(user).toEqual(testUser.toObject());
  });
});
