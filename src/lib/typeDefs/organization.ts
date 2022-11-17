import { gql } from "apollo-server-core";

/**
 * This graphQL typeDef defines the schema-defintion and 
 * contains query logic to interact with `Organization` and related schemas.
 */
export const organization = gql`
  type Organization {
    image: String
    _id: ID!
    name: String!
    description: String!
    location: String
    isPublic: Boolean!
    creator: User!
    members: [User]
    admins(adminId: ID): [User]
    membershipRequests: [MembershipRequest]
    blockedUsers: [User]
    visibleInSearch: Boolean!
    apiUrl: String!
    createdAt: String
    tags: [String!]!
  }

  type OrganizationInfoNode {
    image: String
    _id: ID!
    name: String!
    description: String!
    isPublic: Boolean!
    creator: User!
    visibleInSearch: Boolean!
    apiUrl: String!
    tags: [String!]!
  }

  input OrganizationInput {
    name: String!
    description: String!
    location: String
    attendees: String
    isPublic: Boolean!
    visibleInSearch: Boolean!
    apiUrl: String
  }

  input UpdateOrganizationInput {
    name: String
    description: String
    isPublic: Boolean
    visibleInSearch: Boolean
  }

  input UserAndOrganizationInput {
    organizationId: ID!
    userId: ID!
  }

  input MultipleUsersAndOrganizationInput {
    organizationId: ID!
    userIds: [ID!]!
  }

  type MembershipRequest {
    _id: ID!
    user: User!
    organization: Organization!
  }

  input OrganizationWhereInput {
    id: ID
    id_not: ID
    id_in: [ID!]
    id_not_in: [ID!]
    id_contains: ID
    id_starts_with: ID

    name: String
    name_not: String
    name_in: [String!]
    name_not_in: [String!]
    name_contains: String
    name_starts_with: String

    description: String
    description_not: String
    description_in: [String!]
    description_not_in: [String!]
    description_contains: String
    description_starts_with: String

    apiUrl: String
    apiUrl_not: String
    apiUrl_in: [String!]
    apiUrl_not_in: [String!]
    apiUrl_contains: String
    apiUrl_starts_with: String

    visibleInSearch: Boolean

    isPublic: Boolean
  }

  enum OrganizationOrderByInput {
    id_ASC
    id_DESC
    name_ASC
    name_DESC
    description_ASC
    description_DESC
    apiUrl_ASC
    apiUrl_DESC
  }
`;
