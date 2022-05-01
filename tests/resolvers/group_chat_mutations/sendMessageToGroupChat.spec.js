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
const pubsub = new PubSub(); // creating a new pubsub for passing to context in sendMessageToDirectChat

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
});
