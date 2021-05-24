const axios = require('axios');
const shortid = require('shortid');
const { URL } = require('../constants');

describe('user resolvers', () => {
  test('allUsers', async () => {
    const response = await axios.post(URL, {
      query: `query {
                users {
                  _id
                  firstName
                  lastName
                  email
                }
              }`,
    });
    const { data } = response;
    expect(Array.isArray(data.data.users)).toBeTruthy();
  });

  test('signUp', async () => {
    var id = shortid.generate();
    var email = `${id}@test.com`;
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
    expect(data.data.signUp).toEqual(
      expect.objectContaining({
        accessToken: expect.any(String),
      })
    );
  });

  test('login', async () => {
    const response = await axios.post(URL, {
      query: `
            mutation{
                login(data: {
                  email:"testdb2@test.com",
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
    expect(data.data.login).toEqual(
      expect.objectContaining({
        accessToken: expect.any(String),
      })
    );
  });
});
