const axios = require("axios");

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI1ZWQxNmQ0MmVhMTg1YjAwMjQyYmQ4MDQiLCJlbWFpbCI6InRlc3RkYjJAdGVzdC5jb20iLCJpYXQiOjE1OTA3ODM1NjgsImV4cCI6MTU5MDc4NzE2OH0.qlFp5oTT52AWhGKDu2-TAhYpxkChl-Ue5gn0p77fKA8"

describe("organization resolvers", () => {
  test("allOrganizations", async () => {
    const response = await axios.post("https://talawa-testing.herokuapp.com/", {
      query: `query {
                organizations {
                    _id
                    name
                }
            }`,
    });
    const { data } = response;
    expect(Array.isArray(data.data.organizations)).toBeTruthy();
  });

  test("createOrganization", async () => {
    const response = await axios.post(
      "https://talawa-testing.herokuapp.com/",
      {
        query: `
            mutation {
                createOrganization(data: {
                    name:"test org"
                    description:"test description"
                    isPublic: true
                    }) {
                        _id
                        name
                    }
            }
              `,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        },
      }
    );
    const { data } = response;
    expect(data.data.createOrganization).toEqual(
      expect.objectContaining({
        _id: expect.any(String),
        name: expect.any(String),
      })
    );
  });

  test("updateOrganization", async () => {
    const response = await axios.post(
      "https://talawa-testing.herokuapp.com/",
      {
        query: `
            mutation {
                updateOrganization(data: {
                    id: "5ed18229d7f4a244f8dee540",
                    description: "new description",
                    isPublic: false
                    }) {
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
          Authorization:`Bearer ${token}`
        },
      }
    );
    const { data } = response;
    expect(data).toMatchObject({
      data: {
        updateOrganization: {
          _id: "5ed18229d7f4a244f8dee540",
          name: "test org",
          description: "new description",
          isPublic: false,
        },
      },
    });
  });

  test("removeOrganization", async () => {
      //a new organization is created then deleted
    const response = await axios.post(
      "https://talawa-testing.herokuapp.com/",
      {
        query: `
            mutation {
                createOrganization(data: {
                    name:"test org"
                    description:"test description"
                    isPublic: true
                    }) {
                        _id
                        name
                    }
            }
              `,
      },
      {
        headers: {
          Authorization:`Bearer ${token}`
        },
      }
    );

    const { data } = response;

    const newOrgId = data.data.createOrganization._id;

    const deletedResponse = await axios.post(
      "https://talawa-testing.herokuapp.com/",
      {
        query: `
            mutation {
                removeOrganization(id: "${newOrgId}") {
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
          Authorization:`Bearer ${token}`
        },
      }
    );

    console.log(deletedResponse.data)
    expect(deletedResponse.data).toMatchObject(
        {
            "data": {
                "removeOrganization": {
                    "_id": `${newOrgId}`,
                    "name": "test org",
                    "description": "test description",
                    "isPublic": true
                }
            }
        }
    )

  });
});


module.exports.token =token
