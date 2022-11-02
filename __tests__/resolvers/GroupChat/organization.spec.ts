import "dotenv/config";
import { organization as organizationResolver } from "../../../src/lib/resolvers/GroupChat/organization";
import { connect, disconnect } from "../../../src/db";
import {
  User,
  Organization,
  Interface_GroupChat,
  GroupChat,
} from "../../../src/lib/models";
import { Document } from "mongoose";
import { nanoid } from "nanoid";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

let testGroupChat: Interface_GroupChat &
  Document<any, any, Interface_GroupChat>;

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

  testGroupChat = await GroupChat.create({
    creator: testUser._id,
    users: [testUser._id],
    organization: testOrganization._id,
    title: "title",
  });
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> GroupChat -> organization", () => {
  it(`returns user objects for parent.organization`, async () => {
    const parent = testGroupChat.toObject();

    const organizationPayload = await organizationResolver?.(parent, {}, {});

    const organization = await Organization.findOne({
      _id: testGroupChat.organization,
    }).lean();

    expect(organizationPayload).toEqual(organization);
  });
});
