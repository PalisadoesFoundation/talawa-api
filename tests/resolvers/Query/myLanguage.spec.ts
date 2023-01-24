import "dotenv/config";
import { myLanguage as myLanguageResolver } from "../../../src/resolvers/Query/myLanguage";
import { connect, disconnect } from "../../../src/db";
import { USER_NOT_FOUND } from "../../../src/constants";
import { User } from "../../../src/models";
import { nanoid } from "nanoid";
import { Types } from "mongoose";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

beforeAll(async () => {
  await connect();
});

afterAll(async () => {
  await disconnect();
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
