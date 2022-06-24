import { gql } from 'apollo-server-core';

export const pluginField = gql`
  type PluginField {
    key: String!
    value: String!
    status: Status!
    createdAt: String
  }
`;
