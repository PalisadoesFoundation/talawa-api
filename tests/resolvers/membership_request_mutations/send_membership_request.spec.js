const shortid = require('shortid');
const sendMembershipRequest = require('../../../lib/resolvers/membership_request_mutations/send_membership_request');
const {
  Types: { ObjectId },
} = require('mongoose');

const database = require('../../../db');
const getUserIdFromSignUp = require('../../functions/getUserIdFromSignup');
const Organization = require('../../../lib/models/Organization');
const User = require('../../../lib/models/User');
const MembershipRequest = require('../../../lib/models/MembershipRequest');
const {
  ORGANIZATION_NOT_FOUND,
  USER_NOT_FOUND,
  MEMBERSHIP_REQUEST_ALREADY_EXIST,
} = require('../../../constants');

let adminId;
let memberId;
let membershipRequesterId;

let organizationId;
let validMembershipRequestId;
let invalidOrgMembershipRequestId;
let invalidUserMembershipRequestId;

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
    description:
      'an organization for testing the send_membership_request resolver',
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

  const savedMembershipRequest = await membershipRequest.save();
  validMembershipRequestId = savedMembershipRequest._id;

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

  await database.disconnect();
});

describe('send membership request', () => {
  test("user doesn't exist", async () => {
    await expect(async () => {
      await sendMembershipRequest(
        {},
        { membershipRequestId: invalidUserMembershipRequestId },
        { userId: new ObjectId() }
      );
    }).rejects.toThrow(USER_NOT_FOUND);
  });

  test("organization doesn't exist", async () => {
    await expect(async () => {
      await sendMembershipRequest(
        {},
        { membershipRequestId: invalidOrgMembershipRequestId },
        { userId: adminId }
      );
    }).rejects.toThrow(ORGANIZATION_NOT_FOUND);
  });

  test('membership already exist', async () => {
    await expect(async () => {
      await sendMembershipRequest(
        {},
        { organizationId },
        { userId: membershipRequesterId }
      );
    }).rejects.toThrow(MEMBERSHIP_REQUEST_ALREADY_EXIST);
  });

  test('a valid accept member', async () => {
    const membershipRequest = await sendMembershipRequest(
      {},
      {
        membershipRequestId: validMembershipRequestId,
        organizationId,
      },
      { userId: adminId }
    );
    const org = await Organization.findById(organizationId);
    const user = await User.findById(membershipRequesterId);

    expect(membershipRequest).toBeTruthy();
    expect(org.membershipRequests.length).toBeTruthy();
    expect(user.membershipRequests.length).toBeTruthy();
  });
});
