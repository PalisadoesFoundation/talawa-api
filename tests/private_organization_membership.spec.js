const axios = require("axios");
const { URL } = require("../constants");
const getToken = require("./functions/getToken");
const shortid = require("shortid");

let token;
beforeAll(async () => {
  token = await getToken();
});

describe("Private Organization Membership Tests", () => {
  let newRequestId;
  let createdOrganizationId;
  let newUserToken;
  let newUserId;

  //New user sends membership request to join organization
  test("User sends private organization membership request", async () => {
    // Private Organization is created - by default user
    const createdOrganizationResponse = await axios.post(
      URL,
      {
        query: `
            mutation {
                createOrganization(data: {
                    name:"test org"
                    description:"test description"
                    isPublic: false
                    }) {
                        _id
                        name
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

    createdOrganizationId =
      createdOrganizationResponse.data.data.createOrganization._id;

    //New user is created

    let id = shortid.generate();
    let email = `${id}@test.com`;
    const response = await axios.post(URL, {
      query: `
        mutation {
            signUp(data: {
            firstName:"testdb2",
            lastName:"testdb2"
            email: "${email}"
            password:"password"
            }) {
            userId
            token
            }
        }
        `,
    });
    const signUpData = response.data;
    newUserToken = signUpData.data.signUp.token;
    newUserId = signUpData.data.signUp.userId;

    const sendRequestResponse = await axios.post(
      URL,
      {
        query: `
                    mutation{
                    sendMembershipRequest(organizationId: "${createdOrganizationId}"){
                        _id
                    }
                }`,
      },
      {
        headers: {
          Authorization: `Bearer ${newUserToken}`,
        },
      }
    );
    const sendRequestData = sendRequestResponse.data;
    newRequestId = sendRequestData.data.sendMembershipRequest._id;
    expect(sendRequestData.data.sendMembershipRequest).toEqual(
      expect.objectContaining({
        _id: expect.any(String),
      })
    );
  });

  //admin rejects membership request
  test("Admin rejects membership request", async () => {
    const rejectRequestResponse = axios.post(
      URL,
      {
        query: `
              mutation{
                rejectMembershipRequest(membershipRequestId: "${newRequestId}"){
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

    const rejectRequestData = rejectRequestResponse.data;
    console.log(rejectRequestData);
    console.log(newRequestId)

    expect(rejectRequestData.data.rejectMembershipRequest).toEqual(
      expect.objectContaining({
        _id: expect.any(String),
      })
    );
  });

  //new user re-sends membership request to join organization

  //admin accepts membership request
});
