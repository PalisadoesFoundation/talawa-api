const axios = require('axios');
const { URL } = require('../constants');
const getToken = require('./functions/getToken');

let token;

beforeAll(async () => {
  token = await getToken();
});

describe('user resolvers', () => {
  test('allUsers query', async () => {
    const response = await axios.post(
      URL,
      {
        query: `query {
                  users {
                    _id
                    firstName
                    lastName
                    email
                    createdOrganizations {
                      _id
                      name
                    }
                    joinedOrganizations {
                      _id
                      name
                    }
                    createdEvents {
                      _id
                    }
                    registeredEvents {
                      _id
                    }
                    eventAdmin {
                      _id
                    }
                    adminFor {
                      _id
                      name
                    }
                    membershipRequests {
                      _id
                    }    
                    organizationsBlockedBy{
                      _id
                    }
                  }
                }
              `,
      },
      {
        headers: {
          authorization: `Bearer ${token}`,
        },
      }
    );
    const { data } = response;
    expect(Array.isArray(data.data.users)).toBeTruthy();
    const firstUser = data.data.users[0];
    //Tested First Object in Array as others will be similar.
    expect(firstUser).toEqual(
      expect.objectContaining({
        _id: expect.any(String),
        firstName: expect.any(String),
        lastName: expect.any(String),
        email: expect.any(String),
      })
    );
    firstUser.createdOrganizations.map((createdOrganization) => {
      expect(createdOrganization).toEqual(
        expect.objectContaining({
          _id: expect.any(String),
          name: expect.any(String),
        })
      );
    });

    firstUser.joinedOrganizations.map((joinedOrganization) => {
      expect(joinedOrganization).toEqual(
        expect.objectContaining({
          _id: expect.any(String),
          name: expect.any(String),
        })
      );
    });

    firstUser.createdEvents.map((createdEvent) => {
      expect(createdEvent).toEqual(
        expect.objectContaining({
          _id: expect.any(String),
        })
      );
    });

    firstUser.registeredEvents.map((registeredEvent) => {
      expect(registeredEvent).toEqual(
        expect.objectContaining({
          _id: expect.any(String),
        })
      );
    });

    firstUser.eventAdmin.map((admin) => {
      expect(admin).toEqual(
        expect.objectContaining({
          _id: expect.any(String),
        })
      );
    });

    firstUser.adminFor.map((org) => {
      expect(org).toEqual(
        expect.objectContaining({
          _id: expect.any(String),
          name: expect.any(String),
        })
      );
    });

    firstUser.membershipRequests.map((membershipRequest) => {
      expect(membershipRequest).toEqual(
        expect.objectContaining({
          _id: expect.any(String),
        })
      );
    });

    firstUser.organizationsBlockedBy.map((org) => {
      expect(org).toEqual(
        expect.objectContaining({
          _id: expect.any(String),
        })
      );
    });
  });
});
