const axios = require("axios");
const {URL} = require("../constants")


describe("user resolvers", () => {
  test("users-subqueries", async () => {
    const response = await axios.post(URL, {
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
