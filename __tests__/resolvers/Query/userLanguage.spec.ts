import "dotenv/config";
import { Types } from "mongoose";
import { nanoid } from "nanoid";
import { connect, disconnect } from "../../../src/db";
import { userLanguage as userLanguageResolver } from "../../../src/lib/resolvers/Query/userLanguage";
import { USER_NOT_FOUND } from "../../../src/constants";
import { User } from "../../../src/lib/models";
import { QueryUserLanguageArgs } from "../../../src/generated/graphqlCodegen";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

beforeAll(async () => {
  await connect();
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Query -> userLanguage", () => {
  it("throws NotFoundError if no user exists with _id === args.userId", async () => {
    try {
      const args: QueryUserLanguageArgs = {
        userId: Types.ObjectId().toString(),
      };

      await userLanguageResolver?.({}, args, {});
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
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
      userId: testUser?._id,
    };

    const userLanguagePayload = await userLanguageResolver?.({}, args, {});

    expect(userLanguagePayload).toEqual(testUser.appLanguageCode);
  });
});
