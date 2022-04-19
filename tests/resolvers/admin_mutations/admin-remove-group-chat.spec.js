const signup = require('../../../lib/resolvers/auth_mutations/signup');
const createOrganization = require('../../../lib/resolvers/organization_mutations/createOrganization');
const database = require('../../../db');
const shortid = require('shortid');
const mongoose = require('mongoose');
const adminRemoveGroupChat = require('../../../lib/resolvers/admin_mutations/admin-remove-group-chat');
const createGroupChat = require('../../../lib/resolvers/group_chat_mutations/createGroupChat');

beforeAll(async () => {
  require('dotenv').config(); // pull env variables from .env file
  await database.connect();
});

afterAll(() => {
  database.disconnect();
});

describe('Unit testing', () => {
  test('Admin Remove Group Chat Mutation without existing GroupChat', async () => {
    const args = {
      groupId: mongoose.Types.ObjectId(),
    };

    const context = {
      userId: mongoose.Types.ObjectId(),
    };

    await expect(async () => {
      await adminRemoveGroupChat({}, args, context);
    }).rejects.toEqual(Error('Group not found'));
  });

  test('Admin Remove Group Chat Mutation without User', async () => {
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

    // SignUp another User for
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
    const newUserSignUpResponse = await signup({}, args);

    const name = shortid.generate().toLowerCase();
    const isPublic_boolean = true;
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
        title: 'title',
        organizationId: createOrgResponse._id,
        userIds: [signUpResponse.user._id, newUserSignUpResponse.user._id],
      },
    };

    const createGroupChatResponse = await createGroupChat({}, args, context);

    args = {
      groupId: createGroupChatResponse._id.toString(),
    };

    context = {
      userId: mongoose.Types.ObjectId(),
    };

    await expect(async () => {
      await adminRemoveGroupChat({}, args, context);
    }).rejects.toEqual(Error('User not found'));
  });

  test('Admin Remove Group Chat Mutation', async () => {
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

    // SignUp another User for
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
    const newUserSignUpResponse = await signup({}, args);

    const name = shortid.generate().toLowerCase();
    const isPublic_boolean = true;
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

    args = {
      data: {
        title: 'title',
        organizationId: createOrgResponse._id,
        userIds: [signUpResponse.user._id, newUserSignUpResponse.user._id],
      },
    };

    const createGroupChatResponse = await createGroupChat({}, args, context);

    args = {
      groupId: createGroupChatResponse._id.toString(),
    };

    const adminRemoveGroupChatResponse = await adminRemoveGroupChat(
      {},
      args,
      context
    );

    expect(adminRemoveGroupChatResponse.title).toEqual('title');
  });
});
