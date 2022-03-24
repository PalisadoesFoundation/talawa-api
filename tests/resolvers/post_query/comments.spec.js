const commentFindMutation = require('../../../lib/resolvers/post_query/comments');
const database = require('../../../db');
const User = require('../../../lib/models/User');
const Post = require('../../../lib/models/Post');

beforeAll(async () => {
  require('dotenv').config(); // pull env variables from .env file
  await database.connect();
});

afterAll(() => {
  database.disconnect();
});

describe('Post comments find mutation testing', () => {
  test('Comments Found or not', async () => {
    try {
      const response = await commentFindMutation();
      if (response.length === 0) done();
      expect(response).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            text: expect.any(String),
            creator: expect.any(User),
            post: expect.any(Post),
            status: 'ACTIVE' || 'BLOCKED' || 'DELETED',
          }),
        ])
      );
    } catch (NotFoundError) {
      expect(NotFoundError.httpCode).toEqual(404);
      const errorObj = NotFoundError.errors[0];
      expect(errorObj.message).toEqual('Comment not found');
      expect(errorObj.code).toEqual('comment.notFound');
      expect(errorObj.param).toEqual('comment');
    }
  });
});
