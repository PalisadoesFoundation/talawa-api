const database = require('../../../db');
require('../../../lib/models/Plugin');
const getPlugins = require('../../../lib/resolvers/plugin_query/getPlugins');
beforeAll(async () => {
  require('dotenv').config(); // pull env variables from .env file
  await database.connect();
});

afterAll(() => {
  database.disconnect();
});

describe('Post query testing for post resolver', () => {
  test('Testing getPlugins Functions', async () => {
    const response = await getPlugins();
    expect(response).toBeTruthy();
  });
});
