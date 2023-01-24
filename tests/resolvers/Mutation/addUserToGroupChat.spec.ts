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
} from "../../../src/models";
import { MutationAddUserToGroupChatArgs } from "../../../src/types/generatedGraphQLTypes";
import { connect, disconnect } from "../../../src/db";
import { addUserToGroupChat as addUserToGroupChatResolver } from "../../../src/resolvers/Mutation/addUserToGroupChat";
import {
  CHAT_NOT_FOUND,
  ORGANIZATION_NOT_FOUND,
  USER_ALREADY_MEMBER,
  USER_NOT_AUTHORIZED,
  USER_NOT_FOUND,
} from "../../../src/constants";
import { nanoid } from "nanoid";
import { beforeAll, afterAll, describe, it, expect } from "vitest";

let testUser: Interface_User & Document<any, any, Interface_User>;
let testOrganization: Interface_Organization &
  Document<any, any, Interface_Organization>;
let testGroupChat: Interface_GroupChat &
  Document<any, any, Interface_GroupChat>;

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
});

afterAll(async () => {
  await disconnect();
});

describe("resolvers -> Mutation -> addUserToGroupChat", () => {
  it(`throws NotFoundError if no groupChat exists with _id === args.chatId`, async () => {
    try {
      const args: MutationAddUserToGroupChatArgs = {
        chatId: Types.ObjectId().toString(),
        userId: testUser.id,
      };

      const context = {
        userId: testUser.id,
      };

      await addUserToGroupChatResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(CHAT_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if no organization exists with _id === groupChat.organization
  for groupChat with _id === args.chatId`, async () => {
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

      const args: MutationAddUserToGroupChatArgs = {
        chatId: testGroupChat.id,
        userId: testUser.id,
      };

      const context = {
        userId: testUser.id,
      };

      await addUserToGroupChatResolver?.({}, args, context);
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

      const args: MutationAddUserToGroupChatArgs = {
        chatId: testGroupChat.id,
        userId: testUser.id,
      };

      const context = {
        userId: testUser.id,
      };

      await addUserToGroupChatResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED);
    }
  });

  it(`throws NotFoundError if no user exists with _id === args.userId`, async () => {
    try {
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

      const args: MutationAddUserToGroupChatArgs = {
        chatId: testGroupChat.id,
        userId: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser.id,
      };

      await addUserToGroupChatResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`throws ConflictError if user with _id === args.userId is already a member 
  of groupChat with _id === args.chatId`, async () => {
    try {
      const args: MutationAddUserToGroupChatArgs = {
        chatId: testGroupChat.id,
        userId: testUser.id,
      };

      const context = {
        userId: testUser.id,
      };

      await addUserToGroupChatResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_ALREADY_MEMBER);
    }
  });

  it(`deletes the groupChat with _id === args.chatId and returns it`, async () => {
    await GroupChat.updateOne(
      {
        _id: testGroupChat._id,
      },
      {
        $set: {
          users: [],
        },
      }
    );

    const args: MutationAddUserToGroupChatArgs = {
      chatId: testGroupChat.id,
      userId: testUser.id,
    };

    const context = {
      userId: testUser.id,
    };

    const addUserToGroupChatPayload = await addUserToGroupChatResolver?.(
      {},
      args,
      context
    );

    expect(addUserToGroupChatPayload).toEqual(testGroupChat!.toObject());

    const testDeletedGroupChatMessages = await GroupChatMessage.find({
      groupChatMessageBelongsTo: testGroupChat!._id,
    }).lean();

    expect(testDeletedGroupChatMessages).toEqual([]);
  });
});
