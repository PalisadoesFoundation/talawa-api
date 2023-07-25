import { gql } from "graphql-tag";

export const addEventAttendeeErrors = gql`
  union AddEventAttendeeErrors =
      UnauthenticatedError
    | UnauthorizedError
    | UserNotFoundError
    | EventNotFoundError
    | UserAlreadyAttendeeError

  type UserAlreadyAttendeeError implements Error {
    message: String!
    path: [String!]!
  }
`;
