import "dotenv/config";
import { Document, Types } from "mongoose";
import {
  Interface_User,
  User,
  Organization,
  Interface_Organization,
  GroupChat,
  Interface_GroupChat,
  GroupChatMessage,
} from "../../../src/lib/models";
import { MutationRemoveGroupChatArgs } from "../../../src/generated/graphqlCodegen";
import { connect, disconnect } from "../../../src/db";
import { removeGroupChat as removeGroupChatResolver } from "../../../src/lib/resolvers/Mutation/removeGroupChat";
import {
  CHAT_NOT_FOUND,
  ORGANIZATION_NOT_FOUND,
  USER_NOT_AUTHORIZED,
} from "../../../src/constants";
import { nanoid } from "nanoid";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

let testUser: Interface_User & Document<any, any, Interface_User>;
let testOrganization: Interface_Organization &
  Document<any, any, Interface_Organization>;
let testGroupChat:
  | (Interface_GroupChat & Document<any, any, Interface_GroupChat>)
  | null;

beforeAll(async () => {
  await connect();

  testUser = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: "password",
    firstName: "firstName",
    lastName: "lastName",
    appLanguageCode: "en",
  });

  testOrganization = await Organization.create({
    name: "name",
    description: "description",
    isPublic: true,
    creator: testUser._id,
    admins: [testUser._id],
    members: [testUser._id],
  });

  await User.updateOne(
    {
      _id: testUser._id,
    },
    {
      $push: {
        createdOrganizations: testOrganization._id,
        adminFor: testOrganization._id,
        joinedOrganizations: testOrganization._id,
      },
    }
  );

  testGroupChat = await GroupChat.create({
    title: "title",
    users: [testUser._id],
    creator: testUser._id,
    organization: testOrganization._id,
  });

  const testGroupChatMessage = await GroupChatMessage.create({
    groupChatMessageBelongsTo: testGroupChat._id,
    sender: testUser._id,
    createdAt: new Date(),
    messageContent: "messageContent",
  });

  testGroupChat = await GroupChat.findOneAndUpdate(
    {
      _id: testGroupChat._id,
    },
    {
      $push: {
        messages: testGroupChatMessage._id,
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
        userId: testUser.id,
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
        userId: testUser.id,
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
            organization: testOrganization._id,
          },
        }
      );

      await Organization.updateOne(
        {
          _id: testOrganization._id,
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
        userId: testUser.id,
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
        _id: testOrganization._id,
      },
      {
        $push: {
          admins: testUser._id,
        },
      }
    );

    const args: MutationRemoveGroupChatArgs = {
      chatId: testGroupChat!.id,
    };

    const context = {
      userId: testUser.id,
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
