import { gql } from 'apollo-server-core';

export const user = gql`
  type User {
    tokenVersion: Int!
    _id: ID!
    firstName: String!
    lastName: String!
    email: String!
    userType: String
    appLanguageCode: String!
    createdOrganizations: [Organization]
    joinedOrganizations: [Organization]
    createdEvents: [Event]
    registeredEvents: [Event]
    eventAdmin: [Event]
    adminFor: [Organization]
    membershipRequests: [MembershipRequest]
    organizationsBlockedBy: [Organization]
    image: String
    organizationUserBelongsTo: Organization
    pluginCreationAllowed: Boolean
  }

  type UserConnection {
    pageInfo: PageInfo!
    edges: [User]!
    aggregate: AggregateUser!
  }

  type AggregateUser {
    count: Int!
  }

  input UserInput {
    firstName: String!
    lastName: String!
    email: String!
    password: String!
    userType: UserType
    appLanguageCode: String
    organizationUserBelongsToId: ID
  }

  input UpdateUserInput {
    firstName: String
    lastName: String
    email: String
  }

  input UserWhereInput {
    id: ID
    id_not: ID
    id_in: [ID!]
    id_not_in: [ID!]
    id_contains: ID
    id_starts_with: ID

    firstName: String
    firstName_not: String
    firstName_in: [String!]
    firstName_not_in: [String!]
    firstName_contains: String
    firstName_starts_with: String

    lastName: String
    lastName_not: String
    lastName_in: [String!]
    lastName_not_in: [String!]
    lastName_contains: String
    lastName_starts_with: String

    email: String
    email_not: String
    email_in: [String!]
    email_not_in: [String!]
    email_contains: String
    email_starts_with: String

    appLanguageCode: String
    appLanguageCode_not: String
    appLanguageCode_in: [String!]
    appLanguageCode_not_in: [String!]
    appLanguageCode_contains: String
    appLanguageCode_starts_with: String
  }

  enum UserOrderByInput {
    id_ASC
    id_DESC
    firstName_ASC
    firstName_DESC
    lastName_ASC
    lastName_DESC
    email_ASC
    email_DESC
    appLanguageCode_ASC
    appLanguageCode_DESC
  }
`;
