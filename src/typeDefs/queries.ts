import { gql } from "apollo-server-core";

// Place fields alphabetically to ensure easier lookup and navigation.
export const queries = gql`
  type Query {
    adminPlugin(orgId: ObjectID!): [Plugin]

    checkAuth: User! @auth

    comments: [Comment]

    commentsByPost(id: ObjectID!): [Comment]

    directChatMessages: [DirectChatMessage]

    directChats: [DirectChat]

    directChatsByUserID(id: ObjectID!): [DirectChat]

    directChatsMessagesByChatID(id: ObjectID!): [DirectChatMessage]

    event(id: ObjectID!): Event

    events(id: ObjectID, orderBy: EventOrderByInput): [Event]

    eventsByOrganization(id: ObjectID, orderBy: EventOrderByInput): [Event]

    eventsByOrganizationConnection(
      where: EventWhereInput
      first: Int
      skip: Int
      orderBy: EventOrderByInput
    ): [Event]!

    getDonationById(id: ObjectID!): Donation!

    getDonationByOrgId(orgId: ObjectID!): [Donation]

    getDonationByOrgIdConnection(
      orgId: ObjectID!
      where: DonationWhereInput
      first: Int
      skip: Int
    ): [Donation]!

    getDonations: [Donation]

    getlanguage(lang_code: String!): [Translation]

    getPlugins: [Plugin]

    groupChatMessages: [GroupChatMessage]

    groupChats: [GroupChat]

    groups: [Group]

    isUserRegister(eventId: ObjectID!): EventRegistrants

    me: User! @auth

    myLanguage: String @auth

    organizations(
      id: ObjectID
      orderBy: OrganizationOrderByInput
    ): [Organization]

    organizationsConnection(
      where: OrganizationWhereInput
      first: Int
      skip: Int
      orderBy: OrganizationOrderByInput
    ): [Organization]!

    organizationsMemberConnection(
      orgId: ObjectID!
      where: UserWhereInput
      first: Int
      skip: Int
      orderBy: UserOrderByInput
    ): UserConnection! @auth

    plugin(orgId: ObjectID!): [Plugin]

    post(id: ObjectID!): Post

    posts(orderBy: PostOrderByInput): [Post]

    postsByOrganization(id: ObjectID!, orderBy: PostOrderByInput): [Post]

    postsByOrganizationConnection(
      id: ObjectID!
      where: PostWhereInput
      first: Int
      skip: Int
      orderBy: PostOrderByInput
    ): PostConnection

    registeredEventsByUser(id: ObjectID, orderBy: EventOrderByInput): [Event]

    registrantsByEvent(id: ObjectID!): [User]

    tasksByEvent(id: ObjectID!, orderBy: TaskOrderByInput): [Task]

    tasksByUser(id: ObjectID!, orderBy: TaskOrderByInput): [Task]

    user(id: ObjectID!): User! @auth

    userLanguage(userId: ObjectID!): String @auth

    users(where: UserWhereInput, orderBy: UserOrderByInput): [User] @auth

    usersConnection(
      where: UserWhereInput
      first: Int
      skip: Int
      orderBy: UserOrderByInput
    ): [User]! @auth
  }
`;
