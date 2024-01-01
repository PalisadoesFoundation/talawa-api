import { gql } from "graphql-tag";
import { GraphQLScalarType, Kind } from "graphql";

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
  scalar StartDate
  scalar Time
  scalar URL
  scalar Upload
  scalar JSON
  scalar Any
`;
export const StartDateResolver = new GraphQLScalarType({
  name: "StartDate",
  description:
    "Custom scalar representing a date greater than the current date",
  parseValue(value) {
    const dateValue = new Date(value as string);
    if (isNaN(dateValue.getTime()) || dateValue <= new Date()) {
      throw new Error("Date must be greater than the current date");
    }
    return dateValue;
  },
  serialize(value) {
    return (value as Date).getTime();
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.INT || ast.kind === Kind.STRING) {
      const dateValue = new Date(ast.value as string);
      if (isNaN(dateValue.getTime()) || dateValue <= new Date()) {
        throw new Error("Date must be greater than the current date");
      }
      return dateValue;
    }
    throw new Error("Invalid date value");
  },
});
