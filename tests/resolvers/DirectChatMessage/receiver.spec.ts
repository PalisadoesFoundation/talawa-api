import "dotenv/config";
import { receiver as receiverResolver } from "../../../src/resolvers/DirectChatMessage/receiver";
import { connect, disconnect } from "../../../src/db";
import {
  User,
  Organization,
  Interface_DirectChatMessage,
  DirectChat,
  DirectChatMessage,
} from "../../../src/models";
import { Document } from "mongoose";
import { nanoid } from "nanoid";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

let testDirectChatMessage: Interface_DirectChatMessage &
  Document<any, any, Interface_DirectChatMessage>;

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

  const testDirectChat = await DirectChat.create({
    creator: testUser._id,
    users: [testUser._id],
    organization: testOrganization._id,
    title: "title",
  });

  testDirectChatMessage = await DirectChatMessage.create({
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

describe("resolvers -> DirectChatMessage -> receiver", () => {
  it(`returns user object for parent.receiver`, async () => {
    const parent = testDirectChatMessage.toObject();

    const receiverPayload = await receiverResolver?.(parent, {}, {});

    const receiver = await User.findOne({
      _id: testDirectChatMessage.receiver,
    }).lean();

    expect(receiverPayload).toEqual(receiver);
  });
});
