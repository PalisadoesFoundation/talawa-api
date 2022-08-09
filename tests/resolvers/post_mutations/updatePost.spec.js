const shortid = require('shortid');

const updatePost = require('../../../lib/resolvers/post_mutations/updatePost');
const database = require('../../../db');
const getUserId = require('../../functions/getUserIdFromSignup');
const Post = require('../../../lib/models/Post');
const Organization = require('../../../lib/models/Organization');
const User = require('../../../lib/models/User');
const { POST_NOT_FOUND, USER_NOT_FOUND } = require('../../../constants');

let userId;
let mainOrganization;
let savePost;

beforeAll(async () => {
  require('dotenv').config();
  await database.connect();
  let generatedEmail = `${shortid.generate().toLowerCase()}@test.com`;
  userId = await getUserId(generatedEmail);

  // adding an organization
  const organization = new Organization({
    name: 'mainOrganization',
    description:
      'mainOrganization for testing the postsByOrganization resolver',
    isPublic: true,
    visibileInSearch: true,
    status: 'ACTIVE',
    members: [userId],
    admins: [userId],
    groupChats: [],
    posts: [],
    membershipRequests: [],
    blockedUsers: [],
    image: '',
    creator: userId,
  });
  mainOrganization = await organization.save();

  // adding a new post
  const newPost = new Post({
    status: 'ACTIVE',
    likedBy: [userId],
    likeCount: 1,
    comments: [],
    text: 'a',
    title: 'a',
    imageUrl: 'a.png',
    videoUrl: 'a',
    creator: userId,
    organization: mainOrganization._id,
  });
  savePost = await newPost.save();
});

afterAll(async () => {
  await Post.findByIdAndDelete(savePost._id);
  await Organization.findByIdAndDelete(mainOrganization._id);
  await User.findByIdAndDelete(userId);

  database.disconnect();
});

describe('Testing update post resolver', () => {
  test('update post', async () => {
    const args = {
      data: {
        _id: savePost._id,
        title: 'updated post',
        description: 'updated description',
        location: 'updated location',
      },
    };

    const response = await updatePost({}, args, {
      userId,
    });

    expect(response).toBeTruthy();
  });

  test('Testing if user is not exist', async () => {
    const args = {
      data: {
        _id: savePost._id,
        title: 'updated post',
        description: 'updated description',
        location: 'updated location',
      },
    };

    await expect(() =>
      updatePost({}, args, { userId: savePost._id })
    ).rejects.toEqual(new Error(USER_NOT_FOUND));
  });

  test('Testing if post is not exist', async () => {
    const args = {
      data: {
        _id: userId,
        title: 'updated post',
        description: 'updated description',
        location: 'updated location',
      },
    };

    await expect(() => updatePost({}, args, { userId })).rejects.toEqual(
      new Error(POST_NOT_FOUND)
    );
  });
});
