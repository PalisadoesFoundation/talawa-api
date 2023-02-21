import "dotenv/config";
import { directChatMessages as directChatMessagesResolver } from "../../../src/resolvers/Query/directChatMessages";
import { connect, disconnect } from "../../helpers/db";
import mongoose from "mongoose";
import { DirectChatMessage } from "../../../src/models";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { createTestDirectChatMessage } from "../../helpers/directChat";

let MONGOOSE_INSTANCE: typeof mongoose | null;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  await createTestDirectChatMessage();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE!);
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
