import "dotenv/config";
import { messages as messagesResolver } from "../../../src/lib/resolvers/GroupChat/messages";
import { connect, disconnect } from "../../../src/db";
import {
  User,
  Organization,
  Interface_GroupChat,
  GroupChat,
  GroupChatMessage,
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

  await GroupChatMessage.create({
    groupChatMessageBelongsTo: testGroupChat._id,
    sender: testUser._id,
    createdAt: new Date(),
    messageContent: "messageContent",
  });
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> GroupChat -> messages", () => {
  it(`returns user objects for parent.messages`, async () => {
    const parent = testGroupChat.toObject();

    const messagesPayload = await messagesResolver?.(parent, {}, {});

    const messages = await GroupChatMessage.find({
      _id: {
        $in: testGroupChat.messages,
      },
    }).lean();

    expect(messagesPayload).toEqual(messages);
  });
});
