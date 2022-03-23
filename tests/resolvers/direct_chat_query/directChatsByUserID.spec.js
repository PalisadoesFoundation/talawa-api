const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const shortid = require('shortid');
const database = require('../../../db');
const directChatsByUserID = require('../../../lib/resolvers/direct_chat_query/directChatsByUserID');
const User = require('../../../lib/models/User');
const Organization = require('../../../lib/models/Organization');
const DirectChat = require('../../../lib/models/DirectChat');

let testUser1;
let testUser2;

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

  testUser1 = await createUser();
  testUser2 = await createUser();

  testOrganization = await createOrganization(testUser1);

  testDirectChat = await createDirectChat(
    testUser1,
    [testUser1, testUser2],
    testOrganization
  );
});

// Read this :- https://jestjs.io/docs/api#afterallfn-timeout
afterAll(() => {
  database.disconnect(); // disconnect the database after running every test in this file's scope
});

/* This test uses two users, one organization created by one of created users, one directChat created by the same user who owns the created organization.
   In the first test it tests the resolver for a randomly generated userId.
   In the second test it tests the resolver to return an array with exactly one directChat object(the directChat object created for this test) for the id
   of testUser1.*/

describe('directChatsByUserID query resolver', () => {
  test('returns an empty list if no directChats are found for the provided args.id', async () => {
    // Random id to pass as the user's id.
    const args = { id: mongoose.Types.ObjectId() };

    const result = await directChatsByUserID({}, args);

    expect(result).toEqual([]);
  });

  test('returns an array of all the directChats found for the provided args.id', async () => {
    // Passing id of the user was created for this test.
    let args = { id: testUser1.id };

    let result = await directChatsByUserID({}, args);

    expect(result).toHaveLength(1);

    expect(result).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          users: expect.arrayContaining([testUser1._id, testUser2._id]),
          messages: expect.arrayContaining([]),
          status: 'ACTIVE',
          _id: testDirectChat._id,
          creator: testUser1._id,
          organization: testOrganization._id,
          __v: 0,
        }),
      ])
    );
  });
});
