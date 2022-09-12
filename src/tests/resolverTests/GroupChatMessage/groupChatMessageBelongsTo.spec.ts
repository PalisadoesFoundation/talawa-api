import 'dotenv/config';
import { groupChatMessageBelongsTo as groupChatMessageBelongsToResolver } from '../../../lib/resolvers/GroupChatMessage/groupChatMessageBelongsTo';
import { connect, disconnect } from '../../../db';
import {
  User,
  Organization,
  Interface_GroupChatMessage,
  GroupChat,
  GroupChatMessage,
} from '../../../lib/models';
import { Document } from 'mongoose';
import { nanoid } from 'nanoid';

let testGroupChatMessage: Interface_GroupChatMessage &
  Document<any, any, Interface_GroupChatMessage>;

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

  const testGroupChat = await GroupChat.create({
    creator: testUser._id,
    users: [testUser._id],
    organization: testOrganization._id,
    title: 'title',
  });

  testGroupChatMessage = await GroupChatMessage.create({
    groupChatMessageBelongsTo: testGroupChat._id,
    sender: testUser._id,
    createdAt: new Date(),
    messageContent: 'messageContent',
  });
});

afterAll(async () => {
  await disconnect();
});

describe('resolvers -> GroupChatMessage -> groupChatMessageBelongsTo', () => {
  it(`returns groupChatMessageBelongsTo object for parent.groupChatMessageBelongsTo`, async () => {
    const parent = testGroupChatMessage.toObject();

    const groupChatMessageBelongsToPayload =
      await groupChatMessageBelongsToResolver?.(parent, {}, {});

    const groupChatMessageBelongsTo = await GroupChat.findOne({
      _id: testGroupChatMessage.groupChatMessageBelongsTo,
    }).lean();

    expect(groupChatMessageBelongsToPayload).toEqual(groupChatMessageBelongsTo);
  });
});
