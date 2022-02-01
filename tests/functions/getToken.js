const axios = require('axios');

const { URL } = require('../../constants');

// sets token before every test
module.exports = async (email) => {
  const response = await axios.post(URL, {
    query: `
    mutation{
      login(data:{
                email:"${email}",
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
  if (data.data !== null) {
    return data.data.login.accessToken;
  } else {
    const signUpResponse = await axios.post(URL, {
      query: `
            mutation {
                signUp(data: {
                  firstName:"testdb2",
                  lastName:"testdb2"
                  email: "${email}"
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
};
