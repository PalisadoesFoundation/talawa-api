const axios = require('axios');

const { URL } = require('../../constants');

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
  return data.data.login.user._id;
};
