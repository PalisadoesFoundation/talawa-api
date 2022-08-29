import axios from 'axios';
import { URL } from '../../constants';

// Helper function to quickly sign up a user and get his/her userId.
export const getUserIdFromSignUp = async (email: string) => {
  const { data } = await axios.post(URL, {
    query: `
      mutation {
        signUp(
          data: {
            email: "${email}"
            password: "password"
            firstName: "firstName"
            lastName: "lastName"
            appLanguageCode: "en"
          }
        ) {
          user {
            _id
          }
        }
      }
    `,
  });

  return data.data.signUp.user._id;
};
