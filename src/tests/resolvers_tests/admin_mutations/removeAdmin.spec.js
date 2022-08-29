const signup = require('../../../lib/resolvers/auth_mutations/signup');
const createOrganization = require('../../../lib/resolvers/organization_mutations/createOrganization');
const database = require('../../../db');
const shortid = require('shortid');
const mongoose = require('mongoose');
const createAdmin = require('../../../lib/resolvers/admin_mutations/createAdmin');
const removeAdmin = require('../../../lib/resolvers/admin_mutations/removeAdmin');
const joinPublicOrganization = require('../../../lib/resolvers/member_mutations/join_public_organization');
const {
  USER_NOT_FOUND,
  USER_NOT_AUTHORIZED,
  ORGANIZATION_NOT_FOUND,
} = require('../../../constants');

beforeAll(async () => {
  require('dotenv').config(); // pull env variables from .env file
  await database.connect();
});

afterAll(() => {
  database.disconnect();
});

describe('Unit testing', () => {
  test('Remove Admin Mutation without Existing Organization', async () => {
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
      data: {
        organizationId: mongoose.Types.ObjectId(),
        userId: signUpResponse.user._id,
      },
    };

    await expect(async () => {
      await removeAdmin({}, args, context);
    }).rejects.toEqual(Error(ORGANIZATION_NOT_FOUND));
  });

  test('Remove Admin Mutation without Existing User', async () => {
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

    args = {
      data: {
        organizationId: createOrgResponse._id,
        userId: mongoose.Types.ObjectId(),
      },
    };

    await expect(async () => {
      await removeAdmin({}, args, context);
    }).rejects.toEqual(Error(USER_NOT_FOUND));
  });

  test('Remove Admin Mutation without User being an Admin', async () => {
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

    // SignUp a new User (without Admin Role)
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

    args = {
      data: {
        organizationId: createOrgResponse._id,
        userId: newUserSignUpResponse.user._id.toString(),
      },
    };

    await expect(async () => {
      await removeAdmin({}, args, context);
    }).rejects.toEqual(Error(USER_NOT_AUTHORIZED));
  });

  test('Remove Admin Mutation when user is the creator of the organization', async () => {
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

    args = {
      data: {
        organizationId: createOrgResponse._id,
        userId: signUpResponse.user._id,
      },
    };
    const removeAdminResponse = await removeAdmin({}, args, context);

    expect(removeAdminResponse.tokenVersion).toEqual(0);
    expect(removeAdminResponse.appLanguageCode).toEqual('en');
    expect(removeAdminResponse.createdOrganizations).toHaveLength(1);
    expect(removeAdminResponse.createdEvents).toEqual([]);
    expect(removeAdminResponse.userType).toEqual('USER');
    expect(removeAdminResponse.registeredEvents).toEqual([]);
    expect(removeAdminResponse.eventAdmin).toEqual([]);
    expect(removeAdminResponse.membershipRequests).toEqual([]);
    expect(removeAdminResponse.organizationsBlockedBy).toEqual([]);
    expect(removeAdminResponse.status).toEqual('ACTIVE');
    expect(removeAdminResponse.pluginCreationAllowed).toEqual(true);
    expect(removeAdminResponse.firstName).toEqual(nameForNewUser);
    expect(removeAdminResponse.lastName).toEqual(nameForNewUser);
    expect(removeAdminResponse.email).toEqual(email);
    expect(removeAdminResponse.password).toEqual(null);
    expect(removeAdminResponse.organizationUserBelongsTo).toEqual(null);
    expect(removeAdminResponse.image).toEqual(null);
  });

  test('Remove Admin Mutation', async () => {
    // SignUp the User for Creating an Organization
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

    // SignUp a new User for making a new admin into the organization
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

    const newUsersignUpResponse = await signup({}, args);

    args = {
      organizationId: createOrgResponse._id,
    };

    context = {
      userId: newUsersignUpResponse.user._id,
    };

    // New User joining into the organization for being an admin
    await joinPublicOrganization({}, args, context);

    args = {
      data: {
        organizationId: createOrgResponse._id,
        userId: newUsersignUpResponse.user._id,
      },
    };

    context = {
      userId: signUpResponse.user._id.toString(),
    };

    // To remove an Admin, first the user needs to be an Admin
    await createAdmin({}, args, context);

    const removeAdminResponse = await removeAdmin({}, args, context);

    expect(removeAdminResponse.tokenVersion).toEqual(0);
    expect(removeAdminResponse.appLanguageCode).toEqual('en');
    expect(removeAdminResponse.createdOrganizations).toEqual([]);
    expect(removeAdminResponse.createdEvents).toEqual([]);
    expect(removeAdminResponse.userType).toEqual('USER');
    expect(removeAdminResponse.registeredEvents).toEqual([]);
    expect(removeAdminResponse.eventAdmin).toEqual([]);
    expect(removeAdminResponse.membershipRequests).toEqual([]);
    expect(removeAdminResponse.organizationsBlockedBy).toEqual([]);
    expect(removeAdminResponse.status).toEqual('ACTIVE');
    expect(removeAdminResponse.pluginCreationAllowed).toEqual(true);
    expect(removeAdminResponse.firstName).toEqual(nameForNewUser);
    expect(removeAdminResponse.lastName).toEqual(nameForNewUser);
    expect(removeAdminResponse.email).toEqual(email);
    expect(removeAdminResponse.password).toEqual(null);
    expect(removeAdminResponse.organizationUserBelongsTo).toEqual(null);
    expect(removeAdminResponse.image).toEqual(null);
  });
});
