import { gql } from "apollo-server-core";
/**
 * This file creates schema for a plugin field.
 * The object consists of the following elements:
 * 1. key
 * 2. value
 * 3. status
 * 4. Created at date 
 */
export const pluginField = gql`
  type PluginField {
    key: String!
    value: String!
    status: Status!
    createdAt: String
  }
`;
