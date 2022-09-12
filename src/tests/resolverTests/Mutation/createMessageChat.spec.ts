import 'dotenv/config';
import { Document, Types } from 'mongoose';
import {
  Interface_User,
  User,
  Interface_MessageChat,
} from '../../../lib/models';
import { MutationCreateMessageChatArgs } from '../../../generated/graphQLTypescriptTypes';
import { connect, disconnect } from '../../../db';
import { createMessageChat as createMessageChatResolver } from '../../../lib/resolvers/Mutation/createMessageChat';
import { USER_NOT_FOUND } from '../../../constants';
import { nanoid } from 'nanoid';

let testUsers: (Interface_User & Document<any, any, Interface_User>)[];

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
});

afterAll(async () => {
  await disconnect();
});

describe('resolvers -> Mutation -> createMessageChat', () => {
  it(`throws NotFoundError if no user exists with _id === args.data.receiver`, async () => {
    try {
      const args: MutationCreateMessageChatArgs = {
        data: {
          message: '',
          receiver: Types.ObjectId().toString(),
        },
      };

      const context = {
        userId: testUsers[0].id,
      };

      await createMessageChatResolver?.({}, args, context);
    } catch (error: any) {
      expect(error.message).toEqual(USER_NOT_FOUND);
    }
  });

  it(`creates the organization and returns it`, async () => {
    const args: MutationCreateMessageChatArgs = {
      data: {
        message: 'message',
        receiver: testUsers[1].id,
      },
    };

    const pubsub = {
      publish: (
        action: 'CHAT_CHANNEL',
        payload: {
          directMessageChat: Interface_MessageChat;
        }
      ) => {
        return;
      },
    };

    const context = {
      userId: testUsers[0].id,
      pubsub,
    };

    const createMessageChatPayload = await createMessageChatResolver?.(
      {},
      args,
      context
    );

    expect(createMessageChatPayload).toEqual(
      expect.objectContaining({
        sender: testUsers[0]._id,
        receiver: testUsers[1]._id,
        message: 'message',
        languageBarrier: false,
      })
    );
  });
});
