import "dotenv/config";
import { user as userResolver } from "../../../src/resolvers/Query/user";
import { connect, disconnect } from "../../helpers/db";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import { BASE_URL, USER_NOT_FOUND_ERROR } from "../../../src/constants";
import { User } from "../../../src/models";

import type { QueryUserArgs } from "../../../src/types/generatedGraphQLTypes";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import type { TestUserType } from "../../helpers/userAndOrg";
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";
import { decryptEmail } from "../../../src/utilities/encryptionModule";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser = (await createTestUserAndOrganization())[0];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Query -> user", () => {
  it("throws NotFoundError if no user exists with _id === args.id", async () => {
    try {
      const args: QueryUserArgs = {
        id: Types.ObjectId().toString(),
      };

      await userResolver?.({}, args, {});
      // eslint-disable-next-line
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND_ERROR.DESC);
    }
  });

  it(`returns user object without image`, async () => {
    const args: QueryUserArgs = {
      id: testUser?.id,
    };

    const context = {
      userId: testUser?.id,
    };

    const userPayload = await userResolver?.({}, args, context);

    const user = await User.findOne({
      _id: testUser?._id,
    })
      .populate("adminFor")
      .lean();

    if (!user) {
      throw new Error("User not found.");
    }
    expect(userPayload).toEqual({
      ...user,
      email: decryptEmail(user.email).decrypted,
      organizationsBlockedBy: [],
      image: null,
    });
  });
  it(`returns user object with image`, async () => {
    await User.findOneAndUpdate(
      {
        _id: testUser?.id,
      },
      {
        $set: {
          image: `images/newImage.png`,
        },
      }
    );

    const args: QueryUserArgs = {
      id: testUser?.id,
    };

    const context = {
      userId: testUser?.id,
      apiRootUrl: BASE_URL,
    };

    const userPayload = await userResolver?.({}, args, context);

    const user = await User.findOne({
      _id: testUser?._id,
    })
      .populate("adminFor")
      .lean();

    if (!user) {
      throw new Error("User not found.");
    }
    expect(userPayload).toEqual({
      ...user,
      email: decryptEmail(user.email).decrypted,
      organizationsBlockedBy: [],
      image: user?.image ? `${BASE_URL}${user.image}` : null,
    });
  });
});
