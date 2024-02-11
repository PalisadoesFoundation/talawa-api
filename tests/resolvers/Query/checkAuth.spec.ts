import "dotenv/config";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { checkAuth as checkAuthResolver } from "../../../src/resolvers/Query/checkAuth";

import { USER_NOT_FOUND_ERROR } from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

let MONGOOSE_INSTANCE: typeof mongoose;

import { createTestUser } from "../../helpers/userAndOrg";
import { User } from "../../../src/models";
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
        userId: Types.ObjectId().toString(),
      };

      await checkAuthResolver?.({}, {}, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND_ERROR.DESC);
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

  it("returns user object with image ", async () => {
    let testUser = await createTestUser();

    await User.findOneAndUpdate(
      {
        _id: testUser?.id,
      },
      {
        image: `path`,
      }
    );

    testUser = await User.findOne({
      _id: testUser?.id,
    });

    const context = {
      userId: testUser?._id,
      apiRootUrl: `http://localhost:3000`,
    };

    const user = await checkAuthResolver?.({}, {}, context);

    expect(user).toEqual({
      ...testUser?.toObject(),
      image: `${context.apiRootUrl}${testUser?.image}`,
    });
  });
});
