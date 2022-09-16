const database = require('../../../db');
const groups = require('../../../lib/resolvers/group_query/groups');
beforeAll(async () => {
    require('dotenv').config(); // pull env variables from .env file
    await database.connect();
});

afterAll(() => {
    database.disconnect();
});

describe('Groups query testing for getting the lib/resolvers/group_query/groups.js', () => {
    test('Testing groups Functions', async () => {
        //on `groups.js` file we are only  returning the data from database which can be some JSON or []
        //so we will just check if it's truthy value or not in the test.
        const response = await groups();
        expect(response).toBeTruthy();
    });
});
