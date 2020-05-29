const axios = require("axios");
const token = require("./organization.spec.js");

describe("organization resolvers", () => {
  test("organization-subqueries", async () => {
    const response = await axios.post("https://talawa-testing.herokuapp.com/", {
      query: `
      {
        organizations {
            _id
            name
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
        }
    }
    `,
    });

    const { data } = response;

    expect(Array.isArray(data.data.organizations)).toBeTruthy()

  });
});
