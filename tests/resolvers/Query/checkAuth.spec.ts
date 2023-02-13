import "dotenv/config";
import {
  connect,
  disconnect,
  dropAllCollectionsFromDatabase,
} from "../../helpers/db";
import mongoose from "mongoose";
import { checkAuth as checkAuthResolver } from "../../../src/resolvers/Query/checkAuth";
import { Types } from "mongoose";
import { User } from "../../../src/models";
import { USER_NOT_FOUND } from "../../../src/constants";
import { nanoid } from "nanoid";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

let MONGOOSE_INSTANCE: typeof mongoose | null;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
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
    const testUser = await User.create({
      email: `email${nanoid().toLowerCase()}@gmail.com`,
      password: "password",
      firstName: "firstName",
      lastName: "lastName",
      appLanguageCode: "en",
    });

    const context = {
      userId: testUser._id,
    };

    const user = await checkAuthResolver?.({}, {}, context);

    expect(user).toEqual(testUser.toObject());
  });
});
