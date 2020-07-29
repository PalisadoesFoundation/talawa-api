const axios = require("axios");
const { URL } = require("../constants");
const getToken = require("./functions/getToken");
const shortid = require("shortid");

let token;
beforeAll(async () => {
  token = await getToken();
});

let createdOrgId = "test";

describe("User-Organization Resolvers", () => {
  //ORGANIZATION IS CREATED

  test("createOrganization", async () => {
    const response = await axios.post(
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
    const { data } = response;
    if(!data.data) console.log("Data not present")
    console.log(data)
    createdOrgId = data.data.createOrganization._id;
    console.log(createdOrgId);
    expect(data.data.createOrganization).toEqual(
      expect.objectContaining({
        _id: expect.any(String)
      })
    );
  });



  //NEW USER IS CREATED

  let newUserToken;
  let newUserId;
  test("signUp", async () => {
    var id = shortid.generate();
    var email = `${id}@test.com`;
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
    const { data } = response;
    newUserToken = data.data.signUp.token;
    newUserId = data.data.signUp.userId;
    expect(data.data.signUp).toEqual(
      expect.objectContaining({
        userId: expect.any(String),
        token: expect.any(String),
      })
    );
  });

  //NEW USER JOINS ORGANIZATION
  test("Join Public Organization", async () => {
    const response = await axios.post(
      URL,
      {
        query: `
        mutation {
            joinPublicOrganization(organizationId: "${createdOrgId}") {
              _id
              firstName
              lastName
              email
            }
          }`,
      },
      {
        headers: {
          Authorization: `Bearer ${newUserToken}`,
        },
      }
    );
    const { data } = response;
    expect(data.data.joinPublicOrganization).toEqual(
      expect.objectContaining({
        _id: expect.any(String),
        firstName: expect.any(String),
        lastName: expect.any(String),
        email: expect.any(String),
      })
    );
  });

  //NEW USER CREATES AN EVENT
  let createdEventId;
  test("User Creates Event", async () => {
    try {
      const response = await axios.post(
        URL,
        {
          query: `
            mutation{
              createEvent(data:{
                  title:"to be deleted"
                  description: "to be deleted"
                  recurring: false
                  attendees: "to be deleted"
                  isPublic: false
                  isRegisterable:false
                  organizationId: "${createdOrgId}"
                }){
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

      const { data } = response;
      createdEventId = data.data.createEvent._id;
      console.log(data)
      console.log(createdEventId)

      expect(data.data.createEvent).toEqual(
        expect.objectContaining({
          _id: createdEventId,
        })
      );
    } catch (e) {
      console.log("an error has occurred");
      console.log(e);
      throw e;
    }
  });

  //NEW USER CREATES A GROUP


  //USER IS MADE ADMIN
  test("User is made admin", async () => {
    const response = await axios.post(
      URL,
      {
        query: `mutation {
            createAdmin(data: {
              organizationId: "${createdOrgId}"
              userId: "${newUserId}"
            }) {
              _id
              firstName
              lastName
              email
            }
          }`,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const { data } = response;
    expect(data.data.createAdmin).toEqual(
      expect.objectContaining({
        _id: expect.any(String),
        firstName: expect.any(String),
        lastName: expect.any(String),
        email: expect.any(String),
      })
    );
  });


    //ADMIN REMOVES GROUP

  



  //ADMIN REMOVES EVENT

  test("Admin Removes Event", async () => {
    const response = await axios.post(
      URL,
      {
        query: `
        mutation{
          adminRemoveEvent(eventId:"${createdEventId}") {
            _id
          }
        }
          `,
      },
      {
        headers: {
          Authorization: `Bearer ${newUserToken}`,
        },
      }
    );

    const { data } = response;
    expect(data.data.adminRemoveEvent).toEqual(
      expect.objectContaining({
        _id: createdEventId,
      })
    );
  });




  //ADMIN IS REMOVED

  test("Admin is removed", async () => {
    const response = await axios.post(
      URL,
      {
        query: `mutation {
        removeAdmin(data: {
          organizationId: "${createdOrgId}"
          userId: "${newUserId}"
        }) {
          _id
          firstName
          lastName
          email
          password
        }
      }`,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const { data } = response;
    expect(data.data.removeAdmin).toEqual(
      expect.objectContaining({
        _id: expect.any(String),
        firstName: expect.any(String),
        lastName: expect.any(String),
        email: expect.any(String),
      })
    );
  });

  //USER LEAVES ORGANIZATION

  test("Leave Organization", async () => {
    const response = await axios.post(
      URL,
      {
        query: `
        mutation {
            leaveOrganization(organizationId: "${createdOrgId}") {
              _id
              firstName
              lastName
              email
            }
          }`,
      },
      {
        headers: {
          Authorization: `Bearer ${newUserToken}`,
        },
      }
    );

    const { data } = response;
    expect(data.data.leaveOrganization).toEqual(
      expect.objectContaining({
        _id: expect.any(String),
        firstName: expect.any(String),
        lastName: expect.any(String),
        email: expect.any(String),
      })
    );
  });

  //ADMIN REMOVES USER FROM ORGANIZATION

  //A NEW USER HAS TO BE CREATED THEN ADDED TO THE ORGANIZATION THEN REMOVED
  test("Remove Member from organization", async () => {
    //new user is created
    var id = shortid.generate();
    var email = `${id}@test.com`;

    const signUpResponse = await axios.post(URL, {
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
    const { data } = signUpResponse;
    const userToken = data.data.signUp.token;
    const createdUserId = data.data.signUp.userId;

    //user joins organizations
    const joinOrgRes = await axios.post(
      URL,
      {
        query: `
        mutation {
            joinPublicOrganization(organizationId: "${createdOrgId}") {
              _id
              firstName
              lastName
              email
            }
          }`,
      },
      {
        headers: {
          Authorization: `Bearer ${userToken}`,
        },
      }
    );
    //console.log(joinOrgRes.data)

    //Admin removes user from organization
    const removeMemberResponse = await axios.post(
      URL,
      {
        query: `mutation {
          removeMember(data: {
            organizationId: "${createdOrgId}",
            userId: "${createdUserId}",
          }) {
            _id
            firstName
            lastName
            password
            email
          }
        }`,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    const removeMemberData = removeMemberResponse.data;
    //console.log(removeMemberResponse.data.errors[0])
    expect(removeMemberData.data.removeMember).toEqual(
      expect.objectContaining({
        _id: expect.any(String),
        firstName: expect.any(String),
        lastName: expect.any(String),
        email: expect.any(String),
      })
    );
  });

  //ORGANIZATION IS DELETED

  test("deleteOrganization", async () => {
    const deletedResponse = await axios.post(
      URL,
      {
        query: `
              mutation {
                  removeOrganization(id: "${createdOrgId}") {
                      _id
                      name
                      description
                      isPublic
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

    expect(deletedResponse.data).toMatchObject({
      data: {
        removeOrganization: {
          _id: `${createdOrgId}`,
          name: "test org",
          description: "test description",
          isPublic: true,
        },
      },
    });
  });



});
