const axios = require("axios");
const { URL } = require("../constants");
const getToken = require("./functions/getToken");

let token;

beforeAll(async () => {
  token = await getToken();
});

describe("organization resolvers", () => {
  test("allOrganizations", async () => {
    let response = await axios.post(URL, {
      query: `{
                organizations {
                    _id
                    name
                }
            }
            `,
    });
    let { data } = response;
    expect(Array.isArray(data.data.organizations)).toBeTruthy();
  });

  let createdOrgId;
  test("createOrganization", async () => {
    let createdOrgResponse = await axios.post(
      URL,
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
          Authorization: `Bearer ${token}`,
        },
      }
    );
    console.log(createdOrgResponse.data.errors);
    let { data } = createdOrgResponse;
    createdOrgId = createdOrgResponse.data.data.createOrganization._id;
    //console.log(createdOrgId);
    expect(data.data.createOrganization).toEqual(
      expect.objectContaining({
        _id: expect.any(String),
        name: expect.any(String),
      })
    );
  });

  // console.log(createdOrgId)

  // test("updateOrganization", async () => {
  //   let updateOrgRes = await axios.post(
  //     URL,
  //     {
  //       query: `
  //           mutation {
  //               updateOrganization(id: "${createdOrgId}", data: {
  //                   description: "new description",
  //                   isPublic: false
  //                   }) {
  //                       _id
  //                       description
  //                       isPublic
  //                   }
  //           }
  //             `,
  //     },
  //     {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //     }
  //   );

  //   let{ data } = updateOrgRes;
  //   console.log(updateOrgRes.data)

  //   expect(data).toMatchObject({
  //     data: {
  //       updateOrganization: {
  //         _id: `${createdOrgId}`,
  //         description: "new description",
  //         isPublic: false,
  //       },
  //     },
  //   });
  // });

  // test("removeOrganization", async () => {
  //   //a new organization is created then deleted
  //   let response = await axios.post(
  //     URL,
  //     {
  //       query: `
  //           mutation {
  //               createOrganization(data: {
  //                   name:"test org"
  //                   description:"test description"
  //                   isPublic: true
  //                   }) {
  //                       _id
  //                       name
  //                   }
  //           }
  //             `,
  //     },
  //     {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //     }
  //   );

  //   let { data } = response;

  //   const newOrgId = data.data.createOrganization._id;

  //   const deletedResponse = await axios.post(
  //     URL,
  //     {
  //       query: `
  //           mutation {
  //               removeOrganization(id: "${newOrgId}") {
  //                   _id
  //                   name
  //                   description
  //                   isPublic
  //               }
  //           }
  //           `,
  //     },
  //     {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //     }
  //   );

  //   expect(deletedResponse.data).toMatchObject({
  //     data: {
  //       removeOrganization: {
  //         _id: `${newOrgId}`,
  //         name: "test org",
  //         description: "test description",
  //         isPublic: true,
  //       },
  //     },
  //   });
  // });
});

module.exports.token = token;
