import { gql } from "apollo-server-core";

/**
 * This graphql typedef defines the schema-definition and contains 
 * the query logic for different kinds of suthentications.
 */
export const auth = gql`
  input LoginInput {
    email: String!
    password: String!
  }

  type AndroidFirebaseOptions {
    apiKey: String
    appId: String
    messagingSenderId: String
    projectId: String
    storageBucket: String
  }

  type IOSFirebaseOptions {
    apiKey: String
    appId: String
    messagingSenderId: String
    projectId: String
    storageBucket: String
    iosClientId: String
    iosBundleId: String
  }

  type AuthData {
    user: User!
    accessToken: String!
    refreshToken: String!
    androidFirebaseOptions: AndroidFirebaseOptions!
    iosFirebaseOptions: IOSFirebaseOptions!
  }

  type ExtendSession {
    accessToken: String!
    refreshToken: String!
  }

  input RecaptchaVerification {
    recaptchaToken: String!
  }

  input OTPInput {
    email: String!
  }

  type OtpData {
    otpToken: String!
  }

  input ForgotPasswordData {
    userOtp: String!
    newPassword: String!
    otpToken: String!
  }
`;
