import gql from "graphql-tag";

export const typeDefs = gql`
  input MutationCreateCustomFieldInput {
    organizationId: ID!
    name: String!
    type: String!
  }

  type CustomField {
    id: ID!
    name: String!
    type: String!
    organizationId: ID!
    createdAt: DateTime!
    updatedAt: DateTime
  }

  extend type Mutation {
    addOrganizationCustomField(input: MutationCreateCustomFieldInput!): CustomField!
    removeCustomField(id: ID!): CustomField!
  }
`;
