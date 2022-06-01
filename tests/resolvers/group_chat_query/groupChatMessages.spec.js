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
});
