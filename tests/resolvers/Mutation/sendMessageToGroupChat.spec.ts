import "dotenv/config";
import { Document, Types } from "mongoose";
import {
  Interface_User,
  User,
  Organization,
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
let testUser: Interface_User & Document<any, any, Interface_User>;
let testGroupChat: Interface_GroupChat &
  Document<any, any, Interface_GroupChat>;
import { nanoid } from "nanoid";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

beforeAll(async () => {
  await connect("TALAWA_TESING_DB");

  testUser = await User.create({
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
    visibleInSearch: true,
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

  testGroupChat = await GroupChat.create({
    title: "title",
    creator: testUser._id,
    organization: testOrganization._id,
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

      const context = { userId: testUser.id };

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
        userId: testUser.id,
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
          users: testUser._id,
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
      userId: testUser.id,
      pubsub,
    };

    const sendMessageToGroupChatPayload =
      await sendMessageToGroupChatResolver?.({}, args, context);

    expect(sendMessageToGroupChatPayload).toEqual(
      expect.objectContaining({
        groupChatMessageBelongsTo: testGroupChat._id,
        sender: testUser._id,
        messageContent: "messageContent",
      })
    );
  });
});
