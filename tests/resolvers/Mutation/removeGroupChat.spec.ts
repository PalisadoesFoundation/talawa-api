import "dotenv/config";
import { Types } from "mongoose";
import { Organization, GroupChat, GroupChatMessage } from "../../../src/models";
import { MutationRemoveGroupChatArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { removeGroupChat as removeGroupChatResolver } from "../../../src/resolvers/Mutation/removeGroupChat";
import {
  CHAT_NOT_FOUND,
  ORGANIZATION_NOT_FOUND,
  USER_NOT_AUTHORIZED,
} from "../../../src/constants";
import { beforeAll, afterAll, describe, it, expect } from "vitest";
import { testOrganizationType, testUserType } from "../../helpers/userAndOrg";
import {
  createTestGroupChatMessage,
  testGroupChatType,
} from "../../helpers/groupChat";

let testUser: testUserType;
let testOrganization: testOrganizationType;
let testGroupChat: testGroupChatType;

beforeAll(async () => {
  await connect();
  const temp = await createTestGroupChatMessage();
  testUser = temp[0];
  testOrganization = temp[1];
  testGroupChat = temp[2];
  const testGroupChatMessage = temp[3];
  testGroupChat = await GroupChat.findOneAndUpdate(
    {
      _id: testGroupChat!._id,
    },
    {
      $push: {
        messages: testGroupChatMessage!._id,
      },
    },
    {
      new: true,
    }
  );
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Mutation -> removeGroupChat", () => {
  it(`throws NotFoundError if no groupChat exists with _id === args.chatId`, async () => {
    try {
      const args: MutationRemoveGroupChatArgs = {
        chatId: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser!.id,
      };

      await removeGroupChatResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(CHAT_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if no organization exists with _id === groupChat.organization
  for field organization of groupChat with _id === args.chatId`, async () => {
    try {
      await GroupChat.updateOne(
        {
          _id: testGroupChat!._id,
        },
        {
          $set: {
            organization: Types.ObjectId().toString(),
          },
        }
      );

      const args: MutationRemoveGroupChatArgs = {
        chatId: testGroupChat!.id,
      };

      const context = {
        userId: testUser!.id,
      };

      await removeGroupChatResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND);
    }
  });

  it(`throws UnauthorizedError if current user with _id === context.userId is
  not an admin of organization with _id === groupChat.organization for groupChat
  with _id === args.chatId`, async () => {
    try {
      await GroupChat.updateOne(
        {
          _id: testGroupChat!._id,
        },
        {
          $set: {
            organization: testOrganization!._id,
          },
        }
      );

      await Organization.updateOne(
        {
          _id: testOrganization!._id,
        },
        {
          $set: {
            admins: [],
          },
        }
      );

      const args: MutationRemoveGroupChatArgs = {
        chatId: testGroupChat!.id,
      };

      const context = {
        userId: testUser!.id,
      };

      await removeGroupChatResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED);
    }
  });

  it(`deletes the groupChat with _id === args.chatId and all groupChatMessages
  associated to it and returns it`, async () => {
    await Organization.updateOne(
      {
        _id: testOrganization!._id,
      },
      {
        $push: {
          admins: testUser!._id,
        },
      }
    );

    const args: MutationRemoveGroupChatArgs = {
      chatId: testGroupChat!.id,
    };

    const context = {
      userId: testUser!.id,
    };

    const removeGroupChatPayload = await removeGroupChatResolver?.(
      {},
      args,
      context
    );

    expect(removeGroupChatPayload).toEqual(testGroupChat!.toObject());

    const testDeletedGroupChatMessages = await GroupChatMessage.find({
      groupChatMessageBelongsTo: testGroupChat!._id,
    }).lean();

    expect(testDeletedGroupChatMessages).toEqual([]);
  });
});
