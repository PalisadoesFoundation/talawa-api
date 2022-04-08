const database = require('../../../db');
const shortid = require('shortid');
const User = require('../../../lib/models/User');
const Organization = require('../../../lib/models/Organization');
const Post = require('../../../lib/models/Post');
const Comment = require('../../../lib/models/Comment')
const commentsByPost = require('../../../lib/resolvers/post_query/commentsByPost')

let user;
let org;
let post;
let comment;

beforeAll(async () => {
  require('dotenv').config(); // pull env variables from .env file
  await database.connect();
  let generatedEmail = `${shortid.generate().toLowerCase()}@test.com`;
  user = await User.create({
    firstName: shortid.generate().toLowerCase(),
    lastName: shortid.generate().toLowerCase(),
    email: generatedEmail,
    userType: 'USER',
    password: 'password',
  });
  if (user) {
    org = await Organization.create({
      name: 'abcd org',
      description: shortid.generate().toLowerCase(),
      isPublic: true,
      location: 'location',
      creator: user._id,
      admins: [user._id],
      members: [user._id],
    });
    if (org) {
      post = await Post.create({
        text: 'text',
        title: 'title',
        creator: user._id,
        organization: org._id,
      });
      if (post) {
        comment = await Comment.create({
          text: 'new comment',
          creator: user._id,
          post: post._id,
          likedBy: [user._id],
          likeCount: 1,
        })
      }
    }
  } else {
    throw new Error('User is required to create a organization');
  }
});

afterAll(() => {
  database.disconnect();
});

describe('Comment query for commentsByPost resolver', () => {
  test('Find existing comment by comment id', async () => {
    const arg = {
      id: `${comment.post._id}`,
    };
    const response = await commentsByPost({}, arg);
    expect(response).toMatchObject([{text: "new comment"}])
  })
  test('Comment does not exist by comment id', async () => {
    const arg = {
      id:'624300b406807d0e7453ebca'
    }
    await expect(async () => {
      await commentsByPost({}, arg)
    }).rejects.toThrow(Error('Comment not found'));
  })
})