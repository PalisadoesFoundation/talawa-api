const shortid = require('shortid');
const Tenant = require('../../lib/models/Tenant');
const connectionManager = require('../../lib/ConnectionManager');

const database = require('../../db');
const getUserIdFromSignUp = require('../functions/getUserIdFromSignup');
const Organization = require('../../lib/models/Organization');
const User = require('../../lib/models/User');
// const Post = require('../../lib/models/Post');
const tenantUrl =
  'mongodb://localhost:27017/org-tenant?retryWrites=true&w=majority';

let adminId;

let organizationId;

beforeAll(async () => {
  // setting up 1 org, one user with 1 tenant record (on the main database).
  require('dotenv').config();
  await database.connect();

  const adminEmail = `${shortid.generate().toLowerCase()}@test.com`;
  adminId = await getUserIdFromSignUp(adminEmail);

  const organization = new Organization({
    name: 'tenant organization',
    description: 'testing org',
    isPublic: true,
    visibileInSearch: true,
    status: 'ACTIVE',
    members: [adminId],
    admins: [adminId],
    posts: [],
    membershipRequests: [],
    blockedUsers: [],
    groupChats: [],
    image: '',
    creator: adminId,
  });
  const savedOrg = await organization.save();
  organizationId = savedOrg._id;

  const admin = await User.findById(adminId);
  admin.overwrite({
    ...admin._doc,
    joinedOrganizations: [organizationId],
    createdOrganizations: [organizationId],
    adminFor: [organizationId],
  });
  await admin.save();

  const tenant = new Tenant({
    organization: organizationId,
    url: tenantUrl,
  });
  await tenant.save();
  await connectionManager.initTenants();
});

afterAll(async () => {
  await User.findByIdAndDelete(adminId);
  await Organization.findByIdAndDelete(organizationId);
  await database.disconnect();
  await connectionManager.destroyConnections();
});

describe('tenant is working and transparent from main db', () => {
  test('getConnection', async () => {
    const conn = connectionManager.getTenantConnection(organizationId);
    const newPost = new conn.Post({
      status: 'ACTIVE',
      likedBy: [adminId],
      likeCount: 1,
      comments: [],
      text: 'a',
      title: 'a',
      imageUrl: 'a.png',
      videoUrl: 'a',
      creator: adminId,
      organization: organizationId,
    });
    await newPost.save();
    const [savedPost] = await conn.Post.find();
    console.log(savedPost);
    expect(savedPost).toBeTruthy();
  });
});
