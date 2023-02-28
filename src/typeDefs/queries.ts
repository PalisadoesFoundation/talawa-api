import { gql } from "apollo-server-core";

// Place fields alphabetically to ensure easier lookup and navigation.
export const queries = gql`
  type Query {
    adminPlugin(orgId: ID!): [Plugin]

    checkAuth: User! @auth

    comments: [Comment]

    commentsByPost(id: ID!): [Comment]

    directChatMessages: [DirectChatMessage]

    directChats: [DirectChat]

    directChatsByUserID(id: ID!): [DirectChat]

    directChatsMessagesByChatID(id: ID!): [DirectChatMessage]

    event(id: ID!): Event

    events(id: ID, orderBy: EventOrderByInput): [Event]

    eventsByOrganization(id: ID, orderBy: EventOrderByInput): [Event]

    eventsByOrganizationConnection(
      where: EventWhereInput
      first: Int
      skip: Int
      orderBy: EventOrderByInput
    ): [Event!]!

    getDonationById(id: ID!): Donation!

    getDonationByOrgId(orgId: ID!): [Donation]

    getDonationByOrgIdConnection(
      orgId: ID!
      where: DonationWhereInput
      first: Int
      skip: Int
    ): [Donation!]!

    getDonations: [Donation]

    getlanguage(lang_code: String!): [Translation]

    getPlugins: [Plugin]

    groupChatMessages: [GroupChatMessage]

    groupChats: [GroupChat]

    groups: [Group]

    isUserRegister(eventId: ID!): EventRegistrants

    me: User! @auth

    myLanguage: String @auth

    organizations(id: ID, orderBy: OrganizationOrderByInput): [Organization]

    organizationsConnection(
      where: OrganizationWhereInput
      first: Int
      skip: Int
      orderBy: OrganizationOrderByInput
    ): [Organization]!

    organizationsMemberConnection(
      orgId: ID!
      where: UserWhereInput
      first: Int
      skip: Int
      orderBy: UserOrderByInput
    ): UserConnection! @auth

    plugin(orgId: ID!): [Plugin]

    pinnedPosts: [Post]

    pinnedPostsByOrganization(id: ID!): [Post]

    post(id: ID!): Post

    posts(orderBy: PostOrderByInput): [Post]

    postsByOrganization(id: ID!, orderBy: PostOrderByInput): [Post]

    postsByOrganizationConnection(
      id: ID!
      where: PostWhereInput
      first: Int
      skip: Int
      orderBy: PostOrderByInput
    ): PostConnection

    registeredEventsByUser(id: ID, orderBy: EventOrderByInput): [Event]

    registrantsByEvent(id: ID!): [User]

    tasksByEvent(id: ID!, orderBy: TaskOrderByInput): [Task]

    tasksByUser(id: ID!, orderBy: TaskOrderByInput): [Task]

    user(id: ID!): User! @auth

    userLanguage(userId: ID!): String @auth

    users(where: UserWhereInput, orderBy: UserOrderByInput): [User] @auth

    usersConnection(
      where: UserWhereInput
      first: Int
      skip: Int
      orderBy: UserOrderByInput
    ): [User]! @auth
  }
`;
