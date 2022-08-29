import axios from 'axios';
import { URL } from '../../constants';

// Helper function to login an existing user by his/her email and get his/her userId.
export const getUserIdFromLogin = async (email: string) => {
  const { data } = await axios.post(URL, {
    query: `
      mutation {
        login(data: { email: "${email}", password: "password" }) {
          user {
            _id
          }
        }
      }
    `,
  });

  return data.data.login.user._id as string;
};
