const blockforPLugin = require('../../../lib/resolvers/user_mutations/blockforPlugin')
const signup = require('../../../lib/resolvers/auth_mutations/signup');
const database = require('../../../db');
const shortid = require('shortid');
const uID = require('tests/functions/getUserId')

beforeAll(async () => {
  require('dotenv').config(); // pull env variables from .env file
  await database.connect();
});

afterAll(() => {
  database.disconnect();
});


test('blockforPLugin Mutation', async() => {

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
      userId: uID(email)
    },
  };

  const context = {
    userId: signUpResponse.user._id.toString(),
  };

  const blockforPLuginResponse = await blockforPLugin({}, args, context);
  expect(blockforPLuginResponse).toMatchObject(
    {
      image: null,
      tokenVersion: 0,
      firstName: name,
      lastName: name,
      email: email,
      password: name,
      appLanguageCode: name,
      createdOrganizations: [],
      createdEvents: [],
      userType: 'USER',
      joinedOrganizations: [],
      registeredEvents: [],
      eventAdmin: [],
      adminFor: [],
      membershipRequests: [],
      organizationsBlockedBy: [],
      status: 'ACTIVE',
      organizationUserBelongsTo: null,
      pluginCreationAllowed: false,
    });
})