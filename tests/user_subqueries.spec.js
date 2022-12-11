const axios = require('axios');
const { URL } = require('../constants');
const getToken = require('./functions/getToken');
const shortid = require('shortid');

let token;

beforeAll(async () => {
  let generatedEmail = `${shortid.generate().toLowerCase()}@test.com`;
  token = await getToken(generatedEmail);
});

describe('users resolvers', () => {
  test('users query without Authorization', async () => {
    const response = await axios.post(URL, {
      query: `query {
                  users {
                    _id
                    firstName
                    lastName
                    email
                    createdOrganizations {
                      _id
                      name
                    }
                    joinedOrganizations {
                      _id
                      name
                    }
                  }
                }
              `,
    });
    const { data } = response;

    expect(Array.isArray(data.errors)).toBeTruthy();

    expect(data.errors[0]).toEqual(
      expect.objectContaining({
        message: 'User is not authenticated',
        status: 422,
      })
    );

    expect(data.errors[0].data[0]).toEqual(
      expect.objectContaining({
        message: 'User is not authenticated',
        code: 'user.notAuthenticated',
        param: 'userAuthentication',
        metadata: {},
      })
    );

    expect(data.data.users).toEqual(null);
  });
});
