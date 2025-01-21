import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import type { MutationMarkChatMessagesAsReadArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import {
  CHAT_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import {
  beforeAll,
  afterAll,
  describe,
  it,
  expect,
  vi,
  afterEach,
} from "vitest";

import type { TestChatType } from "../../helpers/chat";
import { createTestChatMessage } from "../../helpers/chat";
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";
import type { TestUserType } from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testChat: TestChatType;
beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const resultsArray = await createTestUserAndOrganization();
  testUser = resultsArray[0];
  [, , testChat] = await createTestChatMessage();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> markChatMessagesMessagesAsRead", () => {
  afterEach(() => {
    vi.doUnmock("../../../src/constants");
    vi.resetModules();
  });

  it(`throws NotFoundError message if current user does not exists`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationMarkChatMessagesAsReadArgs = {
        chatId: testChat?.id,
        userId: new Types.ObjectId().toString(),
      };
      const context = {
        userId: new Types.ObjectId().toString(),
      };
      const { markChatMessagesAsRead: markChatMessagesAsReadResolver } =
        await import("../../../src/resolvers/Mutation/markChatMessagesAsRead");

      await markChatMessagesAsReadResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
    spy.mockRestore();
  });

  it(`check whether the chat exists with _id === args.chatId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationMarkChatMessagesAsReadArgs = {
        chatId: new Types.ObjectId().toString(),
        userId: testChat?.users[0]._id.toString(),
      };
      const context = {
        userId: testChat?.users[0]._id.toString(),
      };
      const { markChatMessagesAsRead: markChatMessagesAsReadResolver } =
        await import("../../../src/resolvers/Mutation/markChatMessagesAsRead");

      await markChatMessagesAsReadResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(CHAT_NOT_FOUND_ERROR.MESSAGE);
    }
    spy.mockRestore();
  });

  it(`throw userNotAuthorizedError if user is not a member of the chat`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationMarkChatMessagesAsReadArgs = {
        chatId: testChat?.id,
        userId: testUser?._id,
      };
      const context = {
        userId: testUser?._id,
      };
      const { markChatMessagesAsRead: markChatMessagesAsReadResolver } =
        await import("../../../src/resolvers/Mutation/markChatMessagesAsRead");

      await markChatMessagesAsReadResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
    spy.mockRestore();
  });

  it(`marks chat messages as read and returns it`, async () => {
    const args: MutationMarkChatMessagesAsReadArgs = {
      chatId: testChat?.id,
      userId: testChat?.users[0]._id.toString(),
    };
    const context = {
      userId: testChat?.users[0]._id.toString(),
    };
    const { markChatMessagesAsRead: markChatMessagesAsReadResolver } =
      await import("../../../src/resolvers/Mutation/markChatMessagesAsRead");

    await markChatMessagesAsReadResolver?.({}, args, context);
  });
});
