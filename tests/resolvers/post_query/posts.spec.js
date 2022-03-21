const GetPosts = require('../../../lib/resolvers/post_query/posts');
const createOrganization = require('../../../lib/resolvers/organization_mutations/createOrganization');
const database = require('../../../db');
const OrganizationModal = require('../../../lib/models/Organization');
const PostModal = require('../../../lib/models/Post');
const shortid = require('shortid');
const getUserIdFromSignup = require('../../functions/getUserIdFromSignup');

const mongodb = require('mongodb');

let UserId;

let Posts = [];
beforeAll(async () => {
  require('dotenv').config(); // pull env variables from .env file
  await database.connect();
  let generatedEmail = `${shortid.generate().toLowerCase()}@test.com`;
  UserId = await getUserIdFromSignup(generatedEmail);

  const OrgData = {
    name: 'test org',
    description: 'test description',
    isPublic: true,
    visibleInSearch: true,
  };
  let args = { data: OrgData };
  const newOrg = await createOrganization({}, args, { userId: UserId });
  for (let i = 1; i < 3; i++) {
    const textValue = `${i} test post`;
    const titleValue = `${i} test title`;
    const imageUrlValue = `${i} test image url`;
    const videoUrlValue = `${i} test video url`;
    let LikedPosts = [];
    let Comments = [];
    for (let i = 0; i < Math.floor(Math.random() * 10 + 1); i++) {
      LikedPosts.push(mongodb.ObjectID());
    }
    for (let i = 0; i < Math.floor(Math.random() * 10 + 1); i++) {
      Comments.push(mongodb.ObjectID());
    }
    console.log(LikedPosts);
    const PostData = {
      text: textValue,
      title: titleValue,
      imageUrl: imageUrlValue,
      videoUrl: videoUrlValue,
      organization: newOrg._id,
      likedBy: [...LikedPosts],
      comments: [...Comments],
      creator: UserId,
    };
    const NewPost = await PostModal.create(PostData);
    Posts.push(NewPost);
  }
});
afterAll(async () => {
  await OrganizationModal.deleteMany({});
  await PostModal.deleteMany({});
  database.disconnect();
});

describe('Posts Query testing', () => {
  test('Get Posts', async () => {
    const response = await GetPosts({}, {}, { userId: UserId });
    //Posts should be an array
    expect(response[0].text).toEqual(Posts[0].text);
    expect(response).toEqual(expect.any(Array));
  });
  test('Get Posts with orderBy id_ASC', async () => {
    const args = {
      orderBy: 'id_ASC',
    };
    const response = await GetPosts({}, args, { userId: UserId });
    //Posts should be an array
    expect(response[0]._id).toEqual(Posts[0]._id);
  });
  test('Get Posts with orderBy id_DESC', async () => {
    const args = {
      orderBy: 'id_DESC',
    };
    const response = await GetPosts({}, args, { userId: UserId });
    //Posts should be an array
    const lastPost = Posts.length - 1;
    expect(response[0]._id).toEqual(Posts[lastPost]._id);
  });
  test('Get Posts with orderBy text_ASC', async () => {
    const args = {
      orderBy: 'text_ASC',
    };
    const response = await GetPosts({}, args, { userId: UserId });
    // Sort the posts by text
    const sortedPosts = Posts.sort((a, b) => {
      return a.text.localeCompare(b.text);
    });
    //Posts should be an array
    expect(response[0].text).toEqual(sortedPosts[0].text);
  });
  test('Get Posts with orderBy text_DESC', async () => {
    const args = {
      orderBy: 'text_DESC',
    };
    const response = await GetPosts({}, args, { userId: UserId });
    // Sort the posts by text
    const sortedPosts = Posts.sort((a, b) => {
      return a.text.localeCompare(b.text);
    });
    //Posts should be an array
    expect(response[0].text).toEqual(Posts[sortedPosts.length - 1].text);
  });
  test('Get Posts with orderBy title_ASC', async () => {
    const args = {
      orderBy: 'title_ASC',
    };
    const response = await GetPosts({}, args, { userId: UserId });
    // Sort the posts by title
    const sortedPosts = Posts.sort((a, b) => {
      return a.title.localeCompare(b.title);
    });
    //Posts should be an array
    expect(response[0].title).toEqual(sortedPosts[0].title);
  });
  test('Get Posts with orderBy title_DESC', async () => {
    const args = {
      orderBy: 'title_DESC',
    };
    const response = await GetPosts({}, args, { userId: UserId });
    // Sort the posts by title
    const sortedPosts = Posts.sort((a, b) => {
      return a.title.localeCompare(b.title);
    });
    //Posts should be an array
    expect(response[0].title).toEqual(
      sortedPosts[sortedPosts.length - 1].title
    );
  });
  test('Get Posts with orderBy createdAt_ASC', async () => {
    const args = {
      orderBy: 'createdAt_ASC',
    };
    const response = await GetPosts({}, args, { userId: UserId });
    // Sort the posts by createdAt
    const sortedPosts = Posts.sort((a, b) => {
      return a.createdAt - b.createdAt;
    });
    //Posts should be an array
    expect(response[0].createdAt).toEqual(sortedPosts[0].createdAt);
  });
  test('Get Posts with orderBy createdAt_DESC', async () => {
    const args = {
      orderBy: 'createdAt_DESC',
    };
    const response = await GetPosts({}, args, { userId: UserId });
    // Sort the posts by createdAt
    const sortedPosts = Posts.sort((a, b) => {
      return a.createdAt - b.createdAt;
    });
    //Posts should be an array
    expect(response[0].createdAt).toEqual(
      sortedPosts[sortedPosts.length - 1].createdAt
    );
  });
  test('Get Posts with orderBy imageUrl_ASC', async () => {
    const args = {
      orderBy: 'imageUrl_ASC',
    };
    const response = await GetPosts({}, args, { userId: UserId });
    // Sort the posts by imageUrl
    const sortedPosts = Posts.sort((a, b) => {
      return a.imageUrl.localeCompare(b.imageUrl);
    });
    //Posts should be an array
    expect(response[0].imageUrl).toEqual(sortedPosts[0].imageUrl);
  });
  test('Get Posts with orderBy imageUrl_DESC', async () => {
    const args = {
      orderBy: 'imageUrl_DESC',
    };
    const response = await GetPosts({}, args, { userId: UserId });
    // Sort the posts by imageUrl
    const sortedPosts = Posts.sort((a, b) => {
      return a.imageUrl.localeCompare(b.imageUrl);
    });
    //Posts should be an array
    expect(response[0].imageUrl).toEqual(
      sortedPosts[sortedPosts.length - 1].imageUrl
    );
  });
  test('Get Posts with orderBy videoUrl_ASC', async () => {
    const args = {
      orderBy: 'videoUrl_ASC',
    };
    const response = await GetPosts({}, args, { userId: UserId });
    // Sort the posts by videoUrl
    const sortedPosts = Posts.sort((a, b) => {
      return a.videoUrl.localeCompare(b.videoUrl);
    });
    //Posts should be an array
    expect(response[0].videoUrl).toEqual(sortedPosts[0].videoUrl);
  });
  test('Get Posts with orderBy videoUrl_DESC', async () => {
    const args = {
      orderBy: 'imageUrl_DESC',
    };
    const response = await GetPosts({}, args, { userId: UserId });
    // Sort the posts by videoUrl
    const sortedPosts = Posts.sort((a, b) => {
      return a.videoUrl.localeCompare(b.videoUrl);
    });
    expect(response[0].videoUrl).toEqual(
      sortedPosts[sortedPosts.length - 1].videoUrl
    );
  });
});
