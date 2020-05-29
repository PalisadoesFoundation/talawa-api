const axios = require("axios");
const token = require("./organization.spec.js")


describe("organization resolvers", () => {
  test("organizationCreator", async () => {
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
});
