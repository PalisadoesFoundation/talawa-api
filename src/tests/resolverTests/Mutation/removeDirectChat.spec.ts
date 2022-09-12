import 'dotenv/config';
import { Document, Types } from 'mongoose';
import {
  Interface_User,
  User,
  Organization,
  Interface_Organization,
  Interface_DirectChat,
  DirectChat,
  DirectChatMessage,
} from '../../../lib/models';
import { MutationRemoveDirectChatArgs } from '../../../generated/graphQLTypescriptTypes';
import { connect, disconnect } from '../../../db';
import { removeDirectChat as removeDirectChatResolver } from '../../../lib/resolvers/Mutation/removeDirectChat';
import {
  CHAT_NOT_FOUND,
  ORGANIZATION_NOT_FOUND,
  USER_NOT_AUTHORIZED,
} from '../../../constants';
import { nanoid } from 'nanoid';

let testUser: Interface_User & Document<any, any, Interface_User>;
let testOrganization: Interface_Organization &
  Document<any, any, Interface_Organization>;
let testDirectChat:
  | (Interface_DirectChat & Document<any, any, Interface_DirectChat>)
  | null;

beforeAll(async () => {
  await connect();

  testUser = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: 'password',
    firstName: 'firstName',
    lastName: 'lastName',
    appLanguageCode: 'en',
  });

  testOrganization = await Organization.create({
    name: 'name',
    description: 'description',
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

  testDirectChat = await DirectChat.create({
    users: [testUser._id],
    creator: testUser._id,
    organization: testOrganization._id,
  });

  const testDirectChatMessage = await DirectChatMessage.create({
    directChatMessageBelongsTo: testDirectChat._id,
    sender: testUser._id,
    receiver: testUser._id,
    messageContent: 'messageContent',
    createdAt: new Date(),
  });

  testDirectChat = await DirectChat.findOneAndUpdate(
    {
      _id: testDirectChat._id,
    },
    {
      $push: {
        messages: testDirectChatMessage._id,
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

describe('resolvers -> Mutation -> removeDirectChat', () => {
  it(`throws NotFoundError if no organization exists with _id === args.organizationId`, async () => {
    try {
      const args: MutationRemoveDirectChatArgs = {
        chatId: '',
        organizationId: Types.ObjectId().toString(),
      };

      const context = {
        userId: testUser.id,
      };

      await removeDirectChatResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(ORGANIZATION_NOT_FOUND);
    }
  });

  it(`throws NotFoundError if no directChat exists with _id === args.chatId`, async () => {
    try {
      const args: MutationRemoveDirectChatArgs = {
        chatId: Types.ObjectId().toString(),
        organizationId: testOrganization.id,
      };

      const context = {
        userId: testUser.id,
      };

      await removeDirectChatResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(CHAT_NOT_FOUND);
    }
  });

  it(`throws UnauthorizedError if user with _id === context.userId is not an admin
  of organization with _id === args.organizationId`, async () => {
    try {
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

      const args: MutationRemoveDirectChatArgs = {
        chatId: testDirectChat!.id,
        organizationId: testOrganization.id,
      };

      const context = {
        userId: testUser.id,
      };

      await removeDirectChatResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_AUTHORIZED);
    }
  });

  it(`deletes the directChat with _id === args.chatId`, async () => {
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

    const args: MutationRemoveDirectChatArgs = {
      chatId: testDirectChat!.id,
      organizationId: testOrganization.id,
    };

    const context = {
      userId: testUser.id,
    };

    const removeDirectChatPayload = await removeDirectChatResolver?.(
      {},
      args,
      context
    );

    expect(removeDirectChatPayload).toEqual(testDirectChat?.toObject());

    const testDeletedDirectChatMessages = await DirectChatMessage.find({
      directChatMessageBelongsTo: testDirectChat!._id,
    }).lean();

    expect(testDeletedDirectChatMessages).toEqual([]);
  });
});
