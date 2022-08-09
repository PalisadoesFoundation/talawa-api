const mongoose = require('mongoose');
const { PubSub } = require('apollo-server-express');
const axios = require('axios');

const getToken = require('../../functions/getToken');
const shortid = require('shortid');
const database = require('../../../db');
const {
  URL,
  ORGANIZATION_NOT_FOUND,
  USER_NOT_AUTHORIZED,
} = require('../../../constants');
const getUserId = require('../../functions/getUserId');
const sendMessageToGroupChat = require('../../../lib/resolvers/group_chat_mutations/sendMessageToGroupChat');
const Organization = require('../../../lib/models/Organization');
const updateSpamNotification = require('../../../lib/resolvers/organization_mutations/updateSpamNotification');
const { NotFoundError } = require('errors');

let userId;
let createdOrgId;
let token;
const pubsub = new PubSub();

beforeAll(async () => {
  let generatedEmail = `${shortid.generate().toLowerCase()}@test.com`;
  token = await getToken(generatedEmail);
  userId = await getUserId(generatedEmail);
  require('dotenv').config();
  await database.connect();
});

afterAll(() => {
  database.disconnect();
});

describe('Testing Update spam notification resolver', () => {
  let createdGroupChatId;

  // CREATE GROUP CHAT
  test('create group chat', async () => {
    // CREATE AN ORGANIZATION
    const createdOrgResponse = await axios.post(
      URL,
      {
        query: `
                  mutation {
                      createOrganization(data: {
                          name:"test org update spam notification"
                          description:"test description"
                          isPublic: true
                          visibleInSearch: true
                          }) {
                              _id
                          }
                  }
                    `,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    createdOrgId = createdOrgResponse.data.data.createOrganization._id;

    // CREATE ANOTHER USER WHICH IS NOT ADDED IN GROUP CHAT
    const nameForUser1 = shortid.generate();
    const emailforUser1 = `${nameForUser1}@test.com`;

    const createUserResponseForUser1 = await axios.post(URL, {
      query: `
              mutation {
                  signUp(data: {
                  firstName:"${nameForUser1}",
                  lastName:"${nameForUser1}"
                  email: "${emailforUser1}"
                  password:"password"
                  }) {
                  user{
                    _id
                  }
                  accessToken
                  }
              }
              `,
    });
    const signUpDataForUser1 = createUserResponseForUser1.data;

    const createGroupChatResponse = await axios.post(
      URL,
      {
        query: `
      mutation{
          createGroupChat(data: {
            title: "This is a group chat for testing"
            organizationId: "${createdOrgId}"
            userIds: ["${userId}", "${signUpDataForUser1.data.signUp.user._id}"]
          }){
            _id
          }
        }
              `,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const createGroupChatData = createGroupChatResponse.data;
    createdGroupChatId = createGroupChatData.data.createGroupChat._id;

    expect(createGroupChatData.data.createGroupChat).toEqual(
      expect.objectContaining({
        _id: expect.any(String),
      })
    );
  });

  // TEST WHEN USER SPAM THE CHAT AND IT IS CHECKED VIA PLUGIN
  test('send message to group chat with isSpam agrument to be true', async () => {
    var args = {
      chatId: createdGroupChatId,
      messageContent: 'This is a test message',
      isSpam: true,
    };
    var context = {
      userId: userId,
      pubsub: pubsub,
    };
    const response = await sendMessageToGroupChat({}, args, context);

    expect(response).toEqual(
      expect.objectContaining({
        messageContent: 'This is a test message',
      })
    );
  });

  // TEST WHEN USER UPDATED THE SPAM NOTIFICATION
  test('Testing, when user updated the spam notification', async () => {
    const currentOrg = await Organization.findById(createdOrgId);

    const args = {
      data: {
        orgId: createdOrgId,
        spamId: currentOrg.spamCount[0]._id.toString(),
        isReaded: true,
      },
    };

    const context = {
      userId: userId,
      pubsub: pubsub,
    };

    const response = await updateSpamNotification({}, args, context);
    expect(response).toBeTruthy();
  });

  // TEST WHEN THE ORGANIZATION IS NOT REGISTERED
  test('Testing, when the organization is not registered', async () => {
    const currentOrg = await Organization.findById(createdOrgId);

    const args = {
      data: {
        orgId: mongoose.Types.ObjectId(),
        spamId: currentOrg.spamCount[0]._id.toString(),
        isReaded: true,
      },
    };

    const context = {
      userId: userId,
      pubsub: pubsub,
    };

    await expect(async () => {
      await updateSpamNotification({}, args, context);
    }).rejects.toEqual(new NotFoundError(ORGANIZATION_NOT_FOUND));
  });

  // TEST WHEN THE SPAMMING IS NOT DONE IN ORGANIZATION
  test('Testing, when spamming is not done in organization', async () => {
    const args = {
      data: {
        orgId: createdOrgId,
        spamId: mongoose.Types.ObjectId(),
        isReaded: true,
      },
    };

    const context = {
      userId: userId,
      pubsub: pubsub,
    };

    await expect(async () => {
      await updateSpamNotification({}, args, context);
    }).rejects.toEqual(Error(USER_NOT_AUTHORIZED));
  });
});
