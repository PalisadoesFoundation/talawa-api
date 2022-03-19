const createOrganization = require('../../../lib/resolvers/organization_mutations/createOrganization');
const createDirectChat = require('../../../lib/resolvers/direct_chat_mutations/createDirectChat');
const signup = require('../../../lib/resolvers/auth_mutations/signup');
const database = require('../../../db');
const shortid = require('shortid');

beforeAll(async () => {
  require('dotenv').config(); // pull env variables from .env file
  await database.connect();
});

afterAll(() => {
  database.disconnect();
});

describe('Unit testing', () => {
  test('Create Direct Chat Mutation', async () => {
    // SignUp the User
    let nameForNewUser = shortid.generate().toLowerCase();
    let email = `${nameForNewUser}@test.com`;
    let args = {
      data: {
        firstName: nameForNewUser,
        lastName: nameForNewUser,
        email: email,
        password: 'password',
      },
    };
    const signUpResponse = await signup({}, args);
    const name = shortid.generate().toLowerCase();
    const isPublic_boolean = Math.random() < 0.5;
    const visibleInSearch_boolean = Math.random() < 0.5;

    args = {
      data: {
        name: name,
        description: name,
        isPublic: isPublic_boolean,
        visibleInSearch: visibleInSearch_boolean,
        apiUrl: name,
      },
    };

    const context = {
      userId: signUpResponse.user._id.toString(),
    };

    const createOrgResponse = await createOrganization({}, args, context);
    // Creating Two Additional users for Chat

    nameForNewUser = shortid.generate().toLowerCase();
    email = `${nameForNewUser}@test.com`;
    args = {
      data: {
        firstName: nameForNewUser,
        lastName: nameForNewUser,
        email: email,
        password: 'password',
      },
    };
    const user1 = await signup({}, args);

    nameForNewUser = shortid.generate().toLowerCase();
    email = `${nameForNewUser}@test.com`;
    args = {
      data: {
        firstName: nameForNewUser,
        lastName: nameForNewUser,
        email: email,
        password: 'password',
      },
    };
    const user2 = await signup({}, args);

    args = {
      data: {
        organizationId: createOrgResponse._id.toString(),
        userIds: [user1.user._id.toString(), user2.user._id.toString()],
      },
    };

    const response = await createDirectChat({}, args, context);
    expect(response.creator).toEqual(
      expect.objectContaining({
        __v: 0,
        _id: signUpResponse.user._id,
        adminFor: [createOrgResponse._id.toString()],
        appLanguageCode: 'en',
        createdEvents: [],
        createdOrganizations: [createOrgResponse._id.toString()],
        email: signUpResponse.user.email,
        eventAdmin: [],
        firstName: signUpResponse.user.firstName,
        lastName: signUpResponse.user.lastName,
        membershipRequests: [],
        organizationUserBelongsTo: null,
        organizationsBlockedBy: [],
        image: null,
        joinedOrganizations: [createOrgResponse._id.toString()],
        pluginCreationAllowed: true,
        password: expect.any(String),
        registeredEvents: [],
        status: 'ACTIVE',
        tokenVersion: 0,
        userType: 'USER',
      })
    );
  });
});
