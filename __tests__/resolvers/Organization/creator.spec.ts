import "dotenv/config";
import { creator as creatorResolver } from "../../../src/lib/resolvers/Organization/creator";
import { connect, disconnect } from "../../../src/db";
import {
  User,
  Organization,
  Interface_Organization,
  Interface_User,
} from "../../../src/lib/models";
import { Document, Types } from "mongoose";
import { USER_NOT_FOUND } from "../../../src/constants";
import { nanoid } from "nanoid";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

let testUser: Interface_User & Document<any, any, Interface_User>;

let testOrganization:
  | (Interface_Organization & Document<any, any, Interface_Organization>)
  | null;

beforeAll(async () => {
  await connect();

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

describe("resolvers -> Organization -> creator", () => {
  it(`throws NotFoundError if no user exists with _id === parent.creator`, async () => {
    try {
      testOrganization = await Organization.findOneAndUpdate(
        {
          _id: testOrganization!._id,
        },
        {
          $set: {
            creator: Types.ObjectId().toString(),
          },
        },
        {
          new: true,
        }
      );

      const parent = testOrganization!.toObject();

      await creatorResolver?.(parent, {}, {});
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`returns user object for parent.creator`, async () => {
    testOrganization = await Organization.findOneAndUpdate(
      {
        _id: testOrganization!._id,
      },
      {
        $set: {
          creator: testUser._id,
        },
      },
      {
        new: true,
      }
    );

    const parent = testOrganization!.toObject();

    const creatorPayload = await creatorResolver?.(parent, {}, {});

    const creator = await User.findOne({
      _id: testOrganization!.creator,
    }).lean();

    expect(creatorPayload).toEqual(creator);
  });
});
