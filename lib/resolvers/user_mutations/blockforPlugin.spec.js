const i18n = require('i18n');
const blockForPlugin = require('./blockForPlugin')
const signup = require('../auth_mutations/signup');
const database = require('../../../db');
const shortid = require('shortid');
const uID = require('../../../tests/functions/getUserId')
const express = require('express');

const app = express();

beforeAll(async () => {
  require('dotenv').config(); // pull env variables from .env file
  app.use(i18n.init);
  await database.connect();
});

afterAll(() => {
  database.disconnect();
});


test('blockForPlugin Mutation', async () => {

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

  const blockForPluginResponse = await blockForPlugin({}, args, context);
  expect(blockForPluginResponse).toMatchObject(
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

  expect(blockForPluginResponse.createdOrganizations).toMatchObject({
    status: 'ACTIVE',
    groupChats: [],
    posts: [],
    membershipRequests: [],
    blockedUsers: [],
    name: name,
    description: name,
    isPublic: isPublic_boolean,
    visibleInSearch: visibleInSearch_boolean,
    apiUrl: name,
    image: null,
  })

  expect(blockForPluginResponse.createdEvents).toMatchObject(
    {
      title: name,
      description: name,
      attendees: name,
      recurrance: name,
      isPublic: isPublic_boolean,
      isRegisterable: true,
      creator: null,
      registrants: [],
      admins: [],
      organization: null,
      tasks: [],
      status: 'ACTIVE',
    })
})