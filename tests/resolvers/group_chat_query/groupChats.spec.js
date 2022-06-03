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
  test('tests for lib/resolvers/group_chat_query/groupChats.js', async () => {
    const res = await groupChat();
    expect(typeof res).toBe('object');
  });
  test('groupChatMessasges Produces metadata object that can be parsed to valid JSON', async () => {
    const temp = await groupChat();
    const parseJson = () => {
      const json = JSON.stringify(temp);
      JSON.parse(json);
    };
    expect(parseJson).not.toThrow();
  });
});
