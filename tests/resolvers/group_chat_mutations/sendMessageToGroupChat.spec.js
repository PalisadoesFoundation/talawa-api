const axios = require('axios');
const shortid = require('shortid');
const {
  URL,
  USER_NOT_AUTHORIZED,
  CHAT_NOT_FOUND,
} = require('../../../constants');
const getToken = require('../../functions/getToken');
const getUserId = require('../../functions/getUserId');
const sendMessageToGroupChat = require('../../../lib/resolvers/group_chat_mutations/sendMessageToGroupChat');
const database = require('../../../db');
const mongoose = require('mongoose');
const { PubSub } = require('apollo-server-express');

let token;
let userId;
let userId1;
const pubsub = new PubSub(); // creating a new pubsub for passing to context in sendMessageToDirectChat

beforeAll(async () => {
  let generatedEmail = `${shortid.generate().toLowerCase()}@test.com`;
  let generatedEmail1 = `${shortid.generate().toLowerCase()}@test.com`;
  token = await getToken(generatedEmail);
  userId = await getUserId(generatedEmail);
  await getToken(generatedEmail1);
  userId1 = await getUserId(generatedEmail1);
  require('dotenv').config(); // pull env variables from .env file
  await database.connect(); // connect the database before running any test in this file's scope
});

afterAll(() => {
  database.disconnect(); // disconnect the database after running every test in this file's scope
});

describe('tests for sending a message to group chat', () => {
  let createdGroupChatId;
  let createdOrgId;
  let newUser1Id;

  // CREATE GROUP CHAT
  test('create group chat', async () => {
    // CREATE AN ORGANIZATION
    const createdOrgResponse = await axios.post(
      URL,
      {
        query: `
                  mutation {
                      createOrganization(data: {
                          name:"test org"
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

    // CREATE A NEW USER
    const nameForNewUser = shortid.generate();
    const email = `${nameForNewUser}@test.com`;

    const createNewUserResponse = await axios.post(URL, {
      query: `
                mutation {
                    signUp(data: {
                    firstName:"${nameForNewUser}",
                    lastName:"${nameForNewUser}"
                    email: "${email}"
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
    const signUpData = createNewUserResponse.data;
    const newUserId = signUpData.data.signUp.user._id;

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
    newUser1Id = signUpDataForUser1.data.signUp.user._id; // new user id which is not the part of the groupchat

    const createGroupChatResponse = await axios.post(
      URL,
      {
        query: `
      mutation{
          createGroupChat(data: {
            title: "This is a group chat for testing"
            organizationId: "${createdOrgId}"
            userIds: ["${userId}", "${newUserId}", "${userId1}"]
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

  // TEST IF NO GROUP CHAT EXISTS
  test('if no group Chat is found for the provided args.id, throws NotFoundError', async () => {
    const args = {
      chatId: mongoose.Types.ObjectId(), // Random id to pass as chat id
      messageContent: 'This is a test message',
    };
    const context = {
      userId: mongoose.Types.ObjectId(),
      pubsub: pubsub,
    };
    await expect(async () => {
      await sendMessageToGroupChat({}, args, context);
    }).rejects.toEqual(Error(CHAT_NOT_FOUND));
  });

  // TEST IF USER IS NOT A MEMBER OF THE GROUP CHAT
  test('if user not a member of the group chat, throw Error', async () => {
    const args = {
      chatId: createdGroupChatId,
      messageContent: 'This is a test message',
    };
    const context = {
      userId: newUser1Id, // passing new user id which is not the member of the group chat
      pubsub: pubsub,
    };
    await expect(async () => {
      await sendMessageToGroupChat({}, args, context);
    }).rejects.toEqual(Error(USER_NOT_AUTHORIZED));
  });

  // TEST FRO SENDING MESSAGE TO THE GROUP CHAT
  test('send message to group chat', async () => {
    var args = {
      chatId: createdGroupChatId,
      messageContent: 'This is a test message',
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

  // TEST WHEN USER NOT SPAM THE CHAT AND IT IS CHECKED VIA PLUGIN
  test('send message to group chat with isSpam agrument to be false', async () => {
    var args = {
      chatId: createdGroupChatId,
      messageContent: 'This is a test message',
      isSpam: false,
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

  // TEST WHEN USER SPAM THE CHAT AND IT IS CHECKED VIA PRE-DEFINED KEYWORDS
  test('send message to group chat with spam keyword', async () => {
    var args = {
      chatId: createdGroupChatId,
      messageContent: 'Click here to get the smart phone is of Best price.',
    };
    var context = {
      userId: userId1,
      pubsub: pubsub,
    };
    const response = await sendMessageToGroupChat({}, args, context);
    expect(response).toEqual(
      expect.objectContaining({
        messageContent: 'Click here to get the smart phone is of Best price.',
      })
    );
  });

  // TEST WHEN USER SPAM THE CHAT AND IT IS CHECKED VIA FREQUENCY OF THE MESSAGES
  test('send message to group chat with frequency of less then 5 seconds', async () => {
    var context = {
      userId: userId,
      pubsub: pubsub,
    };

    for (let i = 0; i <= 30; i++) {
      var args = {
        chatId: createdGroupChatId,
        messageContent: `This is a test message ${i}`,
      };

      const response = await sendMessageToGroupChat({}, args, context);
      expect(response).toEqual(
        expect.objectContaining({
          messageContent: `This is a test message ${i}`,
        })
      );
    }
    var args = {
      chatId: createdGroupChatId,
      messageContent: 'This is a final test message',
    };

    const response = await sendMessageToGroupChat({}, args, context);
    expect(response).toEqual(
      expect.objectContaining({
        messageContent: 'This is a final test message',
      })
    );
  });
});
