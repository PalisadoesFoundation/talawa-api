const axios = require('axios');
const { URL } = require('../../../constants');
const getToken = require('../../functions/getToken');
const getUserIdFromSignup = require('../../functions/getUserIdFromSignup');
const shortid = require('shortid');
const mongoose = require('mongoose');

let mainOrganizationAdminToken;
let mainOrganization;

let secondaryUserToken;

let normalUserId;

beforeAll(async () => {
  // we would have 3 users 1 is admin of mainOrganization,
  // and 2 other users.

  let mainOrganizationAdminEmail = `${shortid
    .generate()
    .toLowerCase()}@test.com`;
  mainOrganizationAdminToken = await getToken(mainOrganizationAdminEmail);

  let secondaryUserEmail = `${shortid.generate().toLowerCase()}@test.com`;
  secondaryUserToken = await getToken(secondaryUserEmail);

  let normalUserEmail = `${shortid.generate().toLowerCase()}@test.com`;
  normalUserId = await getUserIdFromSignup(normalUserEmail);

  const mainOrg = await axios.post(
    URL,
    {
      query: `
        mutation {
          createOrganization(data: {
            name:"main org"
            description:"main org description"
            isPublic: true
            visibleInSearch: true
            }) {
              _id
              name
              creator {
                _id
              }
            }
        }
            `,
    },
    {
      headers: {
        Authorization: `Bearer ${mainOrganizationAdminToken}`,
      },
    }
  );
  mainOrganization = mainOrg.data.data.createOrganization;
});

afterAll(async () => {
  await axios.post(
    URL,
    {
      query: `
          mutation{
            removeOrganization(id: "${mainOrganization._id}"){
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
            blockUser(organizationId: "${new mongoose.Types.ObjectId()}", userId: "${normalUserId}"){
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
    const blockUserResponse = await axios.post(
      URL,
      {
        query: `
          mutation{
     blockUser(organizationId: "$
       mainOrganization._id
     }", userId: "${new mongoose.Types.ObjectId()}"){
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
      (org) => org._id === mainOrganization._id
    );
    expect(data.data.blockUser._id).toEqual(normalUserId);
    expect(organization._id).toEqual(mainOrganization._id);
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
