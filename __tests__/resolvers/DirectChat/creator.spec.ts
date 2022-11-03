import "dotenv/config";
import { creator as creatorResolver } from "../../../src/lib/resolvers/DirectChat/creator";
import { connect, disconnect } from "../../../src/db";
import {
  User,
  Organization,
  Interface_DirectChat,
  DirectChat,
} from "../../../src/lib/models";
import { Document } from "mongoose";
import { nanoid } from "nanoid";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

let testDirectChat: Interface_DirectChat &
  Document<any, any, Interface_DirectChat>;

beforeAll(async () => {
  await connect();

  const testUser = await User.create({
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

  testDirectChat = await DirectChat.create({
    creator: testUser._id,
    users: [testUser._id],
    organization: testOrganization._id,
  });
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> DirectChat -> creator", () => {
  it(`returns user object for parent.creator`, async () => {
    const parent = testDirectChat.toObject();

    const creatorPayload = await creatorResolver?.(parent, {}, {});

    const creator = await User.findOne({
      _id: testDirectChat.creator,
    }).lean();

    expect(creatorPayload).toEqual(creator);
  });
});
