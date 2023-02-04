import "dotenv/config";
import { groupChatMessages as groupChatMessagesResolver } from "../../../src/resolvers/Query/groupChatMessages";
import { connect, disconnect } from "../../../src/db";
import {
  GroupChat,
  GroupChatMessage,
  Organization,
  User,
} from "../../../src/models";
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

  const groupChat = await GroupChat.create({
    title: "title",
    users: [testUser._id],
    creator: testUser._id,
    organization: testOrganization._id,
  });

  await GroupChatMessage.create({
    groupChatMessageBelongsTo: groupChat._id,
    sender: testUser._id,
    messageContent: "messageContent",
    createdAt: new Date().toString(),
  });
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Query -> groupChatMessages", () => {
  it(`returns list of all existing groupChatMessages`, async () => {
    const groupChatMessagesPayload = await groupChatMessagesResolver?.(
      {},
      {},
      {}
    );

    const groupChatMessages = await GroupChatMessage.find().lean();

    expect(groupChatMessagesPayload).toEqual(groupChatMessages);
  });
});
