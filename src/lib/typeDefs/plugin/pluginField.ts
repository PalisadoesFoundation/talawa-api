import { gql } from "apollo-server-core";
/**
 * This graphql typedef defines the schema-definition and contains 
 * the query logic to interact with a plugin field.
 */
export const pluginField = gql`
  type PluginField {
    key: String!
    value: String!
    status: Status!
    createdAt: String
  }
`;
