import "dotenv/config";
import { messages as messagesResolver } from "../../../src/lib/resolvers/DirectChat/messages";
import { connect, disconnect } from "../../../src/db";
import {
  User,
  Organization,
  Interface_DirectChat,
  DirectChat,
  DirectChatMessage,
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

  await DirectChatMessage.create({
    directChatMessageBelongsTo: testDirectChat._id,
    sender: testUser._id,
    receiver: testUser._id,
    createdAt: new Date(),
    messageContent: "messageContent",
  });
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> DirectChat -> messages", () => {
  it(`returns user object for parent.messages`, async () => {
    const parent = testDirectChat.toObject();

    const messagesPayload = await messagesResolver?.(parent, {}, {});

    const messages = await DirectChatMessage.find({
      _id: {
        $in: testDirectChat.messages,
      },
    }).lean();

    expect(messagesPayload).toEqual(messages);
  });
});
