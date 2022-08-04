const shortid = require('shortid');
const Tenant = require('../../lib/models/Tenant');
const connectionManager = require('../../lib/ConnectionManager');

const database = require('../../db');
const getUserIdFromSignUp = require('../functions/getUserIdFromSignup');
const Organization = require('../../lib/models/Organization');
const User = require('../../lib/models/User');
// const Post = require('../../lib/models/Post');
const tenantUrl =
  'mongodb://localhost:27017/org1-tenant?retryWrites=true&w=majority';
const secondTenantUrl =
  'mongodb://localhost:27017/org2-tenant?retryWrites=true&w=majority';

let adminId;
let organizationId;
let secondOrganizationId;

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
});

afterAll(async () => {
  const conn1 = connectionManager.getTenantConnection(organizationId);
  const conn2 = connectionManager.getTenantConnection(secondOrganizationId);
  await conn1.Post.deleteMany();
  await conn2.Post.deleteMany();
  await User.findByIdAndDelete(adminId);
  await Organization.findByIdAndDelete(organizationId);
  await Organization.findByIdAndDelete(secondOrganizationId);
  await Tenant.deleteMany({});
  await connectionManager.destroyConnections();
  await database.disconnect();
});

describe('tenant is working and transparent from main db', () => {
  test('initTenants and destroyConnections', async () => {
    let conn = connectionManager.getTenantConnection(organizationId);
    expect(conn).toBe(null);
    await connectionManager.initTenants();
    conn = connectionManager.getTenantConnection(organizationId);
    expect(conn).toBeTruthy();
    await connectionManager.destroyConnections();
    conn = connectionManager.getTenantConnection(organizationId);
    expect(conn).toBe(null);
    await connectionManager.initTenants();
  });
  test('addConnection', async () => {
    const organization = new Organization({
      name: 'second tenant organization',
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
    secondOrganizationId = savedOrg._id;

    const admin = await User.findById(adminId);
    admin.overwrite({
      ...admin._doc,
      joinedOrganizations: [organizationId, secondOrganizationId],
      createdOrganizations: [organizationId, secondOrganizationId],
      adminFor: [organizationId, secondOrganizationId],
    });
    await admin.save();
    const tenant = new Tenant({
      organization: secondOrganizationId,
      url: secondTenantUrl,
    });
    await tenant.save();

    const conn = await connectionManager.addTenantConnection(
      secondOrganizationId
    );
    expect(conn).toBeTruthy();
    const posts = await conn.Post.find();
    expect(posts).toEqual([]);
  });

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
    expect(savedPost).toBeTruthy();
  });

  test('Isolated tenants', async () => {
    const conn1 = connectionManager.getTenantConnection(organizationId);
    const conn2 = connectionManager.getTenantConnection(secondOrganizationId);

    const firstOrgPosts = await conn1.Post.find();
    const secondOrgPosts = await conn2.Post.find();

    expect(firstOrgPosts).toHaveLength(1);
    expect(secondOrgPosts).toHaveLength(0);
  });
});
