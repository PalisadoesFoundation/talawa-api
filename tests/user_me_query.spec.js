const axios = require('axios');
const { URL } = require('../constants');
const getToken = require('./functions/getToken');
const getUserId = require('./functions/getUserId');
const shortid = require('shortid');

let token;
let userId;
let generatedEmail;
beforeAll(async () => {
  generatedEmail = `${shortid.generate().toLowerCase()}@test.com`;
  token = await getToken(generatedEmail);
  userId = await getUserId(generatedEmail);
});

describe('user resolvers', () => {
  test('Get Logged In User details - me Query', async () => {
    const response = await axios.post(
      URL,
      {
        query: `
      {
        me {
          _id
          firstName
          lastName
          email
          userType
          appLanguageCode
          createdOrganizations {
            _id
            name
            description
            isPublic
            visibleInSearch
            apiUrl
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
            }
            blockedUsers{
              _id
            }
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

    const { data } = response;

    expect(data.data.me).toEqual(
      expect.objectContaining({
        _id: userId,
        firstName: 'testdb2',
        lastName: 'testdb2',
        email: generatedEmail,
        userType: 'USER',
        appLanguageCode: expect.any(String),
      })
    );

    //Array of Organizations
    const userCreatedOrganizationsData = data.data.me.createdOrganizations;

    // Asserting each Organization by mapping
    userCreatedOrganizationsData.map((org) => {
      if (!org) {
        return;
      }
      expect(org).toEqual(
        expect.objectContaining({
          _id: expect.any(String),
          name: expect.any(String),
          description: expect.any(String),
          isPublic: expect.any(Boolean),
          visibleInSearch: expect.any(Boolean),
          apiUrl: expect.any(String),
          creator: expect.objectContaining({
            _id: expect.any(String),
            firstName: expect.any(String),
          }),
        })
      );

      // Asserting each Organization's Members Array
      org.members.map((member) => {
        expect(member).toEqual(
          expect.objectContaining({
            _id: expect.any(String),
            firstName: expect.any(String),
          })
        );
      });

      // Asserting each Organization's Admins Array
      org.admins.map((admin) => {
        expect(admin).toEqual(
          expect.objectContaining({
            _id: expect.any(String),
            firstName: expect.any(String),
          })
        );
      });

      // Asserting each Organization's membershipRequests Array
      org.membershipRequests.map((membershipRequest) => {
        expect(membershipRequest).toEqual(
          expect.objectContaining({
            _id: expect.any(String),
          })
        );
      });

      // Asserting each Organization's blockedUsers Array
      org.blockedUsers.map((blockedUser) => {
        expect(blockedUser).toEqual(
          expect.objectContaining({
            _id: expect.any(String),
          })
        );
      });
    });
  });

  test('me Query without Authorization', async () => {
    const response = await axios.post(URL, {
      query: `
        {
          me {
            _id
            firstName
            lastName
            email
            userType
            appLanguageCode
          }
        }
      `,
    });

    expect(response.data.errors[0]).toEqual(
      expect.objectContaining({
        message: 'User is not authenticated',
        status: 422,
      })
    );

    expect(response.data.errors[0].data[0]).toEqual(
      expect.objectContaining({
        message: 'User is not authenticated',
        code: 'user.notAuthenticated',
        param: 'userAuthentication',
        metadata: {},
      })
    );

    expect(response.data.data).toEqual(null);
  });
});
