const unblockUser = require('../../../lib/resolvers/block_user_mutations/unblock_user');
const blockUser = require('../../../lib/resolvers/block_user_mutations/block_user');
const shortid = require('shortid');
const {
  Types: { ObjectId },
} = require('mongoose');
const database = require('../../../db');
const getUserIdFromSignup = require('../../functions/getUserIdFromSignup');
const { User, Organization } = require('../../../lib/models');
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

describe('unblock user tests', () => {
  test("user isn't the admin of the org", async () => {
    await expect(async () => {
      await unblockUser(
        {},
        { organizationId, userId: normalUserId },
        { userId: secondaryUserId }
      );
    }).rejects.toThrow(USER_NOT_AUTHORIZED);
  });

  test("organization doesn't exist", async () => {
    await expect(async () => {
      await unblockUser(
        {},
        { organizationId: new ObjectId(), userId: normalUserId },
        { userId: mainOrganizationAdminId }
      );
    }).rejects.toThrow(ORGANIZATION_NOT_FOUND);
  });

  test("user doesn't exist", async () => {
    await expect(async () => {
      await unblockUser(
        {},
        { organizationId, userId: new ObjectId() },
        { userId: mainOrganizationAdminId }
      );
    }).rejects.toThrow(USER_NOT_FOUND);
  });

  test('unblocking a non blocked user', async () => {
    await expect(async () => {
      await unblockUser(
        {},
        { organizationId, userId: normalUserId },
        { userId: mainOrganizationAdminId }
      );
    }).rejects.toThrow(USER_NOT_AUTHORIZED);
  });

  test('a valid unblock request', async () => {
    await blockUser(
      {},
      { organizationId, userId: normalUserId },
      { userId: mainOrganizationAdminId }
    );

    const unblockUserResponse = await unblockUser(
      {},
      { organizationId, userId: normalUserId },
      { userId: mainOrganizationAdminId }
    );

    const organization = unblockUserResponse.organizationsBlockedBy.find(
      (org) => org._id === mainOrganization._id
    );
    expect(unblockUserResponse._id.toString()).toEqual(normalUserId);
    expect(organization).toEqual(undefined);
  });

  test('blockedUsers inside organization does not contain the unblocked user', async () => {
    const organization = await Organization.findById(organizationId);

    const blockedUsers = organization.blockedUsers;
    const blockedUser = blockedUsers.find((u) => u._id === normalUserId);
    expect(blockedUser).toBeFalsy();
    expect(blockedUser).toBe(undefined);
  });
});
