import "dotenv/config";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import type { MutationUpdateChatMessageArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import {
  CHAT_NOT_FOUND_ERROR,
  MESSAGE_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  //   CHAT_NOT_FOUND_ERROR,
  //   USER_NOT_AUTHORIZED_ERROR,
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

import type { TestChatMessageType, TestChatType } from "../../helpers/chat";
import { createTestChatMessage } from "../../helpers/chat";
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";
import type { TestUserType } from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testChat: TestChatType;
let testMessage: TestChatMessageType;
beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const resultsArray = await createTestUserAndOrganization();
  testUser = resultsArray[0];
  [, , testChat, testMessage] = await createTestChatMessage();
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
      const args: MutationUpdateChatMessageArgs = {
        input: {
          messageContent: "New Message",
          chatId: testChat?.id,
          messageId: testMessage?._id.toString()
            ? testMessage?._id.toString()
            : "",
        },
      };
      const context = {
        userId: new Types.ObjectId().toString(),
      };
      const { updateChatMessage: updateChatMessageResolver } = await import(
        "../../../src/resolvers/Mutation/updateChatMessage"
      );

      await updateChatMessageResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
    spy.mockRestore();
  });

  it(`throws NotFoundError message if message does not exists`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationUpdateChatMessageArgs = {
        input: {
          messageContent: "New Message",
          chatId: testChat?.id,
          messageId: new Types.ObjectId().toString(),
        },
      };
      const context = {
        userId: new Types.ObjectId().toString(),
      };
      const { updateChatMessage: updateChatMessageResolver } = await import(
        "../../../src/resolvers/Mutation/updateChatMessage"
      );

      await updateChatMessageResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(MESSAGE_NOT_FOUND_ERROR.MESSAGE);
    }
    spy.mockRestore();
  });

  it(`check whether the chat exists with _id === args.chatId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationUpdateChatMessageArgs = {
        input: {
          messageContent: "New Message",
          chatId: new Types.ObjectId().toString(),
          messageId: testMessage?._id.toString()
            ? testMessage?._id.toString()
            : "",
        },
      };
      const context = {
        userId: testMessage?.sender,
      };
      const { updateChatMessage: updateChatMessageResolver } = await import(
        "../../../src/resolvers/Mutation/updateChatMessage"
      );

      await updateChatMessageResolver?.({}, args, context);
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
      const args: MutationUpdateChatMessageArgs = {
        input: {
          messageContent: "New Message",
          chatId: testChat?.id,
          messageId: testMessage?._id.toString()
            ? testMessage?._id.toString()
            : "",
        },
      };
      const context = {
        userId: testUser?._id,
      };
      const { updateChatMessage: updateChatMessageResolver } = await import(
        "../../../src/resolvers/Mutation/updateChatMessage"
      );

      await updateChatMessageResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
    spy.mockRestore();
  });

  it(`throw userNotAuthorizedError if user is not the sender of the message`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationUpdateChatMessageArgs = {
        input: {
          messageContent: "New Message",
          chatId: testChat?.id,
          messageId: testMessage?._id.toString()
            ? testMessage?._id.toString()
            : "",
        },
      };
      const context = {
        userId: testChat?.users[1]._id,
      };
      const { updateChatMessage: updateChatMessageResolver } = await import(
        "../../../src/resolvers/Mutation/updateChatMessage"
      );

      await updateChatMessageResolver?.({}, args, context);
    } catch (error: unknown) {
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
    spy.mockRestore();
  });

  it(`updates the chat message and returns it`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);

    const args: MutationUpdateChatMessageArgs = {
      input: {
        messageContent: "New Message",
        chatId: testChat?.id,
        messageId: testMessage?._id.toString()
          ? testMessage?._id.toString()
          : "",
      },
    };
    const context = {
      userId: testMessage?.sender,
    };
    const { updateChatMessage: updateChatMessageResolver } = await import(
      "../../../src/resolvers/Mutation/updateChatMessage"
    );

    const updatedMessage = await updateChatMessageResolver?.({}, args, context);

    console.log(updatedMessage);

    spy.mockRestore();
  });
});
