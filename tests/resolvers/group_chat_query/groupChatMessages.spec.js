const groupChatMessageFindMethod = require('../../../lib/resolvers/group_chat_query/groupChatMessages');
const database = require('../../../db');

beforeAll(async () => {
  require('dotenv').config();
  await database.connect();
});

afterAll(() => {
  database.disconnect();
});
describe('tests for lib/resolvers/group_chat_query/groupChatMessages.js', () => {
  test('Should return  a JSON response (getting the group chat messages from the database)', async () => {
    expect(await groupChatMessageFindMethod()).toBeTruthy();
  });
  test('groupChatMessasges Produces metadata object that can be parsed to valid JSON', async () => {
    const temp = await groupChatMessageFindMethod();
    const parseJson = () => {
      const json = JSON.stringify(temp);
      JSON.parse(json);
    };
    expect(parseJson).not.toThrow();
  });
});
