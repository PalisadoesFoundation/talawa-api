const axios = require('axios');
const { URL } = require('../../../constants');
const getToken = require('../../functions/getToken');
const shortid = require('shortid');
const {
  Types: { ObjectId },
} = require('mongoose');

const database = require('../../../db');
const getUserId = require('../../functions/getUserId');
const User = require('../../../lib/models/User');
const Organization = require('../../../lib/models/Organization');

let mainOrganizationAdminToken;
let mainOrganization;
let mainOrganizationAdminId;

let secondaryUserToken;
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
  mainOrganizationAdminToken = await getToken(mainOrganizationAdminEmail);
  mainOrganizationAdminId = await getUserId(mainOrganizationAdminEmail);

  let secondaryUserEmail = `${shortid.generate().toLowerCase()}@test.com`;
  secondaryUserToken = await getToken(secondaryUserEmail);
  secondaryUserId = await getUserId(secondaryUserEmail);

  let normalUserEmail = `${shortid.generate().toLowerCase()}@test.com`;
  await getToken(normalUserEmail);
  normalUserId = await getUserId(normalUserEmail);

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
    const blockUserResponse = await axios.post(
      URL,
      {
        query: `
          mutation{
            blockUser(organizationId: "${mainOrganization._id}", userId: "${normalUserId}"){
              _id
            }
          }`,
      },
      {
        headers: {
          Authorization: `Bearer ${secondaryUserToken}`,
        },
      }
    );

    const [notAuthorizedError] = blockUserResponse.data.errors;
    const blockUserData = blockUserResponse.data.data;

    expect(notAuthorizedError).toEqual(
      expect.objectContaining({
        message: 'User is not authorized for performing this operation',
        status: 422,
      })
    );
    expect(notAuthorizedError.data[0]).toEqual(
      expect.objectContaining({
        message: 'User is not authorized for performing this operation',
        code: 'user.notAuthorized',
        param: 'userAuthorization',
        metadata: {},
      })
    );
    expect(blockUserData).toEqual(null);
  });
  test("organization doesn't exist", async () => {
    const blockUserResponse = await axios.post(
      URL,
      {
        query: `
          mutation{
            blockUser(organizationId: "${new ObjectId()}", userId: "${normalUserId}"){
              _id
            }
          }`,
      },
      {
        headers: {
          Authorization: `Bearer ${mainOrganizationAdminToken}`,
        },
      }
    );

    const [notFoundError] = blockUserResponse.data.errors;
    const blockUserData = blockUserResponse.data.data;

    expect(notFoundError).toEqual(
      expect.objectContaining({
        message: 'Organization not found',
        status: 422,
      })
    );
    expect(notFoundError.data[0]).toEqual(
      expect.objectContaining({
        message: 'Organization not found',
        code: 'organization.notFound',
        param: 'organization',
        metadata: {},
      })
    );
    expect(blockUserData).toEqual(null);
  });

  test("user doesn't exist", async () => {
    const id = mainOrganization._id;
    const blockUserResponse = await axios.post(
      URL,
      {
        query: `
        mutation{
          blockUser(organizationId: "${id}", userId: "${new ObjectId()}"){
            _id
          }
        }`,
      },
      {
        headers: {
          Authorization: `Bearer ${mainOrganizationAdminToken}`,
        },
      }
    );

    const [notFoundError] = blockUserResponse.data.errors;
    const blockUserData = blockUserResponse.data.data;

    expect(notFoundError).toEqual(
      expect.objectContaining({
        message: 'User not found',
        status: 422,
      })
    );
    expect(notFoundError.data[0]).toEqual(
      expect.objectContaining({
        message: 'User not found',
        code: 'user.notFound',
        param: 'user',
        metadata: {},
      })
    );
    expect(blockUserData).toEqual(null);
  });

  test('a valid block request', async () => {
    const blockUserResponse = await axios.post(
      URL,
      {
        query: `
          mutation{
            blockUser(organizationId: "${mainOrganization._id}", userId: "${normalUserId}"){
              _id
              organizationsBlockedBy{
                _id
              }
            }
          }`,
      },
      {
        headers: {
          Authorization: `Bearer ${mainOrganizationAdminToken}`,
        },
      }
    );

    const { data } = blockUserResponse;
    const organizationsBlockedBy = data.data.blockUser.organizationsBlockedBy;
    const organization = organizationsBlockedBy.find(
      (org) => org._id === mainOrganization._id.toString()
    );
    expect(data.data.blockUser._id).toEqual(normalUserId);
    expect(organization._id).toEqual(mainOrganization._id.toString());
  });

  test('blocking an already blocked user', async () => {
    const blockUserResponse = await axios.post(
      URL,
      {
        query: `
          mutation{
            blockUser(organizationId: "${mainOrganization._id}", userId: "${normalUserId}"){
              _id
            }
          }`,
      },
      {
        headers: {
          Authorization: `Bearer ${mainOrganizationAdminToken}`,
        },
      }
    );

    const [notAuthorizedError] = blockUserResponse.data.errors;
    const blockUserData = blockUserResponse.data.data;

    expect(notAuthorizedError).toEqual(
      expect.objectContaining({
        message: 'User is not authorized for performing this operation',
        status: 422,
      })
    );
    expect(notAuthorizedError.data[0]).toEqual(
      expect.objectContaining({
        message: 'User is not authorized for performing this operation',
        code: 'user.notAuthorized',
        param: 'userAuthorization',
        metadata: {},
      })
    );
    expect(blockUserData).toEqual(null);
  });

  test('blockedUsers inside organization contains the blocked user', async () => {
    const blockedUsersResponse = await axios.post(
      URL,
      {
        query: `
          query {
            organizations(id: "${mainOrganization._id}") {
              blockedUsers {
                _id
              }
            }
          }`,
      },
      {
        headers: {
          Authorization: `Bearer ${mainOrganizationAdminToken}`,
        },
      }
    );

    const blockedUsers =
      blockedUsersResponse.data.data.organizations[0].blockedUsers;
    const blockedUser = blockedUsers.find((u) => u._id === normalUserId);
    expect(blockedUser).toBeTruthy();
    expect(blockedUser._id).toBe(normalUserId);
  });
});
