import "dotenv/config";
import { directChats as directChatsResolver } from "../../../src/lib/resolvers/Query/directChats";
import { connect, disconnect } from "../../../src/db";
import {
  User,
  Organization,
  DirectChat,
  DirectChatMessage,
} from "../../../src/lib/models";
import { nanoid } from "nanoid";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

beforeAll(async () => {
  await connect();

  const testUsers = await User.insertMany([
    {
      email: `email${nanoid().toLowerCase()}@gmail.com`,
      password: "password",
      firstName: "firstName",
      lastName: "lastName",
      appLanguageCode: "en",
    },
    {
      email: `email${nanoid().toLowerCase()}@gmail.com`,
      password: "password",
      firstName: "firstName",
      lastName: "lastName",
      appLanguageCode: "en",
    },
  ]);

  const testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creator: testUsers[0]._id,
    admins: [testUsers[0]._id],
    members: [testUsers[0]._id],
  });

  await User.updateOne(
    {
      _id: testUsers[0]._id,
    },
    {
      $set: {
        createdOrganizations: [testOrganization._id],
        adminFor: [testOrganization._id],
        joinedOrganizations: [testOrganization._id],
      },
    }
  );

  const testDirectChat = await DirectChat.create({
    creator: testUsers[0]._id,
    organization: testOrganization._id,
    users: [testUsers[0]._id],
  });

  await DirectChatMessage.create({
    directChatMessageBelongsTo: testDirectChat._id,
    sender: testUsers[0]._id,
    receiver: testUsers[1]._id,
    createdAt: new Date(),
    messageContent: "messageContent",
  });
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Query -> directChats", () => {
  it(`returns list of all existing directChats`, async () => {
    const directChatsPayload = await directChatsResolver?.({}, {}, {});

    const directChats = await DirectChat.find().lean();

    // checks length of chats
    expect(directChatsPayload?.length).toEqual(directChats?.length);
    
    // checks every chat
    expect(directChatsPayload).toEqual(directChats);
  });
});
