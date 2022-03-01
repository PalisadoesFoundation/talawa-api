const axios = require('axios');
const shortid = require('shortid');
const { URL } = require('../constants');
const getToken = require('./functions/getToken');
const getUserId = require('./functions/getUserId');

let token;
let userId;

beforeAll(async () => {
  let generatedEmail = `${shortid.generate().toLowerCase()}@test.com`;
  token = await getToken(generatedEmail);
  userId = await getUserId(generatedEmail);
});

describe('Unit testing', () => {
  let createdGroupChatId;
  let createdOrgId;
  // CREATE GROUP CHAT

  test('create group chat', async () => {
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

  // SEND MESSAGE TO GROUP CHAT

  test('send message to group chat', async () => {
    const sendMessageToGroupChatResponse = await axios.post(
      URL,
      {
        query: `
        mutation{
          sendMessageToGroupChat(chatId: "${createdGroupChatId}", messageContent: "this is a test message"){
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

    const sendMessageToAGroupChatData = sendMessageToGroupChatResponse.data;
    expect(sendMessageToAGroupChatData.data.sendMessageToGroupChat).toEqual(
      expect.objectContaining({
        _id: expect.any(String),
      })
    );
  });

  // REMOVE GROUP CHAT

  test('remove group chat', async () => {
    const removeGroupChatResponse = await axios.post(
      URL,
      {
        query: `
    mutation{
      removeGroupChat(chatId:"${createdGroupChatId}") {
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

    const removeGroupChatData = removeGroupChatResponse.data;
    expect(removeGroupChatData.data.removeGroupChat).toEqual(
      expect.objectContaining({
        _id: expect.any(String),
      })
    );
  });
});
