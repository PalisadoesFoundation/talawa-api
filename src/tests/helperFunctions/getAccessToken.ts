import axios from 'axios';
import { URL } from '../../constants';

/*
Helper function to get accessToken for a user by his/her email.
If the user does not exist it creates a new user and returns
his/her accessToken.
*/
export const getAccessToken = async (email: string) => {
  const { data } = await axios.post(URL, {
    query: `
      mutation {
        login(data: {email:"${email}", password: "password" }) {
          accessToken
        }
      }
    `,
  });

  if (data.data !== null) {
    return data.data.login.accessToken as string;
  } else {
    const { data } = await axios.post(URL, {
      query: `
        mutation {
          signUp(
            data: {
              firstName: "testdb2"
              lastName: "testdb2"
              email: "${email}"
              password: "password"
            }
          ) {
            accessToken
          }
        }
      `,
    });

    return data.data.signUp.accessToken as string;
  }
};
