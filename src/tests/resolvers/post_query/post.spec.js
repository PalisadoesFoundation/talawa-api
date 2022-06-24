const database = require('../../../db');
const shortid = require('shortid');
const { User, Organization, Post } = require('../../../lib/models');
require('../../../lib/models/Comment');
const getPostByItId = require('../../../lib/resolvers/post_query/post');
let user;
let org;
let post;

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
    }
  } else {
    throw new Error('User is required to create a organization');
  }
});

afterAll(() => {
  database.disconnect();
});

describe('Post query testing for post resolver', () => {
  test('Find existing post by post id', async () => {
    const arg = {
      id: `${post._id}`,
    };
    const response = await getPostByItId({}, arg);
    expect(response).toEqual(
      expect.objectContaining({
        text: 'text',
        title: 'title',
        likeCount: 0,
        commentCount: 0,
      })
    );
  });
  test('Post not exit with this id', async () => {
    const arg = {
      id: '6230d726edaf510ca0ba2b9f',
    };
    await expect(async () => {
      await getPostByItId({}, arg);
    }).rejects.toThrow('Post not found');
  });
});
