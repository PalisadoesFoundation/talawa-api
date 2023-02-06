import "dotenv/config";
import { Document, Types } from "mongoose";
import {
  GroupChat,
  Interface_GroupChat,
  Interface_GroupChatMessage,
} from "../../../src/models";
import { MutationSendMessageToGroupChatArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { sendMessageToGroupChat as sendMessageToGroupChatResolver } from "../../../src/resolvers/Mutation/sendMessageToGroupChat";
import {
  CHAT_NOT_FOUND,
  USER_NOT_AUTHORIZED,
  USER_NOT_FOUND,
} from "../../../src/constants";
let testUser: testUserType;
let testGroupChat: Interface_GroupChat &
  Document<any, any, Interface_GroupChat>;
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import {
  createTestUserAndOrganization,
  testUserType,
} from "../../helpers/userAndOrg";

beforeAll(async () => {
  await connect("TALAWA_TESTING_DB");
  const temp = await createTestUserAndOrganization();
  testUser = temp[0];

  const testOrganization = temp[1];

  testGroupChat = await GroupChat.create({
    title: "title",
    creator: testUser!._id,
    organization: testOrganization!._id,
  });
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Mutation -> sendMessageToGroupChat", () => {
  it(`throws NotFoundError if no groupChat exists with _id === args.chatId`, async () => {
    try {
      const args: MutationSendMessageToGroupChatArgs = {
        chatId: Types.ObjectId().toString(),
        messageContent: "",
      };

      const context = { userId: testUser!.id };

      await sendMessageToGroupChatResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(CHAT_NOT_FOUND);
    }
  });

  it(`throws NotFoundError current user with _id === context.userId does not exist`, async () => {
    try {
      const args: MutationSendMessageToGroupChatArgs = {
        chatId: testGroupChat.id,
        messageContent: "",
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await sendMessageToGroupChatResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`throws UnauthorizedError if users field of groupChat with _id === args.chatId
  does not contain current user with _id === context.userId`, async () => {
    try {
      const args: MutationSendMessageToGroupChatArgs = {
        chatId: testGroupChat.id,
        messageContent: "",
      };

      const context = {
        userId: testUser!.id,
      };

      await sendMessageToGroupChatResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED);
    }
  });

  it(`creates the groupChatMessage and returns it`, async () => {
    await GroupChat.updateOne(
      {
        _id: testGroupChat._id,
      },
      {
        $push: {
          users: testUser!._id,
        },
      }
    );

    const args: MutationSendMessageToGroupChatArgs = {
      chatId: testGroupChat.id,
      messageContent: "messageContent",
    };

    const pubsub = {
      publish: (
        _action: "MESSAGE_SENT_TO_GROUP_CHAT",
        _payload: {
          messageSentToGroupChat: Interface_GroupChatMessage;
        }
      ) => {
        return;
      },
    };

    const context = {
      userId: testUser!.id,
      pubsub,
    };

    const sendMessageToGroupChatPayload =
      await sendMessageToGroupChatResolver?.({}, args, context);

    expect(sendMessageToGroupChatPayload).toEqual(
      expect.objectContaining({
        groupChatMessageBelongsTo: testGroupChat._id,
        sender: testUser!._id,
        messageContent: "messageContent",
      })
    );
  });
});
