const Posts = require('../../../lib/resolvers/post_query/posts');
const createOrganization = require('../../../lib/resolvers/organization_mutations/createOrganization');
const createPost = require('../../../lib/resolvers/post_mutations/createPost');
const database = require('../../../db');
const shortid = require('shortid');
const getUserIdFromSignup = require('../../functions/getUserIdFromSignup');

let token;

beforeAll(async () => {
  require('dotenv').config(); // pull env variables from .env file
  await database.connect();
  let generatedEmail = `${shortid.generate().toLowerCase()}@test.com`;
  token = await getUserIdFromSignup(generatedEmail);

  const OrgData = {
    name: 'test org',
    description: 'test description',
    isPublic: true,
    visibleInSearch: true,
  };
  let args = { data: OrgData };
  const newOrg = await createOrganization({}, args, { userId: token });

  args = {
    data: {
      text: 'test post',
      organizationId: newOrg._id,
    },
  };
  await createPost({}, args, { userId: token });
});
afterAll(() => {
  database.disconnect();
});

describe('Posts Query testing', () => {
  test('Get Posts', async () => {
    const args = {
      orderBy: 'id_ASC',
    };
    const response = await Posts({}, args, { userId: token });
    //Posts should be an array
    expect(response).toEqual(expect.any(Array));
  });
});
