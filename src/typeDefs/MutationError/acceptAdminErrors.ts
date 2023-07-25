import { gql } from "graphql-tag";

export const acceptAdminErrors = gql`
  union AcceptAdminError =
      UnauthenticatedError
    | UnauthorizedError
    | UserNotFoundError
`;
