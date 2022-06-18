import { gql } from 'apollo-server-core';

export const auth = gql`
  input LoginInput {
    email: String!
    password: String!
  }

  type AuthData {
    user: User!
    accessToken: String!
    refreshToken: String!
  }

  type ExtendSession {
    accessToken: String!
    refreshToken: String!
  }
`;

export default auth;
