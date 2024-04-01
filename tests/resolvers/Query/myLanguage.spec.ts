import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { nanoid } from "nanoid";
import { USER_NOT_FOUND_ERROR } from "../../../src/constants";
import { AppUserProfile, User } from "../../../src/models";
import { myLanguage as myLanguageResolver } from "../../../src/resolvers/Query/myLanguage";
import { connect, disconnect } from "../../helpers/db";

import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createTestUser } from "../../helpers/userAndOrg";

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
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.DESC);
    }
  });

  it(`returns current user's appLanguageCode`, async () => {
    const testUser = await User.create({
      email: `email${nanoid().toLowerCase()}@gmail.com`,
      password: "password",
      firstName: "firstName",
      lastName: "lastName",
    });
    const testAppUserProfile = await AppUserProfile.create({
      userId: testUser._id,
      appLanguageCode: "en",
    });
    await User.updateOne(
      {
        _id: testUser._id,
      },
      {
        appUserProfileId: testAppUserProfile._id,
      },
    );

    const context = {
      userId: testUser?._id,
    };

    const appLanguageCodePayload = await myLanguageResolver?.({}, {}, context);

    expect(appLanguageCodePayload).toEqual(testAppUserProfile?.appLanguageCode);
  });
  it("throws error if user does not have appLanguageCode", async () => {
    const newUser = await createTestUser();
    await AppUserProfile.deleteOne({
      userId: newUser?.id,
    });
    const context = {
      userId: newUser?._id,
    };

    try {
      await myLanguageResolver?.({}, {}, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });
});
