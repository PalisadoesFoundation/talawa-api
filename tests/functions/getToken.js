const axios = require('axios');

const { URL } = require('../../constants');

// sets token before every test
module.exports = async () => {
  console.log(process.env.NODE_ENV);
  const response = await axios.post(URL, {
    query: `
    mutation{
      login(data:{
                email:"testdb2@test.com",
                password:"password"
      }){
        user{
        _id
        }
        accessToken
        refreshToken
      }
    }
    `,
  });

  const { data } = response;

  if (data.errors && data.errors[0].message === 'User not found') {
    const signUpResponse = await axios.post(URL, {
      query: `
            mutation {
                signUp(data: {
                  firstName:"testdb2",
                  lastName:"testdb2"
                  email: "testdb2@test.com"
                  password:"password"
                }) {
                    user {
                      _id
                      firstName
                      lastName
                      email
                      userType
                      appLanguageCode
                      image
                    }
                    accessToken
                  }
                }
                `,
    });
    const { data } = signUpResponse;
    return data.data.signUp.accessToken;
  }
  return data.data.login.accessToken;
};