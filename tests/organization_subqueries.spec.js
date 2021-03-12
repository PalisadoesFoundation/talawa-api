const axios = require('axios');
const { URL } = require('../constants');

describe('organization resolvers', () => {
  test('organization-subqueries', async () => {
    const response = await axios.post(URL, {
      query: `
      {
        organizations {
            _id
            name
            creator {
                _id
                firstName
            }
            members {
                _id
                firstName
            }
            admins {
                _id
                firstName
            }
        }
    }
    `,
    });

    const { data } = response;

    expect(Array.isArray(data.data.organizations)).toBeTruthy();
  });
});
