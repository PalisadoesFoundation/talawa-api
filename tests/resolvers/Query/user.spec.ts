import "dotenv/config";
import { user as userResolver } from "../../../src/resolvers/Query/user";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import { BASE_URL, USER_NOT_FOUND_ERROR } from "../../../src/constants";
import { User } from "../../../src/models";
import { Types } from "mongoose";
import { QueryUserArgs } from "../../../src/types/generatedGraphQLTypes";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import {
  testUserType,
  createTestUserAndOrganization,
} from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose | null;
let testUser: testUserType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  testUser = (await createTestUserAndOrganization())[0];
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> Query -> user", () => {
  it("throws NotFoundError if no user exists with _id === args.id", async () => {
    try {
      const args: QueryUserArgs = {
        id: Types.ObjectId().toString(),
      };

      await userResolver?.({}, args, {});
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

    expect(userPayload).toEqual({
      ...user,
      organizationsBlockedBy: [],
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
    };

    const userPayload = await userResolver?.({}, args, context);

    const user = await User.findOne({
      _id: testUser?._id,
    })
      .populate("adminFor")
      .lean();

    expect(userPayload).toEqual({
      ...user,
      organizationsBlockedBy: [],
      image: `${BASE_URL}${user?.image}`,
    });
  });
});
