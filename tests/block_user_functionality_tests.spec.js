const axios = require('axios');
const { URL } = require('../constants');
const getToken = require('./functions/getToken');
const shortid = require('shortid');

let token;
beforeAll(async () => {
  let generatedEmail = `${shortid.generate().toLowerCase()}@test.com`;
  token = await getToken(generatedEmail);
});

describe('Block user functionality tests', () => {
  let createdOrganizationId;
  // A new user signs up
  let newUserId;
  let id = shortid.generate();
  let email = `${id}@test.com`;

  // TEST: ORGANIZATION BLOCKS USER
  test('Organization Blocks User', async () => {
    // An organization is created
    const createdOrganizationResponse = await axios.post(
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
        }`,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    createdOrganizationId =
      createdOrganizationResponse.data.data.createOrganization._id;

    const signUpResponse = await axios.post(URL, {
      query: `
            mutation {
                signUp(data: {
                firstName:"testdb2",
                lastName:"testdb2"
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

    const signUpData = signUpResponse.data;
    newUserId = signUpData.data.signUp.user._id;

    const blockUserResponse = await axios.post(
      URL,
      {
        query: `
          mutation{
            blockUser(organizationId: "${createdOrganizationId}", userId: "${newUserId}"){
              _id
            }
          }`,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const blockUserData = blockUserResponse.data;

    expect(blockUserData.data.blockUser).toEqual(
      expect.objectContaining({
        _id: expect.any(String),
      })
    );
  });

  test('Organization Blocks User after being blocked already', async () => {
    const blockUserResponse = await axios.post(
      URL,
      {
        query: `
          mutation{
            blockUser(organizationId: "${createdOrganizationId}", userId: "${newUserId}"){
              _id
            }
          }`,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const { data } = blockUserResponse;

    expect(data.errors[0]).toEqual(
      expect.objectContaining({
        message: 'User is not authorized for performing this operation',
        status: 422,
      })
    );

    expect(data.errors[0].data[0]).toEqual(
      expect.objectContaining({
        message: 'User is not authorized for performing this operation',
        code: 'user.notAuthorized',
        param: 'userAuthorization',
        metadata: {},
      })
    );

    expect(data.data).toEqual(null);
  });

  // TEST: ORGANIZATION UNBLOCKS USER
  test('Organization unblocks user', async () => {
    const unblockUserResponse = await axios.post(
      URL,
      {
        query: `
          mutation{
            unblockUser(organizationId: "${createdOrganizationId}", userId: "${newUserId}"){
              _id
            }
          }`,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const unblockUserData = unblockUserResponse.data;

    expect(unblockUserData.data.unblockUser).toEqual(
      expect.objectContaining({
        _id: expect.any(String),
      })
    );
  });

  test('Organization unblocks user after being unblocked already', async () => {
    const unblockUserResponse = await axios.post(
      URL,
      {
        query: `
          mutation{
            unblockUser(organizationId: "${createdOrganizationId}", userId: "${newUserId}"){
              _id
            }
          }`,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const { data } = unblockUserResponse;

    expect(data.errors[0]).toEqual(
      expect.objectContaining({
        message: 'User is not authorized for performing this operation',
        status: 422,
      })
    );

    expect(data.errors[0].data[0]).toEqual(
      expect.objectContaining({
        message: 'User is not authorized for performing this operation',
        code: 'user.notAuthorized',
        param: 'userAuthorization',
        metadata: {},
      })
    );

    expect(data.data).toEqual(null);
  });
});
