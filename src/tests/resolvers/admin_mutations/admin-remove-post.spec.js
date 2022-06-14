const signup = require('../../../lib/resolvers/auth_mutations/signup');
const createOrganization = require('../../../lib/resolvers/organization_mutations/createOrganization');
const database = require('../../../db');
const shortid = require('shortid');
const mongoose = require('mongoose');
const adminRemovePost = require('../../../lib/resolvers/admin_mutations/admin-remove-post');
const createPost = require('../../../lib/resolvers/post_mutations/createPost');

beforeAll(async () => {
  require('dotenv').config(); // pull env variables from .env file
  await database.connect();
});

afterAll(() => {
  database.disconnect();
});

describe('Unit testing', () => {
  test('Admin Remove Post Mutation without Existing Post', async () => {
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
      postId: mongoose.Types.ObjectId(),
      organizationId: createOrgResponse._id,
    };

    await expect(async () => {
      await adminRemovePost({}, args, context);
    }).rejects.toEqual(Error('Post not found'));
  });

  test('Admin Remove Post Mutation without Existing Organization', async () => {
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

    args = {
      organizationId: mongoose.Types.ObjectId(),
    };

    await expect(async () => {
      await adminRemovePost({}, args, context);
    }).rejects.toEqual(Error('Organization not found'));
  });

  test('Admin Remove Post Mutation without User', async () => {
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
      organizationId: createOrgResponse._id,
      postId: mongoose.Types.ObjectId(),
    };

    context = {
      userId: mongoose.Types.ObjectId(),
    };

    await expect(async () => {
      await adminRemovePost({}, args, context);
    }).rejects.toEqual(Error('User not found'));
  });

  test('Admin Remove Post Mutation', async () => {
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
        organizationId: createOrgResponse._id,
        text: 'assa',
        title: 'assa',
      },
    };

    const createPostResponse = await createPost({}, args, context);

    args = {
      organizationId: createOrgResponse._id,
      postId: createPostResponse._id,
    };

    const adminRemovePostResponse = await adminRemovePost({}, args, context);

    expect(adminRemovePostResponse.title).toEqual('assa');
  });
});
