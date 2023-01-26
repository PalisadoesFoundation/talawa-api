import "dotenv/config";
import { directChatMessages as directChatMessagesResolver } from "../../../src/resolvers/Query/directChatMessages";
import { connect, disconnect } from "../../../src/db";
import {
  DirectChat,
  DirectChatMessage,
  Organization,
  User,
} from "../../../src/models";
import { nanoid } from "nanoid";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

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
      $set: {
        createdOrganizations: [testOrganization._id],
        adminFor: [testOrganization._id],
        joinedOrganizations: [testOrganization._id],
      },
    }
  );

  const testDirectChat = await DirectChat.create({
    creator: testUser._id,
    organization: testOrganization._id,
    users: [testUser._id],
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

describe("resolvers -> Query -> directChatMessages", () => {
  it("returns list of all existing directChatMessages", async () => {
    const directChatMessagesPayload = await directChatMessagesResolver?.(
      {},
      {},
      {}
    );

    const directChatMessages = await DirectChatMessage.find().lean();

    expect(directChatMessagesPayload).toEqual(directChatMessages);
  });
});
