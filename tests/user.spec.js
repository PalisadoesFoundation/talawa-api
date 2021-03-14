const axios = require("axios");
const shortid = require("shortid");
const { URL } = require("../constants");

let id = shortid.generate();
let email = `${id}@test.com`;

describe("user resolvers", () => {
  test("allUsers", async () => {
    const response = await axios.post(URL, {
      query: `query {
                users {
                  _id
                  firstName
                  lastName
                  email
                }
              }`,
    });
    const { data } = response;
    expect(Array.isArray(data.data.users)).toBeTruthy();
  });

  test("signUp", async () => {
    const response = await axios.post(URL, {
      query: `
            mutation {
                signUp(data: {
                  firstName:"testdb2",
                  lastName:"testdb2"
                  email: "${email}"
                  password:"password"
                }) {
                  user{
                    _id
                  }
                  accessToken
                }
              }
              `,
    });
    const { data } = response;
    expect(data.data.signUp).toEqual(
      expect.objectContaining({
        accessToken: expect.any(String),
      })
    );
  });

  test("login", async () => {
    const response = await axios.post(URL, {
      query: `
            mutation{
                login(data: {
                  email:"${email}",
                  password:"password"
                }) {
                  user{
                    _id
                  }
                  accessToken
                }  
              }
              `,
    });
    const { data } = response;
    expect(data.data.login).toEqual(
      expect.objectContaining({
        accessToken: expect.any(String),
      })
    );

    //token = data.data.login.token;
    //console.log(token)
  });
});
