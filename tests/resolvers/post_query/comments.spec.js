const database = require('../../../db');
const shortid = require('shortid');
const User = require('../../../lib/models/User');
const Organization = require('../../../lib/models/Organization');
const Post = require('../../../lib/models/Post');
const Comment = require('../../../lib/models/Comment');
const getComments = require('../../../lib/resolvers/post_query/comments');

let user;
let org;
let post;
let comment;

const createUser = async () => {
  let generatedEmail = `${shortid.generate().toLowerCase()}@test.com`;
  let newUser = await User.create({
    firstName: shortid.generate().toLowerCase(),
    lastName: shortid.generate().toLowerCase(),
    email: generatedEmail,
    userType: 'USER',
    password: 'password',
  });
  return newUser;
};

const createOrganization = async () => {
  let newOrg = await Organization.create({
    name: 'abcd org',
    description: shortid.generate().toLowerCase(),
    isPublic: true,
    location: 'location',
    creator: user._id,
    admins: [user._id],
    members: [user._id],
  });
  return newOrg;
};

const createPost = async () => {
  let newPost = await Post.create({
    text: 'text',
    title: 'title',
    creator: user._id,
    organization: org._id,
  });
  return newPost;
};

const createComment = async () => {
  let newComment = await Comment.create({
    text: 'new comment',
    creator: user._id,
    post: post._id,
    likedBy: [user._id],
    likeCount: 1,
  });
  return newComment;
};

const deleteUser = async (id) => {
  await User.deleteOne({ _id: id });
};

const deleteOrganization = async (id) => {
  await Organization.deleteOne({ _id: id });
};

const deletePost = async (id) => {
  await Post.deleteOne({ _id: id });
};

const deleteComment = async (id) => {
  await Comment.deleteOne({ _id: id });
};

beforeAll(async () => {
  require('dotenv').config(); // pull env variables from .env file
  await database.connect();
  user = await createUser();
  if (user) {
    org = await createOrganization();
    if (org) {
      post = await createPost();
      if (post) {
        comment = await createComment();
      }
    }
  } else {
    throw new Error('User is required to create a organization');
  }
});

afterAll(async () => {
  await deleteComment(comment._id);
  await deletePost(post._id);
  await deleteOrganization(org._id);
  await deleteUser(user._id);
  database.disconnect();
});

describe('Comment query for commentsByPost resolver', () => {
  test('Find existing comments', async () => {
    const response = await getComments();
    expect(response[0].text).toMatch(/This is my first comment!/);
  });
});
