const axios = require('axios');
const { URL } = require('../constants');
const getToken = require('./functions/getToken');
const getUserId = require('./functions/getUserId');
const shortid = require('shortid');

let token;
let userId;

beforeAll(async () => {
  let generatedEmail = `${shortid.generate().toLowerCase()}@test.com`;
  token = await getToken(generatedEmail);
  userId = await getUserId(generatedEmail);
});

describe('users connection query', () => {
  test('users connection without parameters', async () => {
    const usersConnectionResponse = await axios.post(
      URL,
      {
        query: `
                {
                    usersConnection {
                        _id
                        firstName
                        lastName
                        email
                        userType
                        createdOrganizations {
                        _id
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
                        }
                        membershipRequests {
                        _id
                        }
                        organizationsBlockedBy {
                        _id
                        name
                        }
                        organizationUserBelongsTo {
                        _id
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
    const { data } = usersConnectionResponse;
    const usersConnectionData = data.data.usersConnection;
    usersConnectionData.map((user) => {
      expect(user).toEqual(
        expect.objectContaining({
          _id: expect.any(String),
          firstName: expect.any(String),
          lastName: expect.any(String),
          email: expect.any(String),
        })
      );

      user.createdOrganizations.map((org) => {
        expect(org).toEqual(
          expect.objectContaining({
            _id: expect.any(String),
          })
        );
      });

      user.joinedOrganizations.map((org) => {
        expect(org).toEqual(
          expect.objectContaining({
            _id: expect.any(String),
            name: expect.any(String),
          })
        );
      });

      user.createdEvents.map((createdEvent) => {
        expect(createdEvent).toEqual(
          expect.objectContaining({
            _id: expect.any(String),
          })
        );
      });

      user.registeredEvents.map((registeredEvent) => {
        expect(registeredEvent).toEqual(
          expect.objectContaining({
            _id: expect.any(String),
          })
        );
      });

      user.eventAdmin.map((event) => {
        expect(event).toEqual(
          expect.objectContaining({
            _id: expect.any(String),
          })
        );
      });

      user.adminFor.map((obj) => {
        expect(obj).toEqual(
          expect.objectContaining({
            _id: expect.any(String),
          })
        );
      });

      user.membershipRequests.map((membershipRequest) => {
        expect(membershipRequest).toEqual(
          expect.objectContaining({
            _id: expect.any(String),
          })
        );
      });

      user.organizationsBlockedBy.map((obj) => {
        expect(obj).toEqual(
          expect.objectContaining({
            _id: expect.any(String),
            name: expect.any(String),
          })
        );
      });

      expect(user.organizationUserBelongsTo).toEqual(null);
    });
  });

  test('users connection with Id', async () => {
    const usersConnectionResponse = await axios.post(
      URL,
      {
        query: `
                {
                    usersConnection(where:{id:"${userId}"}) {
                        _id
                        firstName
                        lastName
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
    const { data } = usersConnectionResponse;
    expect(data.data.usersConnection).toHaveLength(1);

    expect(data.data.usersConnection[0]).toEqual(
      expect.objectContaining({
        _id: expect.any(String),
        firstName: expect.any(String),
        lastName: expect.any(String),
        email: expect.any(String),
      })
    );
  });
});
