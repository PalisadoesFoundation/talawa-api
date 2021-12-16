const axios = require('axios');
const { URL } = require('../constants');
const getToken = require('./functions/getToken');

let token;

beforeAll(async () => {
  token = await getToken();
});

describe('organization member connection resolvers', () => {
  let createdOrgId;

  test('createOrganization', async () => {
    const createdOrgResponse = await axios.post(
      URL,
      {
        query: `
            mutation {
                createOrganization(data: {
                    name:"test org"
                    description:"test description"
                    isPublic: true
                    visibleInSearch: true
                    }) {
                        _id
                    }
            }
              `,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const { data } = createdOrgResponse;
    createdOrgId = data?.data.createOrganization._id;
    console.log(createdOrgId);
    expect(data.data.createOrganization).toEqual(
      expect.objectContaining({
        _id: expect.any(String),
      })
    );
  });

  test('Organization Member Connection', async () => {
    const orgMemberConnectionResponse = await axios.post(
      URL,
      {
        query: `
                query {
                    organizationsMemberConnection(orgId: "${createdOrgId}") {
                        pageInfo {
                        hasNextPage
                        hasPreviousPage
                        totalPages
                        nextPageNo
                        prevPageNo
                        currPageNo
                        }
                        edges{
                          _id
                        }
                        aggregate {
                        count
                        }
                    }
                    }
            `,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    expect.extend({
      toBeTypeOrNull(received, classTypeOrNull) {
        try {
          expect(received).toEqual(expect.any(classTypeOrNull));
          return {
            message: 'Ok',
            pass: true,
          };
        } catch (error) {
          if (received === null)
            return {
              message: 'Ok',
              pass: true,
            };
          else
            return {
              message: `expected ${received} to be ${classTypeOrNull} type or null`,
              pass: false,
            };
        }
      },
    });

    expect(
      orgMemberConnectionResponse.data.data.organizationsMemberConnection
        .pageInfo
    ).toEqual(
      expect.objectContaining({
        hasNextPage: expect.any(Boolean),
        hasPreviousPage: expect.any(Boolean),
        totalPages: expect.any(Number),
        nextPageNo: expect.toBeTypeOrNull(Number),
        prevPageNo: expect.toBeTypeOrNull(Number),
        currPageNo: expect.any(Number),
      })
    );

    expect(
      orgMemberConnectionResponse.data.data.organizationsMemberConnection.edges
    ).toEqual(expect.any(Array));

    expect(
      orgMemberConnectionResponse.data.data.organizationsMemberConnection
        .aggregate
    ).toEqual(
      expect.objectContaining({
        count: expect.any(Number),
      })
    );
  });
});
