const axios = require('axios');
const { URL } = require('../../../constants');
const getToken = require('../../functions/getToken');
const shortid = require('shortid');

const database = require('../../../db');
const getUserId = require('../../functions/getUserId');
const Organization = require('../../../lib/models/Organization');
const Post = require('../../../lib/models/Post');
const Comment = require('../../../lib/models/Comment');
const User = require('../../../lib/models/User');

let mainUserId;
let secondUserId;
let thirdUserId;

let mainOrganization;

let firstPost;
let secondPost;
let thirdPost;

beforeAll(async () => {
  // Initializing a seed data to test on by
  // creating 3 emails one that holds the main organization
  // the 2 emails just to like and comment on the testing posts
  // then creating 3 posts that can be sorted
  // according to the available criterias.

  try {
    require('dotenv').config();
    await database.connect();

    const mainEmail = `${shortid.generate().toLowerCase()}@test.com`;
    await getToken(mainEmail);
    mainUserId = await getUserId(mainEmail);

    const secondEmail = `${shortid.generate().toLowerCase()}@test.com`;
    await getToken(secondEmail);
    secondUserId = await getUserId(secondEmail);

    const thirdEmail = `${shortid.generate().toLowerCase()}@test.com`;
    await getToken(thirdEmail);
    thirdUserId = await getUserId(thirdEmail);

    // adding an organization
    const organization = new Organization({
      name: 'mainOrganization',
      description:
        'mainOrganization for testing the postsByOrganization resolver',
      isPublic: true,
      visibileInSearch: true,
      status: 'ACTIVE',
      members: [mainUserId],
      admins: [mainUserId],
      groupChats: [],
      posts: [],
      membershipRequests: [],
      blockedUsers: [],
      image: '',
      creator: mainUserId,
    });
    mainOrganization = await organization.save();

    // adding posts
    const createFirstPost = new Post({
      status: 'ACTIVE',
      likedBy: [mainUserId],
      likeCount: 1,
      comments: [],
      text: 'a',
      title: 'a',
      imageUrl: 'a.png',
      videoUrl: 'a',
      creator: mainUserId,
      organization: mainOrganization._id,
    });
    firstPost = await createFirstPost.save();
    const createSecondPost = new Post({
      status: 'ACTIVE',
      likedBy: [mainUserId, secondUserId],
      likeCount: 2,
      comments: [],
      text: 'b',
      title: 'b',
      imageUrl: 'b.png',
      videoUrl: 'b',
      creator: mainUserId,
      organization: mainOrganization._id,
    });
    secondPost = await createSecondPost.save();
    const createThirdPost = new Post({
      status: 'ACTIVE',
      likedBy: [mainUserId, secondUserId, thirdUserId],
      likeCount: 3,
      comments: [],
      text: 'c',
      title: 'c',
      imageUrl: 'c.png',
      videoUrl: 'c',
      creator: mainUserId,
      organization: mainOrganization._id,
    });
    thirdPost = await createThirdPost.save();

    // adding one comment for the first post, 2 for the second post and 3 for the third post
    //first post
    const createFirstPostComment1 = new Comment({
      likedBy: [],
      likeCount: 0,
      status: 'ACTIVE',
      text: 'first post comment 1',
      creator: mainUserId,
      post: firstPost._id,
    });
    const firstPostComment1 = await createFirstPostComment1.save();
    firstPost.comments = [firstPostComment1._id];
    firstPost.commentCount = 1;
    firstPost = await firstPost.save();
    //second post
    const createSecondPostComment1 = new Comment({
      likedBy: [],
      likeCount: 0,
      status: 'ACTIVE',
      text: 'second post comment 1',
      creator: mainUserId,
      post: secondPost._id,
    });
    const createSecondPostComment2 = new Comment({
      likedBy: [],
      likeCount: 0,
      status: 'ACTIVE',
      text: 'second post comment 2',
      creator: secondUserId,
      post: secondPost._id,
    });
    const secondPostComment1 = await createSecondPostComment1.save();
    const secondPostComment2 = await createSecondPostComment2.save();
    secondPost.comments = [secondPostComment1._id, secondPostComment2._id];
    secondPost.commentCount = 2;
    secondPost = await secondPost.save();
    //third post
    const createThirdPostComment1 = new Comment({
      likedBy: [],
      likeCount: 0,
      status: 'ACTIVE',
      text: 'third post comment 1',
      creator: mainUserId,
      post: thirdPost._id,
    });
    const createThirdPostComment2 = new Comment({
      likedBy: [],
      likeCount: 0,
      status: 'ACTIVE',
      text: 'third post comment 2',
      creator: secondUserId,
      post: thirdPost._id,
    });
    const createThirdPostComment3 = new Comment({
      likedBy: [],
      likeCount: 0,
      status: 'ACTIVE',
      text: 'third post comment 3',
      creator: thirdUserId,
      post: thirdPost._id,
    });
    const thirdPostComment1 = await createThirdPostComment1.save();
    const thirdPostComment2 = await createThirdPostComment2.save();
    const thirdPostComment3 = await createThirdPostComment3.save();
    thirdPost.comments = [
      thirdPostComment1._id,
      thirdPostComment2._id,
      thirdPostComment3._id,
    ];
    thirdPost.commentCount = 3;
    thirdPost = await thirdPost.save();

    firstPost = { ...firstPost._doc };
    secondPost = { ...secondPost._doc };
    thirdPost = { ...thirdPost._doc };

    firstPost._id = firstPost._id.toString();
    secondPost._id = secondPost._id.toString();
    thirdPost._id = thirdPost._id.toString();
  } catch (err) {
    console.log('error: ', err.message);
  }
});

