
const axios = require("axios")
const shortid = require('shortid');

describe("user resolvers", ()=> {
    test("allUsers",async ()=> {
        const response = await axios.post("https://talawa-testing.herokuapp.com/", {
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
        const response = await axios.post("https://talawa-testing.herokuapp.com/", {
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



    test("login",async ()=> {
        const response = await axios.post("https://talawa-testing.herokuapp.com/", {
            query: `
            {
                login(data: {
                  email:"testdb2@test.com",
                  password:"password"
                }) {
                  userId
                  token
                  tokenExpiration
                }  
              }
              `            
        })
        const {data} = response;
        expect(data.data.login).toEqual(expect.objectContaining({
            userId: expect.any(String),
            token: expect.any(String),
            tokenExpiration: expect.any(Number)
        }))


    })

})