const createOrganization = require('../../../lib/resolvers/organization_mutations/createOrganization');
const createDirectChat = require('../../../lib/resolvers/direct_chat_mutations/createDirectChat');
const signup = require('../../../lib/resolvers/auth_mutations/signup');
const database = require('../../../db');
const shortid = require('shortid');
const mongoose = require('mongoose');

beforeAll(async () => {
  require('dotenv').config(); // pull env variables from .env file
  await database.connect();
});

afterAll(() => {
  database.disconnect();
});

describe('Unit testing', () => {
  test('Create Direct Chat Mutation without User', async () => {
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

    let context = {
      userId: signUpResponse.user._id.toString(),
    };

    const createOrgResponse = await createOrganization({}, args, context);

    args = {
      data: {
        organizationId: createOrgResponse._id.toString(),
        userIds: [],
      },
    };

    // Removed User from Context with random ObjectID to check Line 11 in Unit Test
    context = {
      userId: mongoose.Types.ObjectId(),
    };

    await expect(async () => {
      await createDirectChat({}, args, context);
    }).rejects.toEqual(Error('User not found'));
  });

  test('Create Direct Chat Mutation without Organization', async () => {
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

    const context = {
      userId: signUpResponse.user._id.toString(),
    };

    // Organization is removed in the args to check Line 21 in Unit Test
    args = {
      data: {
        organizationId: mongoose.Types.ObjectId(),
        userIds: [],
      },
    };

    await expect(async () => {
      await createDirectChat({}, args, context);
    }).rejects.toEqual(Error('Organization not Found'));
  });

  test('Create Direct Chat Mutation without Chat Users', async () => {
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

    // Removed Users of chat with Random ObjectID to check Line 36 in Unit Test
    args = {
      data: {
        organizationId: createOrgResponse._id.toString(),
        userIds: [mongoose.Types.ObjectId(), mongoose.Types.ObjectId()],
      },
    };
    await expect(async () => {
      await createDirectChat({}, args, context);
    }).rejects.toEqual(Error('User not found'));
  });

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

    response.users.map((user) => {
      expect(user.tokenVersion).toEqual(0);
      expect(user.appLanguageCode).toEqual('en');
      expect(user.createdOrganizations).toEqual([]);
      expect(user.createdEvents).toEqual([]);
      expect(user.userType).toEqual('USER');
      expect(user.joinedOrganizations).toEqual([]);
      expect(user.registeredEvents).toEqual([]);
      expect(user.eventAdmin).toEqual([]);
      expect(user.adminFor).toEqual([]);
      expect(user.membershipRequests).toEqual([]);
      expect(user.organizationsBlockedBy).toEqual([]);
      expect(user.status).toEqual('ACTIVE');
      expect(user.pluginCreationAllowed).toEqual(true);
      expect(user.organizationUserBelongsTo).toEqual(null);
    });
    expect(response.messages).toEqual([]);
    expect(response.status).toEqual('ACTIVE');
  });
});
