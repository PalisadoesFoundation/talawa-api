import 'dotenv/config';
import { directChatMessageBelongsTo as directChatMessageBelongsToResolver } from '../../../lib/resolvers/DirectChatMessage/directChatMessageBelongsTo';
import { connect, disconnect } from '../../../db';
import {
  User,
  Organization,
  Interface_DirectChatMessage,
  DirectChat,
  DirectChatMessage,
} from '../../../lib/models';
import { Document } from 'mongoose';
import { nanoid } from 'nanoid';

let testDirectChatMessage: Interface_DirectChatMessage &
  Document<any, any, Interface_DirectChatMessage>;

beforeAll(async () => {
  await connect();

  const testUser = await User.create({
    email: `email${nanoid().toLowerCase()}@gmail.com`,
    password: 'password',
    firstName: 'firstName',
    lastName: 'lastName',
    appLanguageCode: 'en',
  });

  const testOrganization = await Organization.create({
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

  const testDirectChat = await DirectChat.create({
    creator: testUser._id,
    users: [testUser._id],
    organization: testOrganization._id,
    title: 'title',
  });

  testDirectChatMessage = await DirectChatMessage.create({
    directChatMessageBelongsTo: testDirectChat._id,
    sender: testUser._id,
    receiver: testUser._id,
    createdAt: new Date(),
    messageContent: 'messageContent',
  });
});

afterAll(async () => {
  await disconnect();
});

describe('resolvers -> DirectChatMessage -> directChatMessageBelongsTo', () => {
  it(`returns directChat object for parent.directChatMessageBelongsTo`, async () => {
    const parent = testDirectChatMessage.toObject();

    const directChatMessageBelongsToPayload =
      await directChatMessageBelongsToResolver?.(parent, {}, {});

    const directChatMessageBelongsTo = await DirectChat.findOne({
      _id: testDirectChatMessage.directChatMessageBelongsTo,
    }).lean();

    expect(directChatMessageBelongsToPayload).toEqual(
      directChatMessageBelongsTo
    );
  });
});
