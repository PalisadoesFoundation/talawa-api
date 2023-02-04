import "dotenv/config";
import { groupChats as groupChatsResolver } from "../../../src/resolvers/Query/groupChats";
import { connect, disconnect } from "../../../src/db";
import { GroupChat, Organization, User } from "../../../src/models";
import { nanoid } from "nanoid";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

beforeAll(async () => {
  await connect("TALAWA_TESING_DB");

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
      $set: {
        createdOrganizations: [testOrganization._id],
        adminFor: [testOrganization._id],
        joinedOrganizations: [testOrganization._id],
      },
    }
  );

  await GroupChat.create({
    title: "title",
    users: [testUser._id],
    creator: testUser._id,
    organization: testOrganization._id,
  });
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Query -> groupChats", () => {
  it(`returns list of all existing groupChats`, async () => {
    const groupChatsPayload = await groupChatsResolver?.({}, {}, {});

    const groupChats = await GroupChat.find().lean();

    expect(groupChatsPayload).toEqual(groupChats);
  });
});
