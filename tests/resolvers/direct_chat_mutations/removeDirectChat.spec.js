const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const shortid = require('shortid');
const database = require('../../../db');
const removeDirectChat = require('../../../lib/resolvers/direct_chat_mutations/removeDirectChat');
const User = require('../../../lib/models/User');
const Organization = require('../../../lib/models/Organization');
const DirectChat = require('../../../lib/models/DirectChat');

let testUser;

let testOrganization;

let testDirectChat;

const createUser = async () => {
  const email = `${shortid.generate().toLowerCase()}@test.com`;
  const hashedPassword = await bcrypt.hash('password', 12);

  const newUser = new User({
    email,
    password: hashedPassword,
    firstName: 'firstName',
    lastName: 'lastName',
    appLanguageCode: 'en',
    image: null,
  });

  const createdUser = await newUser.save();

  return createdUser;
};

const createOrganization = async (user) => {
  const name = `organization_${shortid.generate().toLowerCase()}`;

  const newOrganization = new Organization({
    name,
    description: 'description',
    isPublic: true,
    visibleInSearch: true,
    apiUrl: 'https://organization.org',
    image: null,
    creator: user,
    admins: [user],
    members: [user],
  });

  const createdOrganization = await newOrganization.save();

  await User.findOneAndUpdate(
    { _id: user.id },
    {
      $set: {
        joinedOrganizations: [
          ...user._doc.joinedOrganizations,
          createdOrganization,
        ],
        createdOrganizations: [
          ...user._doc.createdOrganizations,
          createdOrganization,
        ],
        adminFor: [...user._doc.adminFor, createdOrganization],
      },
    }
  );

  return createdOrganization;
};

const createDirectChat = async (user, users, organization) => {
  const newDirectChat = new DirectChat({
    creator: user,
    users,
    organization,
  });

  const createdDirectChat = await newDirectChat.save();

  return createdDirectChat;
};

// Read this :- https://jestjs.io/docs/api#beforeallfn-timeout
beforeAll(async () => {
  require('dotenv').config(); // pull env variables from .env file
  await database.connect(); // connect the database before running any test in this file's scope

  testUser = await createUser();

  testOrganization = await createOrganization(testUser);

  testDirectChat = await createDirectChat(
    testUser,
    [testUser],
    testOrganization
  );
});

// Read this :- https://jestjs.io/docs/api#afterallfn-timeout
afterAll(() => {
  database.disconnect(); // disconnect the database after running every test in this file's scope
});

// This test uses one user, one organization created by that user, one directChat created by that user.

describe('removeDirectChat mutation resolver', () => {
  test('if no organization is found for the provided args.organizationId, throws NotFoundError', async () => {
    const args = {
      organizationId: mongoose.Types.ObjectId(),
    };

    await expect(async () => {
      await removeDirectChat({}, args);
    }).rejects.toEqual(Error('Organization not found'));
  });

  test('if no directChat is found for the provided args.chatId, throws NotFoundError', async () => {
    const args = {
      chatId: mongoose.Types.ObjectId(),
      organizationId: testOrganization._id,
    };

    await expect(async () => {
      await removeDirectChat({}, args);
    }).rejects.toEqual(Error('Chat not found'));
  });

  test('if user with id=context.userId is not an admin of the organization with id=args.organizationId, throws UnauthorizedError', async () => {
    const args = {
      chatId: testDirectChat._id,
      organizationId: testOrganization._id,
    };

    const context = { userId: mongoose.Types.ObjectId() };

    await expect(async () => {
      await removeDirectChat({}, args, context);
    }).rejects.toEqual(Error('User not authorized'));
  });

  test('removes the directChat with id=args.chatId and returns the removed directChat', async () => {
    const args = {
      chatId: testDirectChat._id,
      organizationId: testOrganization._id,
    };

    const context = { userId: testUser._id };

    const result = await removeDirectChat({}, args, context);

    expect(result).toEqual(
      expect.objectContaining({
        users: expect.arrayContaining([testUser._id]),
        messages: expect.arrayContaining([]),
        status: testDirectChat.status,
        _id: testDirectChat._id,
        creator: testUser._id,
        organization: testOrganization._id,
        __v: 0,
      })
    );
  });
});
