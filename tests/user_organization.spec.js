const axios = require('axios');
const logger = require('logger');
const shortid = require('shortid');
const {
  URL,
  MEMBER_NOT_FOUND,
  MEMBER_NOT_FOUND_CODE,
  MEMBER_NOT_FOUND_PARAM,
  USER_NOT_AUTHORIZED,
  USER_NOT_AUTHORIZED_CODE,
  USER_ALREADY_MEMBER_PARAM,
} = require('../constants');
const getToken = require('./functions/getToken');

let token;
beforeAll(async () => {
  let generatedEmail = `${shortid.generate().toLowerCase()}@test.com`;
  token = await getToken(generatedEmail);
});

let createdOrgId = 'test';
let createdUserId;

describe('User-Organization Resolvers', () => {
  // ORGANIZATION IS CREATED

  test('createOrganization', async () => {
    const response = await axios.post(
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
    const { data } = response;
    if (!data.data) {
      logger.info('Data not present');
    }
    createdOrgId = data.data.createOrganization._id;
    expect(data.data.createOrganization).toEqual(
      expect.objectContaining({
        _id: expect.any(String),
      })
    );
  });

  // NEW USER IS CREATED

  let newUserToken;
  let newUserId;
  test('signUp', async () => {
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
    const { data } = response;
    newUserToken = data.data.signUp.accessToken;
    newUserId = data.data.signUp.user._id;
    expect(data.data.signUp).toEqual(
      expect.objectContaining({
        accessToken: expect.any(String),
      })
    );
  });

  // NEW USER JOINS ORGANIZATION
  test('Join Public Organization', async () => {
    const response = await axios.post(
      URL,
      {
        query: `
        mutation {
            joinPublicOrganization(organizationId: "${createdOrgId}") {
              _id
              firstName
              lastName
              email
            }
          }`,
      },
      {
        headers: {
          Authorization: `Bearer ${newUserToken}`,
        },
      }
    );
    const { data } = response;
    expect(data.data.joinPublicOrganization).toEqual(
      expect.objectContaining({
        _id: expect.any(String),
        firstName: expect.any(String),
        lastName: expect.any(String),
        email: expect.any(String),
      })
    );
  });

  // NEW USER CREATES A GROUP

  // USER IS MADE ADMIN
  test('User is made admin', async () => {
    const response = await axios.post(
      URL,
      {
        query: `mutation {
            createAdmin(data: {
              organizationId: "${createdOrgId}"
              userId: "${newUserId}"
            }) {
              _id
              firstName
              lastName
              email
            }
          }`,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const { data } = response;
    expect(data.data.createAdmin).toEqual(
      expect.objectContaining({
        _id: expect.any(String),
        firstName: expect.any(String),
        lastName: expect.any(String),
        email: expect.any(String),
      })
    );
  });

  test('Attempt to make user as admin if already is an admin', async () => {
    const response = await axios.post(
      URL,
      {
        query: `
          mutation {
            createAdmin(data: {
              organizationId: "${createdOrgId}"
              userId: "${newUserId}"
            }) {
              _id
              firstName
              lastName
              email
            }
          }`,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const { data } = response;
    expect(data.errors[0]).toEqual(
      expect.objectContaining({
        message: USER_NOT_AUTHORIZED,
        status: 422,
      })
    );

    expect(data.errors[0].data[0]).toEqual(
      expect.objectContaining({
        message: USER_NOT_AUTHORIZED,
        code: USER_NOT_AUTHORIZED_CODE,
        param: USER_ALREADY_MEMBER_PARAM,
        metadata: {},
      })
    );

    expect(data.data).toEqual(null);
  });

  // ADMIN REMOVES GROUP

  // ADMIN REMOVES EVENT

  // ADMIN IS REMOVED

  test('Admin is removed', async () => {
    const response = await axios.post(
      URL,
      {
        query: `mutation {
        removeAdmin(data: {
          organizationId: "${createdOrgId}"
          userId: "${newUserId}"
        }) {
          _id
          firstName
          lastName
          email
        }
      }`,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const { data } = response;
    expect(data.data.removeAdmin).toEqual(
      expect.objectContaining({
        _id: expect.any(String),
        firstName: expect.any(String),
        lastName: expect.any(String),
        email: expect.any(String),
      })
    );
  });

  // USER LEAVES ORGANIZATION

  test('Leave Organization', async () => {
    const response = await axios.post(
      URL,
      {
        query: `
        mutation {
            leaveOrganization(organizationId: "${createdOrgId}") {
              _id
              firstName
              lastName
              email
            }
          }`,
      },
      {
        headers: {
          Authorization: `Bearer ${newUserToken}`,
        },
      }
    );

    const { data } = response;
    expect(data.data.leaveOrganization).toEqual(
      expect.objectContaining({
        _id: expect.any(String),
        firstName: expect.any(String),
        lastName: expect.any(String),
        email: expect.any(String),
      })
    );
  });

  test('User Attempt to Leave Organization if already leaved', async () => {
    const response = await axios.post(
      URL,
      {
        query: `
        mutation {
            leaveOrganization(organizationId: "${createdOrgId}") {
              _id
              firstName
              lastName
              email
            }
          }`,
      },
      {
        headers: {
          Authorization: `Bearer ${newUserToken}`,
        },
      }
    );

    const { data } = response;

    expect(Array.isArray(data.errors)).toBeTruthy();

    expect(data.errors[0]).toEqual(
      expect.objectContaining({
        message: MEMBER_NOT_FOUND,
        status: 422,
      })
    );

    expect(data.errors[0].data[0]).toEqual(
      expect.objectContaining({
        message: MEMBER_NOT_FOUND,
        code: MEMBER_NOT_FOUND_CODE,
        param: MEMBER_NOT_FOUND_PARAM,
        metadata: {},
      })
    );

    expect(data.data).toEqual(null);
  });

  // ADMIN REMOVES USER FROM ORGANIZATION

  // A NEW USER HAS TO BE CREATED THEN ADDED TO THE ORGANIZATION THEN REMOVED
  test('Remove Member from organization', async () => {
    // new user is created
    const id = shortid.generate();
    const email = `${id}@test.com`;

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
    const { data } = signUpResponse;
    const userToken = data.data.signUp.accessToken;
    createdUserId = data.data.signUp.user._id;

    // user joins organizations
    await axios.post(
      URL,
      {
        query: `
        mutation {
            joinPublicOrganization(organizationId: "${createdOrgId}") {
              _id
              firstName
              lastName
              email
            }
          }`,
      },
      {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      }
    );
    // Admin removes user from organization
    const removeMemberResponse = await axios.post(
      URL,
      {
        query: `mutation {
          removeMember(data: {
            organizationId: "${createdOrgId}",
            userIds: ["${createdUserId}"]
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
    const removeMemberData = removeMemberResponse.data;
    expect(removeMemberData.data.removeMember).toEqual(
      expect.objectContaining({
        _id: expect.any(String),
      })
    );
  });

  test('Attempt to remove member if already removed', async () => {
    const removeMemberResponse = await axios.post(
      URL,
      {
        query: `mutation {
          removeMember(data: {
            organizationId: "${createdOrgId}",
            userIds: ["${createdUserId}"]
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
    const { data } = removeMemberResponse;
    expect(Array.isArray(data.errors)).toBeTruthy();

    expect(data.errors[0]).toEqual(
      expect.objectContaining({
        message: MEMBER_NOT_FOUND,
        status: 422,
        data: [],
      })
    );

    expect(data.data).toEqual(null);
  });

  // ORGANIZATION IS DELETED

  test('deleteOrganization', async () => {
    const deletedResponse = await axios.post(
      URL,
      {
        query: `
              mutation {
                  removeOrganization(id: "${createdOrgId}") {
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

    expect(deletedResponse.data.data.removeOrganization).toEqual(
      expect.objectContaining({
        _id: expect.any(String),
      })
    );
  });
});
