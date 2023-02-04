import "dotenv/config";
import { user as userResolver } from "../../../src/resolvers/Query/user";
import { connect, disconnect } from "../../../src/db";
import { USER_NOT_FOUND } from "../../../src/constants";
import { Interface_User, Organization, User } from "../../../src/models";
import { nanoid } from "nanoid";
import { Document, Types } from "mongoose";
import { QueryUserArgs } from "../../../src/types/generatedGraphQLTypes";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

let testUser: Interface_User & Document<any, any, Interface_User>;

beforeAll(async () => {
  await connect("TALAWA_TESING_DB");

  testUser = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: "password",
    firstName: "firstName",
    lastName: "lastName",
    appLanguageCode: "en",
  });

  const testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creator: testUser._id,
    admins: [testUser._id],
    members: [testUser._id],
  });

  await User.updateOne(
    {
      _id: testUser._id,
    },
    {
      $push: {
        createdOrganizations: testOrganization._id,
        adminFor: testOrganization._id,
        joinedOrganizations: testOrganization._id,
      },
    }
  );
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Query -> user", () => {
  it("throws NotFoundError if no user exists with _id === args.id", async () => {
    try {
      const args: QueryUserArgs = {
        id: Types.ObjectId().toString(),
      };

      await userResolver?.({}, args, {});
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`returns user object`, async () => {
    const args: QueryUserArgs = {
      id: testUser.id,
    };

    const context = {
      userId: testUser.id,
    };

    const userPayload = await userResolver?.({}, args, context);

    const user = await User.findOne({
      _id: testUser._id,
    })
      .populate("adminFor")
      .lean();

    expect(userPayload).toEqual({
      ...user,
      organizationsBlockedBy: [],
    });
  });
});
