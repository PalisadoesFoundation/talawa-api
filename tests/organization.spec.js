const axios = require('axios');
const { URL } = require('../constants');
const getToken = require('./functions/getToken');
const shortid = require('shortid');

let token;
let createdOrgId;

beforeAll(async () => {
  let generatedEmail = `${shortid.generate().toLowerCase()}@test.com`;
  token = await getToken(generatedEmail);
});

describe('organization resolvers', () => {
  test('allOrganizations', async () => {
    const response = await axios.post(URL, {
      query: `{
                organizations {
                    _id
                    name
                }
            }
            `,
    });
    const { data } = response;
    expect(Array.isArray(data.data.organizations)).toBeTruthy();
  });

  const isPublic_boolean = Math.random() < 0.5;
  const visibleInSearch_boolean = Math.random() < 0.5;

  test('createOrganization', async () => {
    const createdOrgResponse = await axios.post(
      URL,
      {
        query: `
            mutation {
              createOrganization(
                data: {
                  name: "test org"
                  description: "test description"
                  location:"Washington DC"
                  isPublic: ${isPublic_boolean}
                  visibleInSearch: ${visibleInSearch_boolean}
                  apiUrl: "test url"
                }
              ) {
                _id
                name
                description
                location
                isPublic
                visibleInSearch
                apiUrl
                image
                creator {
                  _id
                  firstName
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
    const { data } = createdOrgResponse;
    createdOrgId = createdOrgResponse.data.data.createOrganization._id;
    expect(data.data.createOrganization).toEqual(
      expect.objectContaining({
        _id: expect.any(String),
        name: 'test org',
        description: 'test description',
        location: 'Washington DC',
        isPublic: isPublic_boolean,
        visibleInSearch: visibleInSearch_boolean,
        apiUrl: 'test url',
        image: null,
        creator: expect.objectContaining({
          _id: expect.any(String),
          firstName: expect.any(String),
        }),
      })
    );
  });

  test('updateOrganization', async () => {
    const updateOrgRes = await axios.post(
      URL,
      {
        query: `
          mutation {
            updateOrganization(
              id: "${createdOrgId}"
              data: {
                name: "test2 org"
                description: "new description"
                isPublic: ${!isPublic_boolean}
                visibleInSearch: ${!visibleInSearch_boolean}
              }
            ) {
              _id
              name
              description
              isPublic
              visibleInSearch
              apiUrl
              image
              creator {
                _id
                firstName
              }
              members {
                _id
                firstName
              }
              admins {
                _id
                firstName
              }
              membershipRequests {
                _id
                organization{
                  _id
                  name
                  description
                }
                user {
                  _id
                  firstName
                }
              }
              blockedUsers {
                _id
                firstName
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

    const { data } = updateOrgRes;
    const updatedOrganizationData = data.data.updateOrganization;
    expect(updatedOrganizationData).toEqual(
      expect.objectContaining({
        _id: createdOrgId,
        name: 'test2 org',
        description: 'new description',
        isPublic: !isPublic_boolean,
        visibleInSearch: !visibleInSearch_boolean,
        apiUrl: 'test url',
        image: null,
        creator: expect.objectContaining({
          _id: expect.any(String),
          firstName: expect.any(String),
        }),
      })
    );

    updatedOrganizationData.members.map((member) => {
      expect(member).toEqual(
        expect.objectContaining({
          _id: expect.any(String),
          firstName: expect.any(String),
        })
      );
    });

    updatedOrganizationData.admins.map((admin) => {
      expect(admin).toEqual(
        expect.objectContaining({
          _id: expect.any(String),
          firstName: expect.any(String),
        })
      );
    });

    updatedOrganizationData.membershipRequests.map((membershipRequest) => {
      expect(membershipRequest).toEqual(
        expect.objectContaining({
          _id: expect.any(String),
          organization: expect.objectContaining({
            _id: expect.any(String),
            name: expect.any(String),
            description: expect.any(String),
          }),
          user: expect.objectContaining({
            _id: expect.any(String),
            firstName: expect.any(String),
          }),
        })
      );
    });

    updatedOrganizationData.blockedUsers.map((blockedUser) => {
      expect(blockedUser).toEqual(
        expect.objectContaining({
          _id: expect.any(String),
          firstName: expect.any(String),
        })
      );
    });
  });

  test('removeOrganization', async () => {
    const deletedResponse = await axios.post(
      URL,
      {
        query: `
            mutation {
                removeOrganization(id: "${createdOrgId}") {
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

    expect(deletedResponse.data.data.removeOrganization).toEqual(
      expect.objectContaining({
        _id: expect.any(String),
      })
    );
  });
});
