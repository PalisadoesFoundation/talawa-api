const axios = require('axios');
const { URL } = require('../constants');

let token;

describe('user resolvers', () => {
  const email = 'testdb2@test.com';

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
                    }
                    accessToken
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
        }),
        accessToken: expect.any(String),
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
                }
                accessToken
              }
            }
            `,
    });
    const { data } = response;
    token = data.data.login.accessToken;
    expect(data.data.login).toEqual(
      expect.objectContaining({
        user: expect.objectContaining({
          _id: expect.any(String),
          firstName: 'testdb2',
          lastName: 'testdb2',
          email: `${email}`,
          userType: 'USER',
          image: null,
        }),
        accessToken: expect.any(String),
      })
    );
  });

  test('allUsers', async () => {
    const response = await axios.post(
      URL,
      {
        query: `query {
                users {
                  _id
                  firstName
                  lastName
                  email
                }
              }`,
      },
      {
        headers: {
          authorization: `Bearer ${token}`,
        },
      }
    );
    const { data } = response;
    expect(Array.isArray(data.data.users)).toBeTruthy();

    expect(data.data.users[0]).toEqual(
      //Tested First Object in Array as others will be similar.
      expect.objectContaining({
        _id: expect.any(String),
        firstName: expect.any(String),
        lastName: expect.any(String),
        email: expect.any(String),
      })
    );
  });
});
