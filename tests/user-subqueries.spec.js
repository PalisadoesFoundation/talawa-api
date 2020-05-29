const axios = require("axios");
const token = require("./organization.spec.js");

describe("user resolvers", () => {
  test("users-subqueries", async () => {
    const response = await axios.post("https://talawa-testing.herokuapp.com/", {
      query: `
      {
        users {
          _id
          firstName
          lastName
          email
          createdOrganizations {
            _id
            name
          }
          adminFor {
            _id
            name
          }
          joinedOrganizations {
            _id
            name
          }
        }
      }
    `,
    });

    const { data } = response;

    expect(Array.isArray(data.data.users)).toBeTruthy()

  });
});
