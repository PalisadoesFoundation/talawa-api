import "dotenv/config";
import type { Document } from "mongoose";
import type mongoose from "mongoose";
import { Types } from "mongoose";
import type {
  InterfaceGroupChat,
  InterfaceGroupChatMessage,
} from "../../../src/models";
import { GroupChat } from "../../../src/models";
import type { MutationSendMessageToGroupChatArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../helpers/db";

import { sendMessageToGroupChat as sendMessageToGroupChatResolver } from "../../../src/resolvers/Mutation/sendMessageToGroupChat";
import {
  CHAT_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect, vi } from "vitest";
import type { TestUserType } from "../../helpers/userAndOrg";
import { createTestUserAndOrganization } from "../../helpers/userAndOrg";

let MONGOOSE_INSTANCE: typeof mongoose;
let testUser: TestUserType;
let testGroupChat: InterfaceGroupChat &
  Document<unknown, unknown, InterfaceGroupChat>;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  const temp = await createTestUserAndOrganization();
  testUser = temp[0];

  const testOrganization = temp[1];

  testGroupChat = await GroupChat.create({
    title: "title",
    creatorId: testUser?._id,
    organization: testOrganization?._id,
  });
});

afterAll(async () => {
  await disconnect(MONGOOSE_INSTANCE);
});

describe("resolvers -> Mutation -> sendMessageToGroupChat", () => {
  it(`throws NotFoundError if no groupChat exists with _id === args.chatId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationSendMessageToGroupChatArgs = {
        chatId: new Types.ObjectId().toString(),
        messageContent: "",
      };

      const context = { userId: testUser?.id };

      const { sendMessageToGroupChat: sendMessageToGroupChatResolver } =
        await import("../../../src/resolvers/Mutation/sendMessageToGroupChat");

      await sendMessageToGroupChatResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(CHAT_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(CHAT_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws NotFoundError current user with _id === context.userId does not exist`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationSendMessageToGroupChatArgs = {
        chatId: testGroupChat.id,
        messageContent: "",
      };

      const context = {
        userId: new Types.ObjectId().toString(),
      };

      const { sendMessageToGroupChat: sendMessageToGroupChatResolver } =
        await import("../../../src/resolvers/Mutation/sendMessageToGroupChat");

      await sendMessageToGroupChatResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(USER_NOT_FOUND_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(USER_NOT_FOUND_ERROR.MESSAGE);
    }
  });

  it(`throws UnauthorizedError if users field of groupChat with _id === args.chatId
  does not contain current user with _id === context.userId`, async () => {
    const { requestContext } = await import("../../../src/libraries");
    const spy = vi
      .spyOn(requestContext, "translate")
      .mockImplementationOnce((message) => message);
    try {
      const args: MutationSendMessageToGroupChatArgs = {
        chatId: testGroupChat.id,
        messageContent: "",
      };

      const context = {
        userId: testUser?.id,
      };

      const { sendMessageToGroupChat: sendMessageToGroupChatResolver } =
        await import("../../../src/resolvers/Mutation/sendMessageToGroupChat");

      await sendMessageToGroupChatResolver?.({}, args, context);
    } catch (error: unknown) {
      expect(spy).toBeCalledWith(USER_NOT_AUTHORIZED_ERROR.MESSAGE);
      expect((error as Error).message).toEqual(
        USER_NOT_AUTHORIZED_ERROR.MESSAGE,
      );
    }
  });

  it(`creates the groupChatMessage and returns it`, async () => {
    await GroupChat.updateOne(
      {
        _id: testGroupChat._id,
      },
      {
        $push: {
          users: testUser?._id,
        },
      },
    );

    const args: MutationSendMessageToGroupChatArgs = {
      chatId: testGroupChat.id,
      messageContent: "messageContent",
    };

    const pubsub = {
      publish: (
        _action: "MESSAGE_SENT_TO_GROUP_CHAT",
        _payload: {
          messageSentToGroupChat: InterfaceGroupChatMessage;
        },
      ): {
        _action: string;
        _payload: { messageSentToGroupChat: InterfaceGroupChatMessage };
      } => {
        return { _action, _payload };
      },
    };

    const context = {
      userId: testUser?.id,
      pubsub,
    };

    const sendMessageToGroupChatPayload =
      await sendMessageToGroupChatResolver?.({}, args, context);

    expect(sendMessageToGroupChatPayload).toEqual(
      expect.objectContaining({
        groupChatMessageBelongsTo: testGroupChat._id,
        sender: testUser?._id,
        messageContent: "messageContent",
      }),
    );
  });
});
