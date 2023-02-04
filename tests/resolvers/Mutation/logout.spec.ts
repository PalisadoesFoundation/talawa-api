import "dotenv/config";
import { Document, Types } from "mongoose";
import {
  Interface_User,
  User,
  Organization,
  Interface_Organization,
} from "../../../src/models";
import { connect, disconnect } from "../../../src/db";
import { logout as logoutResolver } from "../../../src/resolvers/Mutation/logout";
import { USER_NOT_FOUND } from "../../../src/constants";
import { nanoid } from "nanoid";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

let testUser: Interface_User & Document<any, any, Interface_User>;
let testOrganization: Interface_Organization &
  Document<any, any, Interface_Organization>;

beforeAll(async () => {
  await connect("TALAWA_TESING_DB");

  testUser = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: "password",
    firstName: "firstName",
    lastName: "lastName",
    appLanguageCode: "en",
  });

  testOrganization = await Organization.create({
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

describe("resolvers -> Mutation -> logout", () => {
  it(`throws NotFoundError if no user exists with _id === context.userId`, async () => {
    try {
      const context = {
        userId: Types.ObjectId().toString(),
      };

      await logoutResolver?.({}, {}, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`sets token === null for user with _id === context.userId and returns true`, async () => {
    const context = {
      userId: testUser.id,
    };

    const logoutPayload = await logoutResolver?.({}, {}, context);

    expect(logoutPayload).toEqual(true);

    const updatedTestUser = await User.findOne({
      _id: testUser._id,
    })
      .select(["token"])
      .lean();

    expect(updatedTestUser!.token).toEqual(null);
  });
});
