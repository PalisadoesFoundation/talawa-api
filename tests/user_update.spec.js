const axios = require('axios');
const { URL } = require('../constants');
const getToken = require('./functions/getToken');
const shortid = require('shortid');

let token;
beforeAll(async () => {
  token = await getToken();
});

describe('Update-Profile Resolvers', () => {
  let id = shortid.generate().toLowerCase();
  let email = `${id}@test.com`;

  test('updateProfile', async () => {
    const response = await axios.post(
      URL,
      {
        query: `
            mutation{
                updateUserProfile(data:{
                  firstName:"Test"
                  lastName:"Name"
                  email:"${email}"
                }){
                  firstName
                  lastName
                  email
                }
              }
                  `,
      },
      {
        headers: {
          authorization: `Bearer ${token}`,
        },
      }
    );

    const { data } = response;
    expect(data.data.updateUserProfile).toEqual(
      expect.objectContaining({
        firstName: 'Test',
        lastName: 'Name',
        email: email,
      })
    );
  });
});
