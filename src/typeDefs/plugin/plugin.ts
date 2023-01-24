import { gql } from "apollo-server-core";

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
