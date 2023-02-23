import { gql } from "apollo-server-core";

// Place fields alphabetically to ensure easier lookup and navigation.
export const scalars = gql`
  scalar Date
  scalar DateTime
  scalar EmailAddress
  scalar Latitude
  scalar Longitude
  scalar PhoneNumber
  scalar Time
  scalar URL
`;
