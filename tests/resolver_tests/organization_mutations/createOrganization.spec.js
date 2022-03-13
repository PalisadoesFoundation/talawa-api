const createOrganization = require('../../../lib/resolvers/organization_mutations/createOrganization');
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
  test('Create Organization Mutation', async () => {
    // SignUp the User
    const nameForNewUser = shortid.generate().toLowerCase();
    const email = `${nameForNewUser}@test.com`;
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

    expect(createOrgResponse).toMatchObject({
      status: 'ACTIVE',
      groupChats: [],
      posts: [],
      membershipRequests: [],
      blockedUsers: [],
      // _id: 622da0580caf1971d4d4a290,
      name: name,
      description: name,
      isPublic: isPublic_boolean,
      visibleInSearch: visibleInSearch_boolean,
      apiUrl: name,
      image: null,
    });

    createOrgResponse.members.map((member) => {
      expect(member).toMatchObject({
        __v: 0,
        _id: signUpResponse.user._id,
        adminFor: [],
        appLanguageCode: 'en',
        email: signUpResponse.user.email,
        createdEvents: [],
        createdOrganizations: [],
        eventAdmin: [],
        firstName: signUpResponse.user.firstName,
        lastName: signUpResponse.user.lastName,
        image: null,
        joinedOrganizations: [],
        membershipRequests: [],
        organizationUserBelongsTo: null,
        organizationsBlockedBy: [],
        pluginCreationAllowed: true,
        registeredEvents: [],
        status: 'ACTIVE',
        tokenVersion: 0,
        userType: 'USER',
      });
    });
    createOrgResponse.admins.map((admin) => {
      expect(admin).toMatchObject({
        __v: 0,
        _id: signUpResponse.user._id,
        adminFor: [],
        appLanguageCode: 'en',
        email: signUpResponse.user.email,
        createdEvents: [],
        createdOrganizations: [],
        eventAdmin: [],
        firstName: signUpResponse.user.firstName,
        lastName: signUpResponse.user.lastName,
        image: null,
        joinedOrganizations: [],
        membershipRequests: [],
        organizationUserBelongsTo: null,
        organizationsBlockedBy: [],
        pluginCreationAllowed: true,
        registeredEvents: [],
        status: 'ACTIVE',
        tokenVersion: 0,
        userType: 'USER',
      });
    });

    expect(createOrgResponse.creator).toMatchObject({
      __v: 0,
      _id: signUpResponse.user._id,
      adminFor: [],
      appLanguageCode: 'en',
      email: signUpResponse.user.email,
      createdEvents: [],
      createdOrganizations: [],
      eventAdmin: [],
      firstName: signUpResponse.user.firstName,
      lastName: signUpResponse.user.lastName,
      image: null,
      joinedOrganizations: [],
      membershipRequests: [],
      organizationUserBelongsTo: null,
      organizationsBlockedBy: [],
      pluginCreationAllowed: true,
      registeredEvents: [],
      status: 'ACTIVE',
      tokenVersion: 0,
      userType: 'USER',
    });
  });
});
