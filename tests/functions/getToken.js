const axios = require('axios');
const chalk = require('chalk');
const { URL } = require('../../constants');

// sets token before every test
module.exports = async () => {
  console.log(chalk.green('TOKEN SET'));
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
  return data.data.login.accessToken;
};
