const axios = require('axios');
const shortid = require('shortid');
const { URL } = require('../../../constants');
const getToken = require('../../functions/getToken');
const getUserId = require('../../functions/getUserId');
const addUserToGroupChat = require('../../../lib/resolvers/group_chat_mutations/addUserToGroupChat');
const database = require('../../../db');
const mongoose = require('mongoose');

let token;
let userId;

beforeAll(async () => {
    let generatedEmail = `${shortid.generate().toLowerCase()}@test.com`;
    token = await getToken(generatedEmail);
    userId = await getUserId(generatedEmail);
    require('dotenv').config(); // pull env variables from .env file
    await database.connect();  // connect the database before running any test in this file's scope
});

afterAll(() => {
  database.disconnect(); // disconnect the database after running every test in this file's scope
});


describe('tests for direct chats by chat id', () => {
  let createdGroupChatId;
  let createdOrgId;
  let newUserAddedId;

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

    // CREATE ANOTHER NEW USER TO ADD TO GROUP CHAT
    const nameForUserBeingAdded = shortid.generate();
    const emailForUser = `${nameForUserBeingAdded}@test.com`;

    const createNewUserResponse1 = await axios.post(URL, {
      query: `
              mutation {
                  signUp(data: {
                  firstName:"${nameForUserBeingAdded}",
                  lastName:"${nameForUserBeingAdded}"
                  email: "${emailForUser}"
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
    const signUpData1 = createNewUserResponse1.data;
    newUserAddedId = signUpData1.data.signUp.user._id;
    
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

  // test if not groupchat exists
  test('if no group Chat is found for the provided args.id, throws NotFoundError', async () => {
    // Random id to pass as chat id
    const args = { chatId: mongoose.Types.ObjectId() };
    const context = {userId: mongoose.Types.ObjectId()};
    await expect(async () => {
      await addUserToGroupChat({}, args, context);
    }).rejects.toEqual(Error('Group Chat not found'));
  });

   // test if user is already added
   test('if user is already added,throws Error', async () => {
    const args = { 
        chatId: createdGroupChatId,
        userId: userId
    };
    const context = {userId: userId};
    await expect(async () => {
      await addUserToGroupChat({}, args, context);
    }).rejects.toEqual(Error('User already a member'));
  });


  // test for adding a user to group chat
  test('add user to group chat', async () => {
    var args = {
        chatId: createdGroupChatId,
        userId: newUserAddedId   // passing new user id whichwe created to add to group chat
    };
    var context = {
        userId: userId
    };
    const response = await addUserToGroupChat({}, args, context);
    expect(response).toEqual(
        expect.objectContaining({
        messages: expect.any(Array)
        })
      );
  });
})