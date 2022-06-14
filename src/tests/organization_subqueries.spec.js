const axios = require('axios');
const { URL } = require('../constants');

describe('organization resolvers', () => {
  test('organization-subqueries', async () => {
    const response = await axios.post(URL, {
      query: `
        {
          organizations {
            _id
            name
            description
            isPublic
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
              user {
                _id
                firstName
              }
              organization {
                _id
                name
                description
              }
            }
            blockedUsers {
              _id
            }
        }
      }
    `,
    });

    const { data } = response;

    expect(Array.isArray(data.data.organizations)).toBeTruthy();

    data.data?.organizations.map((org) => {
      expect(org).toEqual(
        expect.objectContaining({
          _id: expect.any(String),
          name: expect.any(String),
          description: expect.any(String),
          isPublic: expect.any(Boolean),
          creator: expect.objectContaining({
            _id: expect.any(String),
            firstName: expect.any(String),
          }),
        })
      );

      org.members.map((member) => {
        expect(member).toEqual(
          expect.objectContaining({
            _id: expect.any(String),
            firstName: expect.any(String),
          })
        );
      });

      org.admins.map((admin) => {
        expect(admin).toEqual(
          expect.objectContaining({
            _id: expect.any(String),
            firstName: expect.any(String),
          })
        );
      });

      org.membershipRequests.map((membershipRequest) => {
        expect(membershipRequest).toEqual(
          expect.objectContaining({
            _id: expect.any(String),
            user: expect.objectContaining({
              _id: expect.any(String),
              firstName: expect.any(String),
            }),
            organization: expect.objectContaining({
              _id: expect.any(String),
              name: expect.any(String),
              description: expect.any(String),
            }),
          })
        );
      });

      org.blockedUsers.map((blockedUser) => {
        expect(blockedUser).toEqual(
          expect.objectContaining({
            _id: expect.any(String),
          })
        );
      });
    });
  });
});
