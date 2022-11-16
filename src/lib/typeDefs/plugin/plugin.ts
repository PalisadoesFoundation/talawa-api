import { gql } from "apollo-server-core";
/**
 * This file creates schema for a plugin.
 * The object consists of the following elements:
 * 1. Organization id
 * 2. Plugin name
 * 3. Plugin key
 * 4. Plugin type
 * 5. Additional information
 * 6. Created at date 
 */
export const plugin = gql`
  # type Plugin {
  #   orgId: Organization!
  #   pluginName: String!
  #   pluginKey: String
  #   pluginStatus: Status!
  #   pluginType: Type!
  #   additionalInfo: [PluginField!]
  #   createdAt: String
  # }

  input PluginInput {
    orgId: ID!
    pluginName: String!
    pluginKey: String
    pluginType: Type
    fields: [PluginFieldInput]
  }

  input PluginFieldInput {
    key: String!
    value: String!
  }

  # For Plugins
  type Plugin {
    _id: ID!
    pluginName: String!
    pluginCreatedBy: String!
    pluginDesc: String!
    pluginInstallStatus: Boolean!
    installedOrgs: [ID!]!
  }
`;
