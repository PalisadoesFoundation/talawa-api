const axios = require('axios');

const { URL } = require('../../constants');

module.exports = async (email) => {
  const response = await axios.post(URL, {
    query: `
    mutation{
        signUp(data:{
                email:"${email}",
                password:"password",
                firstName:"firstName",
                lastName:"lastName",
                appLanguageCode:"en"
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
  return data.data.signUp.user._id;
};
