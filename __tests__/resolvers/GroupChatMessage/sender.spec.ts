import "dotenv/config";
import { sender as senderResolver } from "../../../src/lib/resolvers/GroupChatMessage/sender";
import { connect, disconnect } from "../../../src/db";
import {
  User,
  Organization,
  Interface_GroupChatMessage,
  GroupChat,
  GroupChatMessage,
} from "../../../src/lib/models";
import { Document } from "mongoose";
import { nanoid } from "nanoid";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

let testGroupChatMessage: Interface_GroupChatMessage &
  Document<any, any, Interface_GroupChatMessage>;

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

  const testGroupChat = await GroupChat.create({
    creator: testUser._id,
    users: [testUser._id],
    organization: testOrganization._id,
    title: "title",
  });

  testGroupChatMessage = await GroupChatMessage.create({
    groupChatMessageBelongsTo: testGroupChat._id,
    sender: testUser._id,
    createdAt: new Date(),
    messageContent: "messageContent",
  });
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> GroupChatMessage -> sender", () => {
  it(`returns sender object for parent.sender`, async () => {
    const parent = testGroupChatMessage.toObject();

    const senderPayload = await senderResolver?.(parent, {}, {});

    const sender = await User.findOne({
      _id: testGroupChatMessage.sender,
    }).lean();

    expect(senderPayload).toEqual(sender);
  });
});
