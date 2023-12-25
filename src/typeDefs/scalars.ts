import { gql } from "graphql-tag";

// Place fields alphabetically to ensure easier lookup and navigation.
export const scalars = gql`
  scalar CountryCode
  scalar Date
  scalar DateTime
  scalar EmailAddress
  scalar Latitude
  scalar Longitude
  scalar ID
  scalar PhoneNumber
  scalar PositiveInt
  scalar Time
  scalar URL
  scalar Upload
  scalar JSON
  scalar Any
`;
