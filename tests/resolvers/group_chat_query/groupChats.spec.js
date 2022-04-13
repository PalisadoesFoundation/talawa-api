const database = require('../../../db');
const groupChat = require('../../../lib/resolvers/group_chat_query/groupChats');

beforeAll(async () => {
  require('dotenv').config(); // pull env variables from .env file
  await database.connect();
});

afterAll(async () => {
  database.disconnect();
});

describe('Unit testing', () => {
  test('testing of Group Chat', async () => {
    const res = await groupChat();
    expect(typeof res).toBe('object');
  });
});
