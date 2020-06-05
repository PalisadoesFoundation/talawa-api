const axios = require("axios");
const {URL} = require("../../constants")



//sets token before every test
getToken = async () => {
  console.log("TOKEN SET")
    const response = await axios.post(URL, {
      query: `
      {
          login(data: {
            email:"testdb2@test.com",
            password:"password"
          }) {
            userId
            token
          }  
        }
        `,
    });
  
  
    const { data } = response;
    // expect(data.data.login).toEqual(
    //   expect.objectContaining({
    //     userId: expect.any(String),
    //     token: expect.any(String),
    //   })
    // );
  
    token = data.data.login.token;
    return token
  }

module.exports = getToken