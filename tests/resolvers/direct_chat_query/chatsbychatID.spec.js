const axios = require('axios');
const shortid = require('shortid');
const { URL } = require('../../../constants');
const getToken = require('../../functions/getToken');
const getUserId = require('../../functions/getUserId');
const directChatsMessagesByChatID = require('../../../lib/resolvers/direct_chat_query/directChatsMessagesByChatID');
const database = require('../../../db');
// jest.useFakeTimers();

let token;
let userId;

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

describe('tests for direct chats by chat id', () => {
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

    //test for finding a direct chat by chat id
    test('find chat by chat id', async () => {
      args = {
        id: createdDirectChatId
      }
      const response = await directChatsMessagesByChatID({}, args);
      expect(response[0]).toEqual(
        expect.objectContaining({
        messageContent: expect.any(String)
        })
      );
    });
})
