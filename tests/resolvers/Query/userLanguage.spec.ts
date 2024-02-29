import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { nanoid } from "nanoid";
import { connect, disconnect } from "../../helpers/db";

import { userLanguage as userLanguageResolver } from "../../../src/resolvers/Query/userLanguage";
import { USER_NOT_FOUND_ERROR } from "../../../src/constants";
import { User } from "../../../src/models";
import type { QueryUserLanguageArgs } from "../../../src/types/generatedGraphQLTypes";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

let MONGOOSE_INSTANCE: typeof mongoose;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> userLanguage", () => {
  it("throws NotFoundError if no user exists with _id === args.userId", async () => {
    try {
      const args: QueryUserLanguageArgs = {
        userId: new Types.ObjectId().toString(),
      };

      await userLanguageResolver?.({}, args, {});
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND_ERROR.DESC);
    }
  });

  it(`returns user's appLanguageCode`, async () => {
    const testUser = await User.create({
      email: `email${nanoid().toLowerCase()}@gmail.com`,
      password: "password",
      firstName: "firstName",
      lastName: "lastName",
      appLanguageCode: "en",
    });

    const args: QueryUserLanguageArgs = {
      userId: testUser?._id.toString(),
    };

    const userLanguagePayload = await userLanguageResolver?.({}, args, {});

    expect(userLanguagePayload).toEqual(testUser.appLanguageCode);
  });
});