afterAll(async () => {
  // deleting by id in case of external data
  await Comment.deleteMany({ post: firstPost._id });
  await Comment.deleteMany({ post: secondPost._id });
  await Comment.deleteMany({ post: thirdPost._id });

  await Post.deleteMany({ creator: mainUserId });

  await Organization.findByIdAndDelete(mainOrganization._id);

  await User.findByIdAndDelete(mainUserId);
  await User.findByIdAndDelete(secondUserId);
  await User.findByIdAndDelete(thirdUserId);

  database.disconnect();
});

describe('postsByOrganization sorting choices', () => {
  test('id_ASC', async () => {
    const response = await axios.post(URL, {
      query: `query {
                postsByOrganization (id: "${mainOrganization._id}", orderBy: id_ASC) {
					_id
					text
					creator {
						firstName
						email
					}
					likedBy {
						firstName
					}
                }
            }`,
    });
    const posts = response.data.data.postsByOrganization;
    expect(Array.isArray(posts)).toBeTruthy();
    expect(posts[0]._id).toBe(firstPost._id);
    expect(posts[1]._id).toBe(secondPost._id);
    expect(posts[2]._id).toBe(thirdPost._id);
  });

  test('id_DESC', async () => {
    const response = await axios.post(URL, {
      query: `query {
                postsByOrganization (id: "${mainOrganization._id}", orderBy: id_DESC) {
					_id
					text
					creator {
						firstName
						email
					}
					likedBy {
						firstName
					}
                }
            }`,
    });
    const posts = response.data.data.postsByOrganization;
    expect(Array.isArray(posts)).toBeTruthy();
    expect(posts[0]._id).toBe(thirdPost._id);
    expect(posts[1]._id).toBe(secondPost._id);
    expect(posts[2]._id).toBe(firstPost._id);
  });

  test('text_ASC', async () => {
    const response = await axios.post(URL, {
      query: `query {
                postsByOrganization (id: "${mainOrganization._id}", orderBy: text_ASC) {
					_id
					text
					creator {
						firstName
						email
					}
					likedBy {
						firstName
					}
                }
            }`,
    });
    const posts = response.data.data.postsByOrganization;
    expect(Array.isArray(posts)).toBeTruthy();
    expect(posts[0]._id).toBe(firstPost._id);
    expect(posts[1]._id).toBe(secondPost._id);
    expect(posts[2]._id).toBe(thirdPost._id);
  });

  test('text_DESC', async () => {
    const response = await axios.post(URL, {
      query: `query {
                postsByOrganization (id: "${mainOrganization._id}", orderBy: text_DESC) {
					_id
					text
					creator {
						firstName
						email
					}
					likedBy {
						firstName
					}
                }
            }`,
    });
    const posts = response.data.data.postsByOrganization;
    expect(Array.isArray(posts)).toBeTruthy();
    expect(posts[0]._id).toBe(thirdPost._id);
    expect(posts[1]._id).toBe(secondPost._id);
    expect(posts[2]._id).toBe(firstPost._id);
  });

  test('title_ASC', async () => {
    const response = await axios.post(URL, {
      query: `query {
                postsByOrganization (id: "${mainOrganization._id}", orderBy: title_ASC) {
					_id
					text
					creator {
						firstName
						email
					}
					likedBy {
						firstName
					}
                }
            }`,
    });
    const posts = response.data.data.postsByOrganization;
    expect(Array.isArray(posts)).toBeTruthy();
    expect(posts[0]._id).toBe(firstPost._id);
    expect(posts[1]._id).toBe(secondPost._id);
    expect(posts[2]._id).toBe(thirdPost._id);
  });

  test('title_DESC', async () => {
    const response = await axios.post(URL, {
      query: `query {
                postsByOrganization (id: "${mainOrganization._id}", orderBy: title_DESC) {
					_id
					text
					creator {
						firstName
						email
					}
					likedBy {
						firstName
					}
                }
            }`,
    });
    const posts = response.data.data.postsByOrganization;
    expect(Array.isArray(posts)).toBeTruthy();
    expect(posts[0]._id).toBe(thirdPost._id);
    expect(posts[1]._id).toBe(secondPost._id);
    expect(posts[2]._id).toBe(firstPost._id);
  });

  test('createdAt_ASC', async () => {
    const response = await axios.post(URL, {
      query: `query {
                postsByOrganization (id: "${mainOrganization._id}", orderBy: createdAt_ASC) {
					_id
					text
					creator {
						firstName
						email
					}
					likedBy {
						firstName
					}
                }
            }`,
    });
    const posts = response.data.data.postsByOrganization;
    expect(Array.isArray(posts)).toBeTruthy();
    expect(posts[0]._id).toBe(firstPost._id);
    expect(posts[1]._id).toBe(secondPost._id);
    expect(posts[2]._id).toBe(thirdPost._id);
  });

  test('createdAt_DESC', async () => {
    const response = await axios.post(URL, {
      query: `query {
                postsByOrganization (id: "${mainOrganization._id}", orderBy: createdAt_DESC) {
					_id
					text
					creator {
						firstName
						email
					}
					likedBy {
						firstName
					}
                }
            }`,
    });
    const posts = response.data.data.postsByOrganization;
    expect(Array.isArray(posts)).toBeTruthy();
    expect(posts[0]._id).toBe(thirdPost._id);
    expect(posts[1]._id).toBe(secondPost._id);
    expect(posts[2]._id).toBe(firstPost._id);
  });

  test('videoUrl_ASC', async () => {
    const response = await axios.post(URL, {
      query: `query {
                postsByOrganization (id: "${mainOrganization._id}", orderBy: videoUrl_ASC) {
					_id
					text
					creator {
						firstName
						email
					}
					likedBy {
						firstName
					}
                }
            }`,
    });
    const posts = response.data.data.postsByOrganization;
    expect(Array.isArray(posts)).toBeTruthy();
    expect(posts[0]._id).toBe(firstPost._id);
    expect(posts[1]._id).toBe(secondPost._id);
    expect(posts[2]._id).toBe(thirdPost._id);
  });

  test('videoUrl_DESC', async () => {
    const response = await axios.post(URL, {
      query: `query {
                postsByOrganization (id: "${mainOrganization._id}", orderBy: videoUrl_DESC) {
					_id
					text
					creator {
						firstName
						email
					}
					likedBy {
						firstName
					}
                }
            }`,
    });
    const posts = response.data.data.postsByOrganization;
    expect(Array.isArray(posts)).toBeTruthy();
    expect(posts[0]._id).toBe(thirdPost._id);
    expect(posts[1]._id).toBe(secondPost._id);
    expect(posts[2]._id).toBe(firstPost._id);
  });

  test('imageUrl_ASC', async () => {
    const response = await axios.post(URL, {
      query: `query {
                postsByOrganization (id: "${mainOrganization._id}", orderBy: imageUrl_ASC) {
					_id
					text
          likeCount
          commentCount
					creator {
						firstName
						email
					}
					likedBy {
						firstName
					}
                }
            }`,
    });
    const posts = response.data.data.postsByOrganization;
    expect(Array.isArray(posts)).toBeTruthy();

    expect(posts[0]._id).toBe(firstPost._id);
    expect(posts[1]._id).toBe(secondPost._id);
    expect(posts[2]._id).toBe(thirdPost._id);
  });

  test('imageUrl_DESC', async () => {
    const response = await axios.post(URL, {
      query: `query {
                postsByOrganization (id: "${mainOrganization._id}", orderBy: imageUrl_DESC) {
					_id
					text
          likeCount
          commentCount
					creator {
						firstName
						email
					}
					likedBy {
						firstName
					}
                }
            }`,
    });
    const posts = response.data.data.postsByOrganization;
    expect(Array.isArray(posts)).toBeTruthy();
    expect(posts[0]._id).toBe(thirdPost._id);
    expect(posts[1]._id).toBe(secondPost._id);
    expect(posts[2]._id).toBe(firstPost._id);
  });

  test('likeCount_ASC', async () => {
    const response = await axios.post(URL, {
      query: `query {
                postsByOrganization (id: "${mainOrganization._id}", orderBy: likeCount_ASC) {
					_id
					text
          likeCount
          commentCount
					creator {
						firstName
						email
					}
					likedBy {
						firstName
					}
                }
            }`,
    });
    const posts = response.data.data.postsByOrganization;
    expect(Array.isArray(posts)).toBeTruthy();

    expect(posts[0]._id).toBe(firstPost._id);
    expect(posts[1]._id).toBe(secondPost._id);
    expect(posts[2]._id).toBe(thirdPost._id);
  });

  test('likeCount_DESC', async () => {
    const response = await axios.post(URL, {
      query: `query {
                postsByOrganization (id: "${mainOrganization._id}", orderBy: likeCount_DESC) {
					_id
					text
          likeCount
          commentCount
					creator {
						firstName
						email
					}
					likedBy {
						firstName
					}
                }
            }`,
    });
    const posts = response.data.data.postsByOrganization;
    expect(Array.isArray(posts)).toBeTruthy();
    expect(posts[0]._id).toBe(thirdPost._id);
    expect(posts[1]._id).toBe(secondPost._id);
    expect(posts[2]._id).toBe(firstPost._id);
  });

  test('commentCount_ASC', async () => {
    const response = await axios.post(URL, {
      query: `query {
                postsByOrganization (id: "${mainOrganization._id}", orderBy: commentCount_ASC) {
					_id
					text
					creator {
						firstName
						email
					}
					likedBy {
						firstName
					}
                }
            }`,
    });
    const posts = response.data.data.postsByOrganization;
    expect(Array.isArray(posts)).toBeTruthy();
    expect(posts[0]._id).toBe(firstPost._id);
    expect(posts[1]._id).toBe(secondPost._id);
    expect(posts[2]._id).toBe(thirdPost._id);
  });

  test('commentCount_DESC', async () => {
    const response = await axios.post(URL, {
      query: `query {
                postsByOrganization (id: "${mainOrganization._id}", orderBy: commentCount_DESC) {
					_id
					text
					creator {
						firstName
						email
					}
					likedBy {
						firstName
					}
                }
            }`,
    });
    const posts = response.data.data.postsByOrganization;
    expect(Array.isArray(posts)).toBeTruthy();
    expect(posts[0]._id).toBe(thirdPost._id);
    expect(posts[1]._id).toBe(secondPost._id);
    expect(posts[2]._id).toBe(firstPost._id);
  });
});
