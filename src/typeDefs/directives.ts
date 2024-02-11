import { gql } from "graphql-tag";

// Place fields alphabetically to ensure easier lookup and navigation.
export const directives = gql`
  directive @auth on FIELD_DEFINITION

  directive @role(requires: UserType) on FIELD_DEFINITION
`;
