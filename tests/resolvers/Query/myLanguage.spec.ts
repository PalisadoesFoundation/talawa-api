import "dotenv/config";
import { myLanguage as myLanguageResolver } from "../../../src/resolvers/Query/myLanguage";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { USER_NOT_FOUND_ERROR } from "../../../src/constants";
import { User } from "../../../src/models";
import { nanoid } from "nanoid";

import { beforeAll, afterAll, describe, it, expect } from "vitest";

let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> myLanguage", () => {
  it("throws NotFoundError if no user exists with _id === context.userId", async () => {
    try {
      const context = {
        userId: new Types.ObjectId().toString(),
      };

      await myLanguageResolver?.({}, {}, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND_ERROR.DESC);
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
