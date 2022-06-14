const blockUser = require('../../../lib/resolvers/block_user_mutations/block_user');
const shortid = require('shortid');
const {
  Types: { ObjectId },
} = require('mongoose');

const database = require('../../../db');
const getUserIdFromSignup = require('../../functions/getUserIdFromSignup');
const User = require('../../../lib/models/User');
const Organization = require('../../../lib/models/Organization');
const {
  ORGANIZATION_NOT_FOUND,
  USER_NOT_FOUND,
  USER_NOT_AUTHORIZED,
} = require('../../../constants');

let mainOrganization;
let organizationId;
let mainOrganizationAdminId;

let secondaryUserId;

let normalUserId;

beforeAll(async () => {
  // we would have 3 users 1 is admin of mainOrganization,
  // and 2 other users.
  require('dotenv').config();
  await database.connect();

  let mainOrganizationAdminEmail = `${shortid
    .generate()
    .toLowerCase()}@test.com`;
  mainOrganizationAdminId = await getUserIdFromSignup(
    mainOrganizationAdminEmail
  );

  let secondaryUserEmail = `${shortid.generate().toLowerCase()}@test.com`;
  secondaryUserId = await getUserIdFromSignup(secondaryUserEmail);

  let normalUserEmail = `${shortid.generate().toLowerCase()}@test.com`;
  normalUserId = await getUserIdFromSignup(normalUserEmail);

  const organization = new Organization({
    name: 'mainOrganization',
    description:
      'mainOrganization for testing the postsByOrganization resolver',
    isPublic: true,
    visibileInSearch: true,
    status: 'ACTIVE',
    members: [],
    admins: [mainOrganizationAdminId],
    groupChats: [],
    posts: [],
    membershipRequests: [],
    blockedUsers: [],
    image: '',
    creator: mainOrganizationAdminId,
  });
  mainOrganization = await organization.save();
  organizationId = mainOrganization._id;
});
afterAll(async () => {
  // delete the organization
  await Organization.findByIdAndDelete(mainOrganization._id);
  // delete users
  await User.findByIdAndDelete(mainOrganizationAdminId);
  await User.findByIdAndDelete(secondaryUserId);
  await User.findByIdAndDelete(normalUserId);
  await database.disconnect();
});

describe('block user tests', () => {
  test("user isn't an admin of the org", async () => {
    await expect(async () => {
      await blockUser(
        {},
        { organizationId, userId: normalUserId },
        { userId: secondaryUserId }
      );
    }).rejects.toThrow(USER_NOT_AUTHORIZED);
  });
  test("organization doesn't exist", async () => {
    await expect(async () => {
      await blockUser(
        {},
        { organizationId: new ObjectId(), userId: normalUserId },
        { userId: mainOrganizationAdminId }
      );
    }).rejects.toThrow(ORGANIZATION_NOT_FOUND);
  });

  test("user doesn't exist", async () => {
    await expect(async () => {
      await blockUser(
        {},
        { organizationId, userId: new ObjectId() },
        { userId: mainOrganizationAdminId }
      );
    }).rejects.toThrow(USER_NOT_FOUND);
  });

  test('a valid block request', async () => {
    const receivedUser = await blockUser(
      {},
      { organizationId, userId: normalUserId },
      { userId: mainOrganizationAdminId }
    );
    expect(receivedUser._id.toString()).toEqual(normalUserId);
    expect(receivedUser.organizationsBlockedBy[0]).toEqual(organizationId);
  });

  test('blocking an already blocked user', async () => {
    await expect(async () => {
      await blockUser(
        {},
        { organizationId, userId: normalUserId },
        { userId: mainOrganizationAdminId }
      );
    }).rejects.toThrow(USER_NOT_AUTHORIZED);
  });

  test('blockedUsers inside organization contains the blocked user', async () => {
    const organization = await Organization.findById(organizationId);

    const blockedUsers = organization.blockedUsers;
    expect(blockedUsers[0].toString()).toEqual(normalUserId);
  });
});
