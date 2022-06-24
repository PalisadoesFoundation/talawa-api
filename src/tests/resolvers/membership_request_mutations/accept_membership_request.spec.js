const shortid = require('shortid');
const acceptMembershipRequest = require('../../../lib/resolvers/membership_request_mutations/accept_membership_request');
const {
  Types: { ObjectId },
} = require('mongoose');

const database = require('../../../db');
const getUserIdFromSignUp = require('../../functions/getUserIdFromSignup');
const {
  Organization,
  User,
  MembershipRequest,
} = require('../../../lib/models');
const {
  MEMBERSHIP_REQUEST_NOT_FOUND,
  ORGANIZATION_NOT_FOUND,
  USER_NOT_FOUND,
  USER_NOT_AUTHORIZED,
  USER_ALREADY_MEMBER,
} = require('../../../constants');

let adminId;
let memberId;
let membershipRequesterId;

let organizationId;
let validMembershipRequestId;
let invalidOrgMembershipRequestId;
let invalidUserMembershipRequestId;
let alreadyMemberMembershipRequestId;

beforeAll(async () => {
  // we need 1 org, 1 admin, 1 requester, 1 member
  require('dotenv').config();
  await database.connect();

  const adminEmail = `${shortid.generate().toLowerCase()}@test.com`;
  adminId = await getUserIdFromSignUp(adminEmail);

  const memberEmail = `${shortid.generate().toLowerCase()}@test.com`;
  memberId = await getUserIdFromSignUp(memberEmail);

  const membershipRequesterEmail = `${shortid
    .generate()
    .toLowerCase()}@test.com`;
  membershipRequesterId = await getUserIdFromSignUp(membershipRequesterEmail);

  const organization = new Organization({
    name: 'an organization',
    description: 'an organization for testing the removeOrganization resolver',
    isPublic: true,
    visibileInSearch: true,
    status: 'ACTIVE',
    members: [adminId, memberId],
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

  const membershipRequest = new MembershipRequest({
    organization: organizationId,
    user: membershipRequesterId,
  });
  const invalidOrgMembershipRequest = new MembershipRequest({
    organization: new ObjectId(),
    user: membershipRequesterId,
  });
  const invalidUserMembershipRequest = new MembershipRequest({
    organization: organizationId,
    user: new ObjectId(),
  });
  const alreadyMemberMembershipRequest = new MembershipRequest({
    organization: organizationId,
    user: memberId,
  });

  const savedMembershipRequest = await membershipRequest.save();
  validMembershipRequestId = savedMembershipRequest._id;

  const savedAlreadyMemberMembershipRequest =
    await alreadyMemberMembershipRequest.save();
  alreadyMemberMembershipRequestId = savedAlreadyMemberMembershipRequest._id;

  const savedInvalidOrgMembershipRequest =
    await invalidOrgMembershipRequest.save();
  invalidOrgMembershipRequestId = savedInvalidOrgMembershipRequest._id;

  const savedInvalidUserMembershipRequest =
    await invalidUserMembershipRequest.save();
  invalidUserMembershipRequestId = savedInvalidUserMembershipRequest._id;

  const admin = await User.findById(adminId);
  admin.overwrite({
    ...admin._doc,
    joinedOrganizations: [organizationId],
    createdOrganizations: [organizationId],
    adminFor: [organizationId],
  });
  await admin.save();

  const member = await User.findById(memberId);
  member.overwrite({
    ...member._doc,
    joinedOrganizations: [organizationId],
  });
  await member.save();

  const membershipRequester = await User.findById(membershipRequesterId);
  membershipRequester.overwrite({
    ...membershipRequester._doc,
    membershipRequests: [validMembershipRequestId],
  });
  await membershipRequester.save();

  savedOrg.overwrite({
    ...savedOrg._doc,
    membershipRequests: [validMembershipRequestId],
  });
  await savedOrg.save();
});

afterAll(async () => {
  await User.findByIdAndDelete(adminId);
  await User.findByIdAndDelete(membershipRequesterId);
  await User.findByIdAndDelete(memberId);

  await Organization.findByIdAndDelete(organizationId);
  await MembershipRequest.findByIdAndDelete(validMembershipRequestId);
  await MembershipRequest.findByIdAndDelete(invalidOrgMembershipRequestId);
  await MembershipRequest.findByIdAndDelete(invalidUserMembershipRequestId);
  await MembershipRequest.findByIdAndDelete(alreadyMemberMembershipRequestId);

  await database.disconnect();
});

describe('accept membership request', () => {
  test("membership request doesn't exist", async () => {
    await expect(async () => {
      await acceptMembershipRequest(
        {},
        { membershipRequestId: new ObjectId() },
        { userId: adminId }
      );
    }).rejects.toThrow(MEMBERSHIP_REQUEST_NOT_FOUND);
  });

  test("organization doesn't exist", async () => {
    await expect(async () => {
      await acceptMembershipRequest(
        {},
        { membershipRequestId: invalidOrgMembershipRequestId },
        { userId: adminId }
      );
    }).rejects.toThrow(ORGANIZATION_NOT_FOUND);
  });

  test("user doesn't exist", async () => {
    await expect(async () => {
      await acceptMembershipRequest(
        {},
        { membershipRequestId: invalidUserMembershipRequestId },
        { userId: adminId }
      );
    }).rejects.toThrow(USER_NOT_FOUND);
  });

  test('user is not the admin of the org', async () => {
    await expect(async () => {
      await acceptMembershipRequest(
        {},
        { membershipRequestId: validMembershipRequestId },
        { userId: memberId }
      );
    }).rejects.toThrow(USER_NOT_AUTHORIZED);
  });
  test('user is already a member', async () => {
    await expect(async () => {
      await acceptMembershipRequest(
        {},
        { membershipRequestId: alreadyMemberMembershipRequestId },
        { userId: adminId }
      );
    }).rejects.toThrow(USER_ALREADY_MEMBER);
  });

  test('a valid accept member', async () => {
    const membershipRequest = await acceptMembershipRequest(
      {},
      { membershipRequestId: validMembershipRequestId },
      { userId: adminId }
    );
    const savedMembershipRequest = await MembershipRequest.findById(
      validMembershipRequestId
    );
    const org = await Organization.findById(organizationId);
    const user = await User.findById(membershipRequesterId);

    expect(membershipRequest._id).toEqual(validMembershipRequestId);
    expect(savedMembershipRequest).toBeFalsy();
    expect(org.membershipRequests.length).toBeFalsy();
    expect(
      org.members
        .find((member) => member._id.toString() === membershipRequesterId)
        ._id.toString()
    ).toBe(membershipRequesterId);

    expect(user.membershipRequests.length).toBeFalsy();
    expect(user.joinedOrganizations[0].toString()).toEqual(
      organizationId.toString()
    );
  });
});
