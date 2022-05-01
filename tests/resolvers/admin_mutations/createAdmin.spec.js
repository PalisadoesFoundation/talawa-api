const signup = require('../../../lib/resolvers/auth_mutations/signup');
const createOrganization = require('../../../lib/resolvers/organization_mutations/createOrganization');
const database = require('../../../db');
const shortid = require('shortid');
const mongoose = require('mongoose');
const createAdmin = require('../../../lib/resolvers/admin_mutations/createAdmin');
const joinPublicOrganization = require('../../../lib/resolvers/member_mutations/join_public_organization');
const {
  ORGANIZATION_NOT_FOUND,
  USER_NOT_FOUND,
  USER_NOT_AUTHORIZED,
  ORGANIZATION_MEMBER_NOT_FOUND,
} = require('../../../constants');

beforeAll(async () => {
  require('dotenv').config(); // pull env variables from .env file
  await database.connect();
});

afterAll(() => {
  database.disconnect();
});

describe('Unit testing', () => {
  test('Create Admin Mutation without Existing Organization', async () => {
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
      await createAdmin({}, args, context);
    }).rejects.toEqual(Error(ORGANIZATION_NOT_FOUND));
  });

  test('Create Admin Mutation without Existing User', async () => {
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
      await createAdmin({}, args, context);
    }).rejects.toEqual(Error(USER_NOT_FOUND));
  });

  test('Create Admin Mutation when user is already the admin of the organization', async () => {
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

    await expect(async () => {
      await createAdmin({}, args, context);
    }).rejects.toEqual(Error(USER_NOT_AUTHORIZED));
  });

  test('Create Admin Mutation when user is not a member of the organization', async () => {
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

    // SignUp a new User
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
      data: {
        organizationId: createOrgResponse._id,
        userId: newUsersignUpResponse.user._id,
      },
    };

    await expect(async () => {
      await createAdmin({}, args, context);
    }).rejects.toEqual(Error(ORGANIZATION_MEMBER_NOT_FOUND));
  });

  test('Create Admin Mutation when user is a creator of the organization', async () => {
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
        userId: signUpResponse.user._id.toString(),
      },
    };

    await expect(async () => {
      await createAdmin({}, args, context);
    }).rejects.toEqual(Error(USER_NOT_AUTHORIZED));
  });

  test('Create Admin Mutation', async () => {
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

    // SignUp a new User
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

    // User Should be in an Organization for being an Admin
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
    const createAdminResponse = await createAdmin({}, args, context);

    expect(createAdminResponse.tokenVersion).toEqual(0);
    expect(createAdminResponse.appLanguageCode).toEqual('en');
    expect(createAdminResponse.createdOrganizations).toEqual([]);
    expect(createAdminResponse.createdEvents).toEqual([]);
    expect(createAdminResponse.userType).toEqual('USER');
    expect(createAdminResponse.registeredEvents).toEqual([]);
    expect(createAdminResponse.eventAdmin).toEqual([]);
    expect(createAdminResponse.membershipRequests).toEqual([]);
    expect(createAdminResponse.organizationsBlockedBy).toEqual([]);
    expect(createAdminResponse.status).toEqual('ACTIVE');
    expect(createAdminResponse.pluginCreationAllowed).toEqual(true);
    expect(createAdminResponse.firstName).toEqual(nameForNewUser);
    expect(createAdminResponse.lastName).toEqual(nameForNewUser);
    expect(createAdminResponse.email).toEqual(email);
    expect(createAdminResponse.password).toEqual(null);
    expect(createAdminResponse.organizationUserBelongsTo).toEqual(null);
    expect(createAdminResponse.image).toEqual(null);
  });
});
