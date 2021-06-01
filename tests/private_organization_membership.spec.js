const axios = require('axios');
const shortid = require('shortid');
const { URL } = require('../constants');
const getToken = require('./functions/getToken');

let token;
beforeAll(async () => {
  token = await getToken();
});

describe('Private Organization Membership Tests', () => {
  let newRequestId;
  let createdOrganizationId;
  let newUserToken;

  // New user sends membership request to join organization
  test('User sends private organization membership request', async () => {
    // Private Organization is created - by default user
    const createdOrganizationResponse = await axios.post(
      URL,
      {
        query: `
            mutation {
                createOrganization(data: {
                    name:"test org"
                    description:"test description"
                    isPublic: false
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

    createdOrganizationId =
      createdOrganizationResponse.data.data.createOrganization._id;

    // New user is created

    const id = shortid.generate();
    const email = `${id}@test.com`;
    const response = await axios.post(URL, {
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
    const signUpData = response.data;
    newUserToken = signUpData.data.signUp.accessToken;

    const sendRequestResponse = await axios.post(
      URL,
      {
        query: `
                    mutation{
                    sendMembershipRequest(organizationId: "${createdOrganizationId}"){
                        _id
                    }
                }`,
      },
      {
        headers: {
          Authorization: `Bearer ${newUserToken}`,
        },
      }
    );

    const sendRequestData = sendRequestResponse.data;
    newRequestId = sendRequestData.data.sendMembershipRequest._id;

    expect(sendRequestData.data.sendMembershipRequest).toEqual(
      expect.objectContaining({
        _id: expect.any(String),
      })
    );
  });

  // admin rejects membership request
  test('Admin rejects membership request', async () => {
    const rejectRequestResponse = await axios.post(
      URL,
      {
        query: `
              mutation{
                rejectMembershipRequest(membershipRequestId: "${newRequestId}"){
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

    const rejectRequestData = rejectRequestResponse.data;

    expect(rejectRequestData.data.rejectMembershipRequest).toEqual(
      expect.objectContaining({
        _id: expect.any(String),
      })
    );
  });

  // USER SENDS REQUEST THEN CANCELS IT
  test('User sends membership requests then cancels it', async () => {
    let requestId;
    const sendRequestResponse = await axios.post(
      URL,
      {
        query: `
                    mutation{
                    sendMembershipRequest(organizationId: "${createdOrganizationId}"){
                        _id
                    }
                }`,
      },
      {
        headers: {
          Authorization: `Bearer ${newUserToken}`,
        },
      }
    );
    const sendRequestData = sendRequestResponse.data;
    requestId = sendRequestData.data.sendMembershipRequest._id;

    const cancelRequestResponse = await axios.post(
      URL,
      {
        query: `
              mutation{
                cancelMembershipRequest(membershipRequestId: "${requestId}"){
                  _id
                }
              }
              `,
      },
      {
        headers: {
          Authorization: `Bearer ${newUserToken}`,
        },
      }
    );

    const cancelRequestData = cancelRequestResponse.data;

    expect(cancelRequestData.data.cancelMembershipRequest).toEqual(
      expect.objectContaining({
        _id: expect.any(String),
      })
    );
  });

  // A NEW REQUEST IS SENT AND ACCEPTED

  test('User sends membership request and admin accepts it', async () => {
    // SEND REQUEST

    let requestId;
    const sendRequestResponse = await axios.post(
      URL,
      {
        query: `
                    mutation{
                    sendMembershipRequest(organizationId: "${createdOrganizationId}"){
                        _id
                    }
                }`,
      },
      {
        headers: {
          Authorization: `Bearer ${newUserToken}`,
        },
      }
    );
    const sendRequestData = sendRequestResponse.data;
    requestId = sendRequestData.data.sendMembershipRequest._id;

    // ACCEPT REQUEST

    const acceptRequestResponse = await axios.post(
      URL,
      {
        query: `
              mutation{
                acceptMembershipRequest(membershipRequestId: "${requestId}"){
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

    const acceptRequestData = acceptRequestResponse.data;

    expect(acceptRequestData.data.acceptMembershipRequest).toEqual(
      expect.objectContaining({
        _id: expect.any(String),
      })
    );
  });
});
