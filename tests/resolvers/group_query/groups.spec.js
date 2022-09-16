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

describe('Plugins query testing for getting the lib/resolvers/plugin_query/getPlugins.js', () => {
  test('Testing getPlugins Functions', async () => {
    const response = await getPlugins();
    expect(response).toBeTruthy();
  });
});
