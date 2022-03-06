const axios = require('axios');
const { URL } = require('../constants');
const shortid = require('shortid');

let accessToken;
let refreshToken;
let userId;

describe('userAuth resolvers', () => {
  let email = `${shortid.generate().toLowerCase()}@test.com`;

  test('signUp', async () => {
    const response = await axios.post(URL, {
      query: `
            mutation {
                signUp(data: {
                  firstName:"testdb2",
                  lastName:"testdb2"
                  email: "${email}"
                  password:"password"
                }) {
                    user {
                      _id
                      firstName
                      lastName
                      email
                      userType
                      appLanguageCode
                      image
                      tokenVersion
                    }
                    accessToken
                    refreshToken
                  }
                }
              `,
    });
    const { data } = response;
    expect(data.data.signUp).toEqual(
      expect.objectContaining({
        user: expect.objectContaining({
          _id: expect.any(String),
          firstName: 'testdb2',
          lastName: 'testdb2',
          email: `${email}`,
          userType: 'USER',
          appLanguageCode: 'en',
          image: null,
          tokenVersion: 0,
        }),
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      })
    );
  });

  test('login', async () => {
    const response = await axios.post(URL, {
      query: `
            mutation {
              login(data: { email: "${email}", password: "password" }) {
                user {
                  _id
                  firstName
                  lastName
                  email
                  userType
                  image
                  tokenVersion
                }
                accessToken
                refreshToken
              }
            }
            `,
    });
    const { data } = response;
    accessToken = data.data.login.accessToken;
    refreshToken = data.data.login.refreshToken;
    userId = data.data.login.user._id;
    expect(data.data.login).toEqual(
      expect.objectContaining({
        user: expect.objectContaining({
          _id: expect.any(String),
          firstName: 'testdb2',
          lastName: 'testdb2',
          email: `${email}`,
          userType: 'USER',
          image: null,
          tokenVersion: 0,
        }),
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      })
    );
  });

  test('refresh Token for User', async () => {
    const response = await axios.post(
      URL,
      {
        query: `
          mutation {
            refreshToken(
              refreshToken: "${refreshToken}"
            ) {
              accessToken
              refreshToken
            }
          }
        `,
      },
      {
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      }
    );
    const { data } = response;
    expect(data.data.refreshToken).toEqual(
      expect.objectContaining({
        accessToken: expect.any(String),
        refreshToken: expect.any(String),
      })
    );
  });

  test('refresh Token (If Invalid)', async () => {
    const response = await axios.post(
      URL,
      {
        query: `
          mutation {
            refreshToken(
              refreshToken: "${refreshToken + 'as'}"
            ) {
              accessToken
              refreshToken
            }
          }
        `,
      },
      {
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      }
    );
    const { data } = response;
    expect(data.errors[0]).toEqual(
      expect.objectContaining({
        message: 'invalid signature',
        status: 422,
        data: [],
      })
    );

    expect(data.data).toEqual(null);
  });

  test('revoke refresh Token for user', async () => {
    const revokeResponse = await axios.post(URL, {
      query: `
      mutation {
        revokeRefreshTokenForUser(userId:"${userId}")
      }
      `,
    });

    const { data } = revokeResponse;

    expect(data.data).toEqual(
      expect.objectContaining({
        revokeRefreshTokenForUser: true,
      })
    );
  });

  test('Check Token Version After Revoke refresh Token for user', async () => {
    const revokeResponse = await axios.post(
      URL,
      {
        query: `
        query{
            me{
              _id
              firstName
              lastName
              email
              tokenVersion
            }
        }
      `,
      },
      {
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const { data } = revokeResponse;

    expect(data.data.me).toEqual(
      expect.objectContaining({
        _id: userId,
        firstName: 'testdb2',
        lastName: 'testdb2',
        email: email,
        tokenVersion: 1,
      })
    );
  });

  test('refresh Token for user (After Revoked)', async () => {
    const response = await axios.post(
      URL,
      {
        query: `
          mutation {
            refreshToken(
              refreshToken: "${refreshToken}"
            ) {
              accessToken
              refreshToken
            }
          }
        `,
      },
      {
        headers: {
          authorization: `Bearer ${accessToken}`,
        },
      }
    );
    const { data } = response;
    expect(data.errors[0]).toEqual(
      expect.objectContaining({
        message: 'Invalid refresh token',
        status: 422,
      })
    );

    expect(data.errors[0].data[0]).toEqual(
      expect.objectContaining({
        message: 'Invalid refresh token',
        code: 'invalid.refreshToken',
        param: 'refreshToken',
      })
    );

    expect(data.data).toEqual(null);
  });
});
