const axios = require("axios");
const { URL } = require("../../constants");

//sets token before every test
getToken = async () => {
	const response = await axios.post(URL, {
    query: `
      mutation {
        login(
            data: {
                email: "rw@gmail.com",
                password: "test123"
        }) {
            user {
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

module.exports = getToken;
