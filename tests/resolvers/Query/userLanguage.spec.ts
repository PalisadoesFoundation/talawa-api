import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { connect, disconnect } from "../../helpers/db";

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { AppUserProfile } from "../../../src/models";
import { userLanguage as userLanguageResolver } from "../../../src/resolvers/Query/userLanguage";
import type { QueryUserLanguageArgs } from "../../../src/types/generatedGraphQLTypes";
import { createTestUser } from "../../helpers/userAndOrg";

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
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.DESC);
    }
  });

  it(`returns user's appLanguageCode`, async () => {
    const testUser = await createTestUser();

    const args: QueryUserLanguageArgs = {
      userId: testUser?._id,
    };
    const testAppUserProfile = await AppUserProfile.findOne({
      userId: testUser?._id,
    });

    const userLanguagePayload = await userLanguageResolver?.({}, args, {});

    expect(userLanguagePayload).toEqual(testAppUserProfile?.appLanguageCode);
  });
  it("throws error if user does not have appLanguageCode", async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    const newUser = await createTestUser();
    await AppUserProfile.deleteOne({
      userId: newUser?.id,
    });
    const args: QueryUserLanguageArgs = {
      userId: newUser?._id,
    };

    try {
      await userLanguageResolver?.({}, args, {});
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });
});
