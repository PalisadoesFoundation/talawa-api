import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import type { MutationAddUserToGroupChatArgs } from "../../../src/types/generatedGraphQLTypes";
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
import type { TestUserType } from "../../helpers/userAndOrg";
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";
import type { TestChatType } from "../../helpers/chat";
import { createTestChat, createTestDirectChat } from "../../helpers/chat";

let testUser: TestUserType;
let MONGOOSE_INSTANCE: typeof mongoose;
let testChat: TestChatType;
let testDirectChat: TestChatType;
beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const resultsArray = await createTestUserAndOrganization();
  testUser = resultsArray[0];
  [, , testChat] = await createTestChat();
  [, , testDirectChat] = await createTestDirectChat();
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> addUserToGroupChat", () => {
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
      const args: MutationAddUserToGroupChatArgs = {
        chatId: testChat?.id,
        userId: new Types.ObjectId().toString(),
      };
      const context = {
        userId: new Types.ObjectId().toString(),
      };
      const { addUserToGroupChat: addUserToGroupChatResolver } = await import(
        "../../../src/resolvers/Mutation/addUserToGroupChat"
      );
      await addUserToGroupChatResolver?.({}, args, context);
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
    const args: MutationAddUserToGroupChatArgs = {
      chatId: new Types.ObjectId().toString(),
      userId: testUser?.id,
    };
    const context = {
      userId: testUser?.id,
    };
    const { addUserToGroupChat: addUserToGroupChatResolver } = await import(
      "../../../src/resolvers/Mutation/addUserToGroupChat"
    );
    try {
      await addUserToGroupChatResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(CHAT_NOT_FOUND_ERROR.MESSAGE);
    }
    spy.mockRestore();
  });

  it(`throw userNotAuthorizedError if user is not authorized to add user to chat`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    const args: MutationAddUserToGroupChatArgs = {
      chatId: testChat?.id,
      userId: testUser?.id,
    };
    const context = {
      userId: testUser?.id,
    };
    const { addUserToGroupChat: addUserToGroupChatResolver } = await import(
      "../../../src/resolvers/Mutation/addUserToGroupChat"
    );
    try {
      await addUserToGroupChatResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
    spy.mockRestore();
  });

  it(`throw userNotAuthorizedError if its not a group chat`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    const args: MutationAddUserToGroupChatArgs = {
      chatId: testDirectChat?.id,
      userId: testUser?.id,
    };
    const context = {
      userId: testChat?.admins[0],
    };
    const { addUserToGroupChat: addUserToGroupChatResolver } = await import(
      "../../../src/resolvers/Mutation/addUserToGroupChat"
    );
    try {
      await addUserToGroupChatResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
    spy.mockRestore();
  });

  it(`throw userNotFoundError if user to be added does not exists`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    const args: MutationAddUserToGroupChatArgs = {
      chatId: testChat?.id,
      userId: new Types.ObjectId().toString(),
    };
    const context = {
      userId: testChat?.admins[0],
    };
    const { addUserToGroupChat: addUserToGroupChatResolver } = await import(
      "../../../src/resolvers/Mutation/addUserToGroupChat"
    );
    try {
      await addUserToGroupChatResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
    spy.mockRestore();
  });

  it(`add user to chat and return chat`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    const args: MutationAddUserToGroupChatArgs = {
      chatId: testChat?.id,
      userId: testUser?.id,
    };
    const context = {
      userId: testChat?.admins[0],
    };
    const { addUserToGroupChat: addUserToGroupChatResolver } = await import(
      "../../../src/resolvers/Mutation/addUserToGroupChat"
    );
    const chat = await addUserToGroupChatResolver?.({}, args, context);
    expect(chat).toBeTruthy();
    spy.mockRestore();
  });
});
