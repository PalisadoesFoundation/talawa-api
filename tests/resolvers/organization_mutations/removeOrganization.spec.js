/* eslint-disable no-unused-vars */
const getToken = require('../../functions/getToken');
const shortid = require('shortid');
const removeOrganization = require('../../../lib/resolvers/organization_mutations/removeOrganization');
const mongoose = require('mongoose');

const database = require('../../../db');
const getUserId = require('../../functions/getUserId');
const Organization = require('../../../lib/models/Organization');
const Post = require('../../../lib/models/Post');
const Comment = require('../../../lib/models/Comment');
const User = require('../../../lib/models/User');
const MembershipRequest = require('../../../lib/models/MembershipRequest');

let adminId;
let memberId;
let membershipRequesterId;
let blockedId;

let organizationId;
let membershipRequestId;
let postId;
let commentId;

let adminToken;
let memberToken;
let membershipRequesterToken;
let blockedToken;

beforeAll(async () => {
  require('dotenv').config();
  await database.connect();

  const adminEmail = `${shortid.generate().toLowerCase()}@test.com`;
  adminToken = await getToken(adminEmail);
  adminId = await getUserId(adminEmail);

  const memberEmail = `${shortid.generate().toLowerCase()}@test.com`;
  memberToken = await getToken(memberEmail);
  memberId = await getUserId(memberEmail);

  const membershipRequesterEmail = `${shortid
    .generate()
    .toLowerCase()}@test.com`;
  membershipRequesterToken = await getToken(membershipRequesterEmail);
  membershipRequesterId = await getUserId(membershipRequesterEmail);

  const blockedEmail = `${shortid.generate().toLowerCase()}@test.com`;
  blockedToken = await getToken(blockedEmail);
  blockedId = await getUserId(blockedEmail);

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
    blockedUsers: [blockedId],
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

  const savedMembershipRequest = await membershipRequest.save();
  membershipRequestId = savedMembershipRequest._id;

  // adding posts
  const post = new Post({
    status: 'ACTIVE',
    likedBy: [adminId, memberId],
    likeCount: 2,
    comments: [],
    text: 'a',
    title: 'a',
    imageUrl: 'a.png',
    videoUrl: 'a',
    creator: memberId,
    organization: organizationId,
  });

  const savedPost = await post.save();
  postId = savedPost._id;

  const comment = new Comment({
    likedBy: [adminId, memberId],
    likeCount: 0,
    status: 'ACTIVE',
    text: 'comment',
    creator: memberId,
    post: postId,
  });

  const savedComment = await comment.save();
  commentId = savedComment._id;
  savedPost.overwrite({
    ...savedPost._doc,
    comments: [commentId],
    commentCount: 1,
  });

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
    membershipRequests: [membershipRequestId],
  });
  await membershipRequester.save();

  const blocked = await User.findById(blockedId);
  blocked.overwrite({
    ...blocked._doc,
    organizationsBlockedBy: [organizationId],
  });
  await blocked.save();
  await savedOrg.overwrite({
    ...savedOrg._doc,
    membershipRequests: [membershipRequestId],
    posts: postId,
  });
  await savedPost.save();
  await savedOrg.save();
});

afterAll(async () => {
  await User.findByIdAndDelete(adminId);
  await User.findByIdAndDelete(membershipRequesterId);
  await User.findByIdAndDelete(blockedId);
  await User.findByIdAndDelete(memberId);

  await Organization.findByIdAndDelete(organizationId);
  await MembershipRequest.findByIdAndDelete(membershipRequestId);

  await Post.findByIdAndDelete(postId);
  await Comment.findByIdAndDelete(commentId);

  await database.disconnect();
});

describe('testing removeOrganization resolver', () => {
  test("user doesn't exist", async () => {
    await expect(async () => {
      await removeOrganization({}, {}, { userId: mongoose.Types.ObjectId() });
    }).rejects.toThrow('User not found');
  });

  test("organization doesn't exist", async () => {
    await expect(async () => {
      await removeOrganization(
        {},
        { id: mongoose.Types.ObjectId() },
        { userId: memberId }
      );
    }).rejects.toThrow('Organization not found');
  });

  test('user is not the creator of org', async () => {
    await expect(async () => {
      await removeOrganization(
        {},
        { id: organizationId },
        { userId: memberId }
      );
    }).rejects.toThrow('User not authorized');
  });

  test("organization doesn't exist after deletion", async () => {
    try {
      await removeOrganization({}, { id: organizationId }, { userId: adminId });
      const organization = await Organization.findById(organizationId);
      expect(organization).toBe(null);
    } catch (err) {
      console.log('this is an error: ', err);
    }
  });
  test("posts for an organization are removed after it's been removed", async () => {
    const post = await Post.findById(postId);
    expect(post).toBe(null);
  });
  test("comments for an organization are removed after it's been removed", async () => {
    const comment = await Comment.findById(commentId);
    expect(comment).toBe(null);
  });

  test("members can't see organization after it's been removed", async () => {
    const member = await User.findById(memberId);
    expect(member.joinedOrganizations).toHaveLength(0);
  });

  test("admins and creator can't see organization after it's been removed", async () => {
    const admin = await User.findById(adminId);
    expect(admin.adminFor).toHaveLength(0);
    expect(admin.createdOrganizations).toHaveLength(0);
  });

  test("blocked users aren't blocked from an organization after it's been removed", async () => {
    const blocked = await User.findById(blockedId);
    expect(blocked.organizationsBlockedBy).toHaveLength(0);
  });
  test('membership requests are removed afted an organization deletion', async () => {
    const membershipRequester = await User.findById(membershipRequesterId);
    const membershipRequest = await MembershipRequest.findById(
      membershipRequestId
    );
    expect(membershipRequest).toBe(null);
    expect(membershipRequester.membershipRequests).toHaveLength(0);
  });
});
