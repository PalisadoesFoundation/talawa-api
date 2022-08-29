const axios = require('axios');
const { URL } = require('../constants');
const { getAccessToken, getUserIdFromLogin } = require('./helperFunctions');
const shortid = require('shortid');

let token;
let userId;

beforeAll(async () => {
  let generatedEmail = `${shortid.generate().toLowerCase()}@test.com`;
  token = await getAccessToken(generatedEmail);
  userId = await getUserIdFromLogin(generatedEmail);
});

describe('user query', () => {
  test('Get Logged In User Details', async () => {
    const response = await axios.post(
      URL,
      {
        query: `
          {
          user(id: "${userId}") {
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
              blockedUsers {
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
    expect(data.data.user).toEqual(
      expect.objectContaining({
        _id: expect.any(String),
        firstName: expect.any(String),
        lastName: expect.any(String),
        email: expect.any(String),
        userType: expect.any(String),
        appLanguageCode: expect.any(String),
      })
    );

    //Array of Organizations
    const userCreatedOrganizationsData = data.data.user.createdOrganizations;

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

  test('User Query without Authorization', async () => {
    const response = await axios.post(URL, {
      query: `
        {
          user(id: "${userId}") {
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
