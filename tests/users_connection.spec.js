const axios = require('axios');
const { URL } = require('../constants');
const getToken = require('./functions/getToken');
const getUserId = require('./functions/getUserId');
const shortid = require('shortid');

let token;
let userId;

beforeAll(async () => {
  let generatedEmail = `${shortid.generate().toLowerCase()}@test.com`;
  token = await getToken(generatedEmail);
  userId = await getUserId(generatedEmail);
});

describe('users connection query', () => {
  test('users connection with Id', async () => {
    const usersConnectionResponse = await axios.post(
      URL,
      {
        query: `
                {
                    usersConnection(where:{id:"${userId}"}) {
                        _id
                        firstName
                        lastName
                        email
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
    const { data } = usersConnectionResponse;
    expect(data.data.usersConnection).toHaveLength(1);

    expect(data.data.usersConnection[0]).toEqual(
      expect.objectContaining({
        _id: expect.any(String),
        firstName: expect.any(String),
        lastName: expect.any(String),
        email: expect.any(String),
      })
    );
  });
});
