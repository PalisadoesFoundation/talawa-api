import { gql } from "graphql-tag";

// Place fields alphabetically to ensure easier lookup and navigation.
export const types = gql`
  type AggregatePost {
    count: Int!
  }

  type AggregateUser {
    count: Int!
  }

  type AuthData {
    user: User!
    appUserProfile: AppUserProfile!
    accessToken: String!
    refreshToken: String!
  }

  type ActionItemCategory {
    _id: ID!
    name: String!
    organization: Organization
    isDisabled: Boolean!
    creator: User
    createdAt: Date!
    updatedAt: Date!
  }

  type AgendaItem {
    _id: ID!
    title: String!
    description: String
    duration: String!
    attachments: [String]
    createdBy: User!
    updatedBy: User!
    urls: [String]
    users: [User]
    categories: [AgendaCategory]
    sequence: Int!
    createdAt: Date!
    updatedAt: Date!
    organization: Organization!
    relatedEvent: Event
  }

  type AgendaCategory {
    _id: ID!
    name: String!
    description: String
    organization: Organization!
    createdBy: User!
    updatedBy: User
    createdAt: Date!
    updatedAt: Date
  }

  type AgendaSection {
    _id: ID!
    relatedEvent: Event
    description: String!
    items: [AgendaItem]
    sequence: Int!
    createdAt: Date!
    updatedAt: Date
    createdBy: User
    updatedBy: User
  }
  # Action Item for a ActionItemCategory
  type ActionItem {
    _id: ID!
    assignee: User
    assigner: User
    actionItemCategory: ActionItemCategory
    preCompletionNotes: String
    postCompletionNotes: String
    allotedHours: Float
    assignmentDate: Date!
    dueDate: Date!
    completionDate: Date!
    isCompleted: Boolean!
    event: Event
    creator: User
    createdAt: Date!
    updatedAt: Date!
  }

  # Stores the detail of an check in of an user in an event
  type CheckIn {
    _id: ID!
    createdAt: DateTime!
    feedbackSubmitted: Boolean!
    event: Event!
    time: DateTime!
    updatedAt: DateTime!
    user: User!
  }

  # Stores the detail of an check out of an user in an event
  type CheckOut {
    _id: ID!
    eventAttendeeId: ID!
    createdAt: DateTime!
    time: DateTime!
    updatedAt: DateTime!
  }

  # Used to show whether an user has checked in for an event
  type CheckInStatus {
    _id: ID!
    user: User!
    checkIn: CheckIn
  }

  type Comment {
    _id: ID!
    text: String!
    post: Post!
    likedBy: [User]
    likeCount: Int
    creator: User
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Community {
    _id: ID!
    name: String!
    logoUrl: String
    websiteLink: String
    socialMediaUrls: SocialMediaUrls
    timeout: Int
  }
  type CreateAdminPayload {
    user: AppUserProfile
    userErrors: [CreateAdminError!]!
  }
  type UserFamily {
    _id: ID!
    title: String
    users: [User!]!
    admins: [User!]!
    creator: User!
  }

  """
  Default connection page info for containing the metadata for a connection
  instance.
  """
  type DefaultConnectionPageInfo implements ConnectionPageInfo {
    endCursor: String
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
  }

  type CreateMemberPayload {
    organization: Organization
    userErrors: [CreateMemberError!]!
  }

  type CreateCommentPayload {
    comment: Comment
    userErrors: [CreateCommentError!]!
  }

  type DeletePayload {
    success: Boolean!
  }

  type DeleteAdvertisementPayload {
    advertisement: Advertisement
  }

  type Donation {
    _id: ID!
    userId: ID!
    orgId: ID!
    payPalId: String!
    nameOfUser: String!
    nameOfOrg: String!
    amount: Float!
    createdAt: DateTime!
    updatedAt: DateTime!
  }
  type Advertisement {
    _id: ID!
    name: String!
    organization: Organization
    mediaUrl: URL!
    type: AdvertisementType!
    startDate: Date!
    endDate: Date!
    createdAt: DateTime!
    creator: User
    updatedAt: DateTime!
  }

  type AdvertisementEdge {
    cursor: String
    node: Advertisement
  }

  type AdvertisementsConnection {
    edges: [AdvertisementEdge]
    pageInfo: DefaultConnectionPageInfo!
    totalCount: Int
  }

  type UpdateAdvertisementPayload {
    advertisement: Advertisement
  }

  type CreateAdvertisementPayload {
    advertisement: Advertisement
  }

  type ExtendSession {
    accessToken: String!
    refreshToken: String!
  }

  type Event {
    _id: ID!
    title: String!
    description: String!
    startDate: Date!
    endDate: Date
    images: [String]
    startTime: Time
    endTime: Time
    allDay: Boolean!
    recurring: Boolean!
    recurrenceRule: RecurrenceRule
    baseRecurringEvent: Event
    isRecurringEventException: Boolean!
    isPublic: Boolean!
    isRegisterable: Boolean!
    location: String
    latitude: Latitude
    longitude: Longitude
    organization: Organization
    creator: User
    createdAt: DateTime!
    updatedAt: DateTime!
    attendees: [User]
    # For each attendee, gives information about whether he/she has checked in yet or not
    attendeesCheckInStatus: [CheckInStatus!]!
    actionItems: [ActionItem]
    admins(adminId: ID): [User!]
    feedback: [Feedback!]!
    averageFeedbackScore: Float
    agendaItems: [AgendaItem]
  }

  type EventVolunteer {
    _id: ID!
    createdAt: DateTime!
    creator: User
    event: Event
    group: EventVolunteerGroup
    isAssigned: Boolean
    isInvited: Boolean
    response: String
    user: User!
    updatedAt: DateTime!
  }

  type EventAttendee {
    _id: ID!
    userId: ID!
    eventId: ID!
    checkInId: ID
    checkOutId: ID
    isInvited: Boolean!
    isRegistered: Boolean!
    isCheckedIn: Boolean!
    isCheckedOut: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type EventVolunteerGroup {
    _id: ID!
    createdAt: DateTime!
    creator: User
    event: Event
    leader: User!
    name: String
    updatedAt: DateTime!
    volunteers: [EventVolunteer]
    volunteersRequired: Int
  }

  type Feedback {
    _id: ID!
    event: Event!
    rating: Int!
    review: String
    createdAt: DateTime!
    updatedAt: DateTime!
  }

  type Fund {
    _id: ID!
    organizationId: ID!
    name: String!
    refrenceNumber: String
    taxDeductible: Boolean!
    isDefault: Boolean!
    isArchived: Boolean!
    creator: User
    campaigns: [FundraisingCampaign]
    createdAt: DateTime!
    updatedAt: DateTime!
  }
  type FundraisingCampaign {
    _id: ID!
    fundId: Fund!
    organizationId: Organization!
    name: String!
    startDate: Date!
    endDate: Date!
    fundingGoal: Float!
    currency: Currency!
    pledges: [FundraisingCampaignPledge]
    createdAt: DateTime!
    updatedAt: DateTime!
  }
  type FundraisingCampaignPledge {
    _id: ID!
    campaign: FundraisingCampaign!
    users: [User]!
    startDate: Date
    endDate: Date
    amount: Float!
    currency: Currency!
  }

  type Group {
    _id: ID!
    title: String!
    description: String
    createdAt: DateTime!
    updatedAt: DateTime!
    organization: Organization!
    admins: [User!]!
  }

  type Language {
    _id: ID!
    en: String!
    translation: [LanguageModel]
    createdAt: String!
  }

  type LanguageModel {
    _id: ID!
    lang_code: String!
    value: String!
    verified: Boolean!
    createdAt: DateTime!
  }

  type MembershipRequest {
    _id: ID!
    user: User!
    organization: Organization!
  }

  type Message {
    _id: ID!
    text: String!
    createdAt: DateTime!
    updatedAt: DateTime!
    imageUrl: URL
    videoUrl: URL
    creator: User
  }

  type Note {
    _id: ID!
    content: String!
    createdBy: User!
    updatedBy: User!
    createdAt: DateTime!
    updatedAt: DateTime!
    agendaItemId: ID!
  }

  type Organization {
    image: String
    _id: ID!
    name: String!
    description: String!
    address: Address
    advertisements(
      after: String
      before: String
      first: Int
      last: Int
    ): AdvertisementsConnection
    creator: User
    createdAt: DateTime!
    updatedAt: DateTime!
    members: [User]
    actionItemCategories: [ActionItemCategory]
    agendaCategories: [AgendaCategory]
    admins(adminId: ID): [User!]
    membershipRequests(
      first: Int
      skip: Int
      where: MembershipRequestsWhereInput
    ): [MembershipRequest]
    userRegistrationRequired: Boolean!
    visibleInSearch: Boolean!
    blockedUsers: [User]
    apiUrl: URL!
    pinnedPosts: [Post]
    userTags(
      after: String
      before: String
      first: PositiveInt
      last: PositiveInt
    ): UserTagsConnection
    posts(
      after: String
      before: String
      first: PositiveInt
      last: PositiveInt
    ): PostsConnection
    funds: [Fund]
    customFields: [OrganizationCustomField!]!
    venues: [Venue]
  }

  type OrganizationCustomField {
    _id: ID!
    type: String!
    name: String!
    organizationId: String!
  }

  type OrganizationInfoNode {
    image: String
    _id: ID!
    name: String!
    description: String!
    creator: User
    apiUrl: URL!
    userRegistrationRequired: Boolean!
    visibleInSearch: Boolean!
  }

  type OtpData {
    otpToken: String!
  }

  type Venue {
    _id: ID!
    capacity: Int!
    description: String
    imageUrl: URL
    name: String!
    organization: Organization!
  }

  """
  Information about pagination in a connection.
  """
  type PageInfo {
    """
    When paginating forwards, are there more items?
    """
    hasNextPage: Boolean!

    """
    When paginating backwards, are there more items?
    """
    hasPreviousPage: Boolean!

    totalPages: Int
    nextPageNo: Int
    prevPageNo: Int
    currPageNo: Int
  }

  # For Plugins
  type Plugin {
    _id: ID!
    pluginName: String!
    pluginCreatedBy: String!
    pluginDesc: String!
    uninstalledOrgs: [ID!]
  }

  type PluginField {
    key: String!
    value: String!
    status: Status!
    createdAt: DateTime!
  }

  type Post {
    _id: ID
    text: String!
    title: String
    createdAt: DateTime!
    creator: User
    updatedAt: DateTime!
    imageUrl: URL
    videoUrl: URL
    organization: Organization!
    likedBy: [User]
    comments: [Comment]
    likeCount: Int
    commentCount: Int
    pinned: Boolean
  }

  type RecurrenceRule {
    organization: Organization
    baseRecurringEvent: Event
    recurrenceStartDate: Date!
    recurrenceEndDate: Date
    recurrenceRuleString: String!
    frequency: Frequency!
    weekDays: [WeekDays]
    interval: PositiveInt!
    count: PositiveInt
    weekDayOccurenceInMonth: Int
    latestInstanceDate: Date
  }

  type SocialMediaUrls {
    facebook: String
    instagram: String
    X: String
    linkedIn: String
    gitHub: String
    youTube: String
    slack: String
    reddit: String
  }

  type Translation {
    lang_code: String
    en_value: String
    translation: String
    verified: Boolean
  }

  type Address {
    city: String
    countryCode: String
    dependentLocality: String
    line1: String
    line2: String
    postalCode: String
    sortingCode: String
    state: String
  }

  type UserPhone {
    home: PhoneNumber
    mobile: PhoneNumber
    work: PhoneNumber
  }

  type User {
    _id: ID!
    identifier: Int!
    appUserProfileId: AppUserProfile
    address: Address
    birthDate: Date
    createdAt: DateTime!
    educationGrade: EducationGrade
    email: EmailAddress!
    employmentStatus: EmploymentStatus
    posts(
      after: String
      before: String
      first: PositiveInt
      last: PositiveInt
    ): PostsConnection
    eventAdmin: [Event]
    firstName: String!
    gender: Gender
    image: String
    joinedOrganizations: [Organization]
    lastName: String!
    maritalStatus: MaritalStatus
    organizationsBlockedBy: [Organization]
    phone: UserPhone
    membershipRequests: [MembershipRequest]
    registeredEvents: [Event]
    eventsAttended: [Event]
    pluginCreationAllowed: Boolean!
    tagsAssignedWith(
      after: String
      before: String
      first: PositiveInt
      last: PositiveInt
      organizationId: ID
    ): UserTagsConnection
    updatedAt: DateTime!
  }
  type AppUserProfile {
    _id: ID!
    userId: User!
    adminFor: [Organization]
    createdEvents: [Event]
    createdOrganizations: [Organization]
    eventAdmin: [Event]
    pledges: [FundraisingCampaignPledge]
    campaigns: [FundraisingCampaign]
    pluginCreationAllowed: Boolean!
    isSuperAdmin: Boolean!
    appLanguageCode: String!
  }

  type PostsConnection {
    edges: [PostEdge!]!
    pageInfo: DefaultConnectionPageInfo!
    totalCount: Int
  }
  type PostEdge {
    node: Post!
    cursor: String!
  }

  type UserCustomData {
    _id: ID!
    organizationId: ID!
    userId: ID!
    values: JSON!
  }
  type UserData {
    user: User!
    appUserProfile: AppUserProfile
  }
  type UserConnection {
    pageInfo: PageInfo!
    edges: [User]!
    aggregate: AggregateUser!
  }

  type UserTag {
    """
    A field to get the mongodb object id identifier for this UserTag.
    """
    _id: ID!
    """
    A field to get the name of this UserTag.
    """
    name: String!
    """
    A field to traverse the Organization that created this UserTag.
    """
    organization: Organization
    """
    A field to traverse the parent UserTag of this UserTag.
    """
    parentTag: UserTag
    """
    A connection field to traverse a list of UserTag this UserTag is a
    parent to.
    """
    childTags(
      after: String
      before: String
      first: PositiveInt
      last: PositiveInt
    ): UserTagsConnection
    """
    A connection field to traverse a list of User this UserTag is assigned
    to.
    """
    usersAssignedTo(
      after: String
      before: String
      first: PositiveInt
      last: PositiveInt
    ): UsersConnection
  }

  """
  A default connection on the UserTag type.
  """
  type UserTagsConnection {
    edges: [UserTagsConnectionEdge!]!
    pageInfo: DefaultConnectionPageInfo!
    totalCount: Int
  }

  """
  A default connection edge on the UserTag type for UserTagsConnection.
  """
  type UserTagsConnectionEdge {
    cursor: String!
    node: UserTag!
  }

  """
  A default connection on the User type.
  """
  type UsersConnection {
    edges: [UsersConnectionEdge!]!
    pageInfo: DefaultConnectionPageInfo!
    totalCount: Int
  }

  """
  A default connection edge on the User type for UsersConnection.
  """
  type UsersConnectionEdge {
    cursor: String!
    node: User!
  }

  type Chat {
    _id: ID!
    isGroup: Boolean!
    name: String
    createdAt: DateTime!
    creator: User
    messages: [ChatMessage]
    organization: Organization
    updatedAt: DateTime!
    users: [User!]!
    admins: [User]
    lastMessageId: String
    image: String
  }

  type ChatMessage {
    _id: ID!
    createdAt: DateTime!
    chatMessageBelongsTo: Chat!
    replyTo: ChatMessage
    messageContent: String!
    sender: User!
    deletedBy: [User]
    updatedAt: DateTime!
  }
`;
