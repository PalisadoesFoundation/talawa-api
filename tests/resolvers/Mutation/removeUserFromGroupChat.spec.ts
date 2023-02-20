import "dotenv/config";
import { Types } from "mongoose";
import { User, Organization, GroupChat } from "../../../src/models";
import { MutationRemoveUserFromGroupChatArgs } from "../../../src/types/generatedGraphQLTypes";
import {
  connect,
  disconnect,
  dropAllCollectionsFromDatabase,
} from "../../helpers/db";
import mongoose from "mongoose";
import { removeUserFromGroupChat as removeUserFromGroupChatResolver } from "../../../src/resolvers/Mutation/removeUserFromGroupChat";
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

let MONGOOSE_INSTANCE: typeof mongoose | null;
let testUser: testUserType;
let testOrganization: testOrganizationType;
let testGroupChat: testGroupChatType;

beforeAll(async () => {
  MONGOOSE_INSTANCE = await connect();
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE!);
  const temp = await createTestGroupChatMessage();
  testUser = temp[0];
  testOrganization = temp[1];
  testGroupChat = temp[2];
});

afterAll(async () => {
  await dropAllCollectionsFromDatabase(MONGOOSE_INSTANCE!);
  await disconnect(MONGOOSE_INSTANCE!);
});

describe("resolvers -> Mutation -> removeUserFromGroupChat", () => {
  it(`throws NotFoundError if no groupChat exists with _id === args.chatId`, async () => {
    try {
      const args: MutationRemoveUserFromGroupChatArgs = {
        chatId: Types.ObjectId().toString(),
        userId: "",
      };

      const context = {
        userId: testUser!.id,
      };

      await removeUserFromGroupChatResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(CHAT_NOT_FOUND);
    }
  });

  it(`throws UnauthorizedError if current user with _id === context.userId is not
    an admin of the organization of groupChat with _id === args.chatId`, async () => {
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

      const args: MutationRemoveUserFromGroupChatArgs = {
        chatId: testGroupChat!.id,
        userId: "",
      };

      const context = {
        userId: testUser!.id,
      };

      await removeUserFromGroupChatResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED);
    }
  });

  it(`throws UnauthorizedError if users field of groupChat with _id === args.chatId
    does not contain user with _id === args.userId`, async () => {
    try {
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

      await User.updateOne(
        {
          _id: testUser!._id,
        },
        {
          $push: {
            adminFor: testOrganization!._id,
          },
        }
      );

      const args: MutationRemoveUserFromGroupChatArgs = {
        chatId: testGroupChat!.id,
        userId: "",
      };

      const context = {
        userId: testUser!.id,
      };

      await removeUserFromGroupChatResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED);
    }
  });

  it(`removes user with _id === args.userId from users list field of groupChat
    with _id === args.ChatId and returns the updated groupChat`, async () => {
    await GroupChat.updateOne(
      {
        _id: testGroupChat!._id,
      },
      {
        $push: {
          users: testUser!._id,
        },
      }
    );

    const args: MutationRemoveUserFromGroupChatArgs = {
      chatId: testGroupChat!.id,
      userId: testUser!.id,
    };

    const context = {
      userId: testUser!.id,
    };

    const removeUserFromGroupChatPayload =
      await removeUserFromGroupChatResolver?.({}, args, context);

    const testRemoveUserFromGroupChatPayload = await GroupChat.findOne({
      _id: testGroupChat!._id,
    }).lean();

    expect(removeUserFromGroupChatPayload).toEqual(
      testRemoveUserFromGroupChatPayload
    );
  });

  it(`throws NotFoundError if no organization exists for groupChat with _id === args.chatId`, async () => {
    await Organization.findOneAndRemove({
      _id: testOrganization!._id,
    });

    try {
      const args: MutationRemoveUserFromGroupChatArgs = {
        chatId: testGroupChat!.id,
        userId: "",
      };

      const context = {
        userId: testUser!.id,
      };

      await removeUserFromGroupChatResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND);
    }
  });
});
