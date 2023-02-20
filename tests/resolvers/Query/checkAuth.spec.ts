import "dotenv/config";
import {
  connect,
  disconnect,
  dropAllCollectionsFromDatabase,
} from "../../helpers/db";
import mongoose from "mongoose";
import { checkAuth as checkAuthResolver } from "../../../src/resolvers/Query/checkAuth";
import { Types } from "mongoose";
import { USER_NOT_FOUND } from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

let MONGOOSE_INSTANCE: typeof mongoose | null;

import { createTestUser } from "../../helpers/userAndOrg";
beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE!);
});

afterAll(async () => {
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE!);
  await disconnect(MONGOOSE_INSTANCE!);
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
      userId: testUser?._id,
    };

    const user = await checkAuthResolver?.({}, {}, context);

    expect(user).toEqual(testUser?.toObject());
  });
});
