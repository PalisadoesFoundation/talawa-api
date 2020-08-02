const axios = require("axios");
const { URL } = require("../../constants");

//sets token before every test
getToken = async () => {
	const response = await axios.post(URL, {
		query: `
      {
          login(data: {
            email:"rw@gmail.com",
            password:"test123"
          }) {
            userId
            token
          }  
        }
        `,
	});

	const { data } = response;
	return data.data.login.token;
};

module.exports = getToken;
