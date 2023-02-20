import "dotenv/config";
import { myLanguage as myLanguageResolver } from "../../../src/resolvers/Query/myLanguage";
import {
  connect,
  disconnect,
  dropAllCollectionsFromDatabase,
} from "../../helpers/db";
import mongoose from "mongoose";
import { USER_NOT_FOUND } from "../../../src/constants";
import { User } from "../../../src/models";
import { nanoid } from "nanoid";
import { Types } from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

let MONGOOSE_INSTANCE: typeof mongoose | null;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE!);
});

afterAll(async () => {
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE!);
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> Query -> myLanguage", () => {
  it("throws NotFoundError if no user exists with _id === context.userId", async () => {
    try {
      const context = {
        userId: Types.ObjectId().toString(),
      };

      await myLanguageResolver?.({}, {}, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`returns current user's appLanguageCode`, async () => {
    const testUser = await User.create({
      email: `email${nanoid().toLowerCase()}@gmail.com`,
      password: "password",
      firstName: "firstName",
      lastName: "lastName",
      appLanguageCode: "en",
    });

    const context = {
      userId: testUser?._id,
    };

    const appLanguageCodePayload = await myLanguageResolver?.({}, {}, context);

    expect(appLanguageCodePayload).toEqual(testUser?.appLanguageCode);
  });
});
