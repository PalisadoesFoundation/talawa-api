import { gql } from "apollo-server-core";
/**
 * This graphQL typeDef defines the logic for different queries defined in the talawa-api.
 */
// Place fields alphabetically to ensure easier lookup and navigation.
export const queries = gql`
  type Query {
    adminPlugin(orgId: ID!): [Plugin]

    """
    Used in clients: Admin
    """
    checkAuth: User! @auth

    """
    Used in clients: Mobile
    """
    directChatsByUserID(id: ID!): [DirectChat]

    """
    Used in clients: Mobile
    """
    directChatsMessagesByChatID(id: ID!): [DirectChatMessage]

    event(id: ID!): Event

    """
    Used in clients: Admin, Mobile
    """
    eventsByOrganization(id: ID, orderBy: EventOrderByInput): [Event]

    """
    Used in clients: Admin
    """
    eventsByOrganizationConnection(
      where: EventWhereInput
      first: Int
      skip: Int
      orderBy: EventOrderByInput
    ): [Event!]!

    getDonationById(id: ID!): Donation!

    getDonationByOrgId(orgId: ID!): [Donation]

    """
    Used in clients: Admin
    """
    getDonationByOrgIdConnection(
      orgId: ID!
      where: DonationWhereInput
      first: Int
      skip: Int
    ): [Donation!]!

    getlanguage(lang_code: String!): [Translation]

    """
    Used in clients: Admin, Mobile
    """
    getPlugins: [Plugin]

    isUserRegister(eventId: ID!): EventRegistrants

    joinedOrganizations(id: ID): [Organization]

    me: User! @auth

    """
    Used in clients: Mobile
    """
    myLanguage: String @auth

    """
    Used in clients: Admin, Mobile
    """
    organizations(id: ID, orderBy: OrganizationOrderByInput): [Organization]

    """
    Used in clients: Admin, Mobile
    """
    organizationsConnection(
      where: OrganizationWhereInput
      first: Int
      skip: Int
      orderBy: OrganizationOrderByInput
    ): [Organization]!

    """
    Used in clients: Admin
    """
    organizationsMemberConnection(
      orgId: ID!
      where: UserWhereInput
      first: Int
      skip: Int
      orderBy: UserOrderByInput
    ): UserConnection! @auth

    plugin(orgId: ID!): [Plugin]

    post(id: ID!): Post

    """
    Used in clients: Admin, Mobile
    """
    postsByOrganization(id: ID!, orderBy: PostOrderByInput): [Post]

    """
    Used in clients: Admin
    """
    postsByOrganizationConnection(
      id: ID!
      where: PostWhereInput
      first: Int
      skip: Int
      orderBy: PostOrderByInput
    ): PostConnection

    registeredEventsByUser(id: ID, orderBy: EventOrderByInput): [Event]

    """
    Used in clients: Mobile
    """
    registrantsByEvent(id: ID!): [User]

    tasksByEvent(id: ID!, orderBy: TaskOrderByInput): [Task]

    tasksByUser(id: ID!, orderBy: TaskOrderByInput): [Task]

    user(id: ID!): User! @auth

    """
    Used in clients: Mobile
    """
    userLanguage(userId: ID!): String @auth

    """
    Used in clients: Admin, Mobile
    """
    users(where: UserWhereInput, orderBy: UserOrderByInput): [User] @auth

    usersConnection(
      where: UserWhereInput
      first: Int
      skip: Int
      orderBy: UserOrderByInput
    ): [User]! @auth
  }
`;
