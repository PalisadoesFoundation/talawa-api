const axios = require('axios');
const shortid = require('shortid');
const { URL } = require('../../../constants');
const getToken = require('../../functions/getToken');
const getUserId = require('../../functions/getUserId');
const createGroupChat = require('../../../lib/resolvers/group_chat_mutations/createGroupChat');
const database = require('../../../db');
const mongoose = require('mongoose');

let token;

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


describe('tests for creating group chat', () => {
  let createdOrgId;
  let user1Id;
  let newUserId;


  // TEST FOR CREATE GROUP CHAT
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
    newUserId = signUpData.data.signUp.user._id;

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
  user1Id = signUpDataForUser1.data.signUp.user._id;  // new user id which is not the part of the groupchat


    const args = {
        data: {
            organizationId: createdOrgId,
            userIds: [user1Id],
            title: "This is a new group chat"
        },
    };
    const context = {
        userId: newUserId,
    };
    const response = await createGroupChat({}, args, context);
    expect(response).toEqual(
        expect.objectContaining({
            title: "This is a new group chat"
        })
      );
  })



  // TEST IF USER WHO'S CREATING GROUP CHAT DOESN'T EXIST
  test('if user is not found, throws NotFoundError', async () => {
    const args = {
        data: {
            organizationId: createdOrgId,
            userIds: [user1Id],
            title: "This is a new group chat"
        },
    };
    const context = {
        userId: mongoose.Types.ObjectId(),
    };
    await expect(async () => {
      await createGroupChat({}, args, context);
    }).rejects.toEqual(Error('user not found'));
  });

  
  // TEST IF ORGANIZATION IS NOT FOUND
  test('if organization is not found, throws NotFoundError', async () => {
    const args = {
        data: {
            organizationId: mongoose.Types.ObjectId(),
            userIds: [user1Id],
            title: "This is a new group chat"
        },
    };
    const context = {
        userId: newUserId,
    };
    await expect(async () => {
      await createGroupChat({}, args, context);
    }).rejects.toEqual(Error('Organization not found'));
  });

   // TEST IF USER ADDED DOESN'T EXIST
   test('if user added does not exist, throw Error', async () => {
    const args = {
        data: {
            organizationId: createdOrgId,
            userIds: [mongoose.Types.ObjectId()],
            title: "This is a new group chat"
        },
    };
    const context = {
        userId: newUserId,
    };
    await expect(async () => {
      await createGroupChat({}, args, context);
    }).rejects.toEqual(Error('user not found'));
  });
})