const axios = require('axios');
const shortid = require('shortid');
const { URL, CHAT_NOT_FOUND } = require('../../../constants');
const getToken = require('../../functions/getToken');
const getUserId = require('../../functions/getUserId');
const sendMessageToDirectChat = require('../../../lib/resolvers/direct_chat_mutations/sendMessageToDirectChat');
const database = require('../../../db');
const mongoose = require('mongoose');
const { PubSub } = require('apollo-server-express');

const pubsub = new PubSub(); // creating a new pubsub for passing to context in sendMessageToDirectChat
let token;
let userId;

beforeAll(async () => {
  let generatedEmail = `${shortid.generate().toLowerCase()}@test.com`;
  token = await getToken(generatedEmail);
  userId = await getUserId(generatedEmail);
  require('dotenv').config(); // pull env variables from .env file
  await database.connect(); // connect the database before running any test in this file's scope
});

afterAll(() => {
  database.disconnect(); // disconnect the database after running every test in this file's scope
});

describe('tests for sendMessageToDirectChat', () => {
  let createdDirectChatId;
  let createdOrgId;

  test('create direct chat', async () => {
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

    // CREATE DIRECT CHAT

    const createDirectChatResponse = await axios.post(
      URL,
      {
        query: `
            mutation{
                createDirectChat(data: {
                  organizationId: "${createdOrgId}"
                  userIds: ["${userId}", "${newUserId}"]
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

    const createDirectChatData = createDirectChatResponse.data;
    createdDirectChatId = createDirectChatData.data.createDirectChat._id;
    expect(createDirectChatData.data.createDirectChat).toEqual(
      expect.objectContaining({
        _id: expect.any(String),
      })
    );
  });

  // SEND A MESSAGE TO A DIRECT CHAT

  test('send message to direct chat', async () => {
    const sendMessageToDirectChatResponse = await axios.post(
      URL,
      {
        query: `
        mutation{
            sendMessageToDirectChat(chatId: "${createdDirectChatId}", messageContent: "this is a test message"){
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

    const sendMessageToADirectChatData = sendMessageToDirectChatResponse.data;
    expect(sendMessageToADirectChatData.data.sendMessageToDirectChat).toEqual(
      expect.objectContaining({
        _id: expect.any(String),
      })
    );
  });

  // if chat not found , throw error
  test('if no Chat is found for the provided args.chatId, throws NotFoundError', async () => {
    // Random id to pass as chat id
    const args = { chatId: mongoose.Types.ObjectId() };

    await expect(async () => {
      await sendMessageToDirectChat({}, args);
    }).rejects.toEqual(Error(CHAT_NOT_FOUND));
  });

  // test for add message to chat in sendMessageToDirectChat
  test('add message to chat', async () => {
    var args = {
      chatId: createdDirectChatId,
      messageContent: 'This is a test message',
    };
    const context = {
      userId: userId,
      pubsub: pubsub,
    };
    const response = await sendMessageToDirectChat({}, args, context);
    expect(response).toEqual(
      expect.objectContaining({
        messageContent: expect.any(String),
      })
    );
  });
});
