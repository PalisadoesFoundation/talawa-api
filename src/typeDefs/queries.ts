import { gql } from "graphql-tag";
/**
 * This graphQL typeDef defines the logic for different queries defined in the talawa-api.
 */
// Place fields alphabetically to ensure easier lookup and navigation.
export const queries = gql`
  type Query {
    adminPlugin(orgId: ID!): [Plugin]

    actionItemsByEvent(eventId: ID!): [ActionItem]

    actionItemsByOrganization(
      organizationId: ID!
      where: ActionItemWhereInput
      orderBy: ActionItemsOrderByInput
    ): [ActionItem]

    actionItemCategoriesByOrganization(
      organizationId: ID!
    ): [ActionItemCategory]
    getAgendaItem(id: ID!): AgendaItem

    getAllAgendaItems: [AgendaItem]

    agendaCategory(id: ID!): AgendaCategory!

    getAgendaSection(id: ID!): AgendaSection

    checkAuth: User! @auth

    getCommunityData: Community

    customFieldsByOrganization(id: ID!): [OrganizationCustomField]

    customDataByOrganization(organizationId: ID!): [UserCustomData!]!

    directChatsByUserID(id: ID!): [DirectChat]

    directChatsMessagesByChatID(id: ID!): [DirectChatMessage]

    event(id: ID!): Event

    eventsByOrganization(id: ID, orderBy: EventOrderByInput): [Event]

    eventsByOrganizationConnection(
      where: EventWhereInput
      first: Int
      skip: Int
      orderBy: EventOrderByInput
    ): [Event!]!

    eventVolunteersByEvent(id: ID!): [EventVolunteer]

    fundsByOrganization(organizationId: ID!, where: FundWhereInput): [Fund]

    getDonationById(id: ID!): Donation!

    getEventAttendeesByEventId(eventId: ID!): [EventAttendee]

    getEventAttendee(userId: ID!, eventId: ID!): EventAttendee
    getFundById(id: ID!): Fund!
    getFundraisingCampaignById(id: ID!): FundraisingCampaign!
    getFundraisingCampaignPledgeById(id: ID!): FundraisingCampaignPledge!

    getDonationByOrgId(orgId: ID!): [Donation]

    getDonationByOrgIdConnection(
      orgId: ID!
      where: DonationWhereInput
      first: Int
      skip: Int
    ): [Donation!]!

    getlanguage(lang_code: String!): [Translation]

    getPlugins: [Plugin]
    advertisementsConnection(
      after: String
      before: String
      first: PositiveInt
      last: PositiveInt
    ): AdvertisementsConnection

    isSampleOrganization(id: ID!): Boolean!
    hasSubmittedFeedback(userId: ID!, eventId: ID!): Boolean

    joinedOrganizations(id: ID): [Organization]

    me: UserData! @auth

    myLanguage: String @auth

    organizations(
      id: ID
      orderBy: OrganizationOrderByInput
      first: Int
      skip: Int
      where: MembershipRequestsWhereInput
    ): [Organization]

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

    post(id: ID!): Post

    registeredEventsByUser(id: ID, orderBy: EventOrderByInput): [Event]

    registrantsByEvent(id: ID!): [User]

    user(id: ID!): UserData! @auth

    userLanguage(userId: ID!): String @auth

    users(
      where: UserWhereInput
      orderBy: UserOrderByInput
      first: Int
      skip: Int

      adminApproved: Boolean
    ): [UserData] @auth

    usersConnection(
      where: UserWhereInput
      first: Int
      skip: Int
      orderBy: UserOrderByInput
    ): [UserData]! @auth

    venue(id: ID!): Venue
  }
`;
