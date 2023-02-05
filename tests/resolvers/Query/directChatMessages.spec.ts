import "dotenv/config";
import { directChatMessages as directChatMessagesResolver } from "../../../src/resolvers/Query/directChatMessages";
import { connect, disconnect } from "../../../src/db";
import {
  DirectChat,
  DirectChatMessage,
} from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createTestDirectChatMessage } from "../../helpers/directChat.ts"

beforeAll(async () => {
  await connect();

  const [testUser, testOrganization, testDirectChat] = await createTestDirectChatMessage();
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
