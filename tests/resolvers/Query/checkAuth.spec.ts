import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { checkAuth as checkAuthResolver } from "../../../src/resolvers/Query/checkAuth";
import { connect, disconnect } from "../../helpers/db";

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { USER_NOT_FOUND_ERROR } from "../../../src/constants";

let MONGOOSE_INSTANCE: typeof mongoose;

import { AppUserProfile } from "../../../src/models";
import { createTestUser } from "../../helpers/userAndOrg";
beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> checkAuth", () => {
  it("throws NotFoundError if no user exists with _id === context.userId", async () => {
    try {
      const context = {
        userId: new Types.ObjectId().toString(),
      };

      await checkAuthResolver?.({}, {}, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.DESC);
    }
  });

  it("returns user object", async () => {
    const testUser = await createTestUser();

    const context = {
      userId: testUser?._id,
    };

    const user = await checkAuthResolver?.({}, {}, context);

    expect(user).toEqual({ ...testUser?.toObject(), image: null });
  });

  it("throws error if user does not have appUserProfile", async () => {
    try {
      const testUser = await createTestUser();
      await AppUserProfile.deleteOne({
        userId: testUser?._id,
      });

      const context = {
        userId: testUser?._id,
      };
      await checkAuthResolver?.({}, {}, context);
    } catch (error: unknown) {
      console.log(error);
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.DESC);
    }
  });
});
