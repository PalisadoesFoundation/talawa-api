import 'dotenv/config';
import { Document, Types } from 'mongoose';
import {
  Interface_User,
  User,
  Organization,
  DirectChat,
  Interface_DirectChat,
  Interface_DirectChatMessage,
} from '../../../lib/models';
import { MutationSendMessageToDirectChatArgs } from '../../../generated/graphQLTypescriptTypes';
import { connect, disconnect } from '../../../db';
import { sendMessageToDirectChat as sendMessageToDirectChatResolver } from '../../../lib/resolvers/Mutation/sendMessageToDirectChat';
import { CHAT_NOT_FOUND, USER_NOT_FOUND } from '../../../constants';
import { nanoid } from 'nanoid';

let testUsers: (Interface_User & Document<any, any, Interface_User>)[];
let testDirectChat: Interface_DirectChat &
  Document<any, any, Interface_DirectChat>;

beforeAll(async () => {
  await connect();

  testUsers = await User.insertMany([
    {
      email: `email${nanoid().toLowerCase()}@gmail.com`,
      password: 'password',
      firstName: 'firstName',
      lastName: 'lastName',
      appLanguageCode: 'en',
    },
    {
      email: `email${nanoid().toLowerCase()}@gmail.com`,
      password: 'password',
      firstName: 'firstName',
      lastName: 'lastName',
      appLanguageCode: 'en',
    },
  ]);

  const testOrganization = await Organization.create({
    name: 'name',
    description: 'description',
    isPublic: true,
    creator: testUsers[0]._id,
    admins: [testUsers[0]._id],
    members: [testUsers[0]._id],
    visibleInSearch: true,
  });

  await User.updateOne(
    {
      _id: testUsers[0]._id,
    },
    {
      $set: {
        createdOrganizations: [testOrganization._id],
        adminFor: [testOrganization._id],
        joinedOrganizations: [testOrganization._id],
      },
    }
  );

  testDirectChat = await DirectChat.create({
    title: 'title',
    creator: testUsers[0]._id,
    organization: testOrganization._id,
    users: [testUsers[0]._id, testUsers[1]._id],
  });
});

afterAll(async () => {
  await disconnect();
});

describe('resolvers -> Mutation -> sendMessageToDirectChat', () => {
  it(`throws NotFoundError if no directChat exists with _id === args.chatId`, async () => {
    try {
      const args: MutationSendMessageToDirectChatArgs = {
        chatId: Types.ObjectId().toString(),
        messageContent: '',
      };

      const context = { userId: testUsers[0].id };

      await sendMessageToDirectChatResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(CHAT_NOT_FOUND);
    }
  });

  it(`throws NotFoundError current user with _id === context.userId does not exist`, async () => {
    try {
      const args: MutationSendMessageToDirectChatArgs = {
        chatId: testDirectChat.id,
        messageContent: '',
      };

      const context = {
        userId: Types.ObjectId().toString(),
      };

      await sendMessageToDirectChatResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`creates the directChatMessage and returns it`, async () => {
    await DirectChat.updateOne(
      {
        _id: testDirectChat._id,
      },
      {
        $push: {
          users: testUsers[0]._id,
        },
      }
    );

    const args: MutationSendMessageToDirectChatArgs = {
      chatId: testDirectChat.id,
      messageContent: 'messageContent',
    };

    const pubsub = {
      publish: (
        action: 'MESSAGE_SENT_TO_DIRECT_CHAT',
        payload: {
          messageSentToDirectChat: Interface_DirectChatMessage;
        }
      ) => {
        return;
      },
    };

    const context = {
      userId: testUsers[0].id,
      pubsub,
    };

    const sendMessageToDirectChatPayload =
      await sendMessageToDirectChatResolver?.({}, args, context);

    expect(sendMessageToDirectChatPayload).toEqual(
      expect.objectContaining({
        directChatMessageBelongsTo: testDirectChat._id,
        sender: testUsers[0]._id,
        receiver: testUsers[1]._id,
        messageContent: 'messageContent',
      })
    );
  });
});
