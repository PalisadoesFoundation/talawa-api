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
                  createOrganization(data: {
                      name:"test org"
                      description:"test description"
                      isPublic: true
                      visibleInSearch: true
                      apiUrl : "test url"
                      }) {
                          _id,
                          name, 
                          description,
                          creator{
                            email
                          },
                          admins{
                            email
                          },
                          members{
                            email
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
        name: expect.any(String),
        description: expect.any(String),
        creator: expect.objectContaining({
          email: expect.any(String),
        }),
        admins: expect.any(Array),
        members: expect.any(Array),
      })
    );
    // test to check if userInfo has been updated
    const userInfoResponse = await axios.post(
      URL,
      {
        query: `
              query {
                  me {
                     joinedOrganizations{
                       _id
                     },
                     createdOrganizations{
                       _id
                     },
                     adminFor{
                       _id
                     }, 
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
    const userData = userInfoResponse.data.data.me;
    expect(userData).toEqual(
      expect.objectContaining({
        joinedOrganizations: expect.arrayContaining([
          expect.objectContaining({
            _id: createdOrgId,
          }),
        ]),
        createdOrganizations: expect.arrayContaining([
          expect.objectContaining({
            _id: createdOrgId,
          }),
        ]),
        adminFor: expect.arrayContaining([
          expect.objectContaining({
            _id: createdOrgId,
          }),
        ]),
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
                    _id,
                    email
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
    const userInfoResponse = await axios.post(
      URL,
      {
        query: `
              query {
                  me {
                      _id,
                      email
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
    const userDataFromQuery = userInfoResponse.data.data.me;
    const userData = deletedResponse.data.data.removeOrganization;

    expect(userData).toEqual(
      expect.objectContaining({
        _id: expect.any(String),
        email: expect.any(String),
      })
    );

    // check if both objects are same with values.
    expect(userDataFromQuery).toMatchObject(userData);
  });
});
