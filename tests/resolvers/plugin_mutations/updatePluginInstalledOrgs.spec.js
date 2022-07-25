const database = require('../../../db');
require('../../../lib/models/Plugin');
const updatePluginInstalledOrgs = require('../../../lib/resolvers/plugin_mutations/updatePluginInstalledOrgs');
beforeAll(async () => {
  require('dotenv').config(); // pull env variables from .env file
  await database.connect();
});

afterAll(() => {
  database.disconnect();
});

describe('Testing updatePluginInstalledOrgs', () => {
  test('Find existing post by post id', async () => {
    const response = await updatePluginInstalledOrgs(
      {},
      { id: '62cfcd6233bbe266f59644db', installedOrgs: [] },
      {}
    );
    expect(response).toBeTruthy();
  });
});
