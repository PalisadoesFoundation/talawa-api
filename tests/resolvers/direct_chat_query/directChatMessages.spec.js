const directChatMessages = require('../../../lib/resolvers/direct_chat_query/directChatMessages');
const database = require('../../../db');

beforeAll(async () => {
    require('dotenv').config();
    await database.connect();
});

afterAll(() => {
  database.disconnect();
});

describe('tests for direct chat messages', () => {
    test('find direct chat messages', async () => {
        let response = await directChatMessages();
        response.forEach(res => {
            expect(res).toEqual(
                expect.objectContaining({
                messageContent: expect.any(String)
                })
            );   
        })
    })
})