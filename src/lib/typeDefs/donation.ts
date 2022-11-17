import { gql } from "apollo-server-core";

/**
 * This graphQL typeDef defines the schema-defintion and 
 * contains logic to interact with `Donation` schema.
 */
export const donation = gql`
  type Donation {
    _id: ID!
    userId: ID!
    orgId: ID!
    payPalId: String!
    nameOfUser: String!
    nameOfOrg: String!
    amount: Float!
  }
`;
