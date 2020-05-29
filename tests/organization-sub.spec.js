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
            admins{
                _id
                firstName
            }
            members {
                _id
                firstName
            }
        }
    }
    `,
    });

    const { data } = response;

    expect(data.data.organizations).toEqual(
      expect.objectContaining({
        _id: expect.any(String),
        name: expect.any(String),
        creator: {
            _id: expect.any(String),
            firstName: expect.any(String)
        },
        admins: expect.arrayContaining[{
            _id: expect.any(String),
            firstName: expect.any(String)
        }],
        members: expect.arrayContaining[{
            _id: expect.any(String),
            firstName: expect.any(String)
        }]
      })
    );
  });
});
