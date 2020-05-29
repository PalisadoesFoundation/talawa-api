
const axios = require("axios")
const shortid = require('shortid');

describe("user resolvers", ()=> {
    test("allUsers",async ()=> {
        const response = await axios.post("http://localhost:4000", {
            query: `query {
                users {
                  _id
                  firstName
                  lastName
                  email
                }
              }`            
        })
        const {data} = response;
        expect(Array.isArray(data.data.users)).toBeTruthy()
    })



    test("signUp", async()=> {
        var id = shortid.generate()
        var email = `${id}@test.com`
        console.log(email)
        const response = await axios.post("http://localhost:4000", {
            query: `
            mutation {
                signUp(data: {
                  firstName:"testdb2",
                  lastName:"testdb2"
                  email: "${email}"
                  password:"password"
                }) {
                  firstName
                  lastName
                  email
                }
              }
              `            
        })
        const {data} = response;
        console.log(data)
        expect(data).toMatchObject({
            "data": {
              "signUp": {
                "firstName": "testdb2",
                "lastName": "testdb2",
                "email": `${email}`
              }
            }
          })
    })
})