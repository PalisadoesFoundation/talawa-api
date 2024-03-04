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

  # Action Item for a ActionItemCategory
  type ActionItem {
    _id: ID!
    assignee: User
    assigner: User
    actionItemCategory: ActionItemCategory
    preCompletionNotes: String
    postCompletionNotes: String
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
    time: DateTime!
    user: User!
    event: Event!
    feedbackSubmitted: Boolean!
    createdAt: DateTime!
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

  type DeletePayload {
    success: Boolean!
  }

  type DeleteAdvertisementPayload {
    advertisement: Advertisement
  }

  type DirectChat {
    _id: ID!
    users: [User!]!
    messages: [DirectChatMessage]
    creator: User
    createdAt: DateTime!
    updatedAt: DateTime!
    organization: Organization!
  }

  type DirectChatMessage {
    _id: ID!
    directChatMessageBelongsTo: DirectChat!
    sender: User!
    receiver: User!
    createdAt: DateTime!
    updatedAt: DateTime!
    messageContent: String!
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
    pageInfo: ConnectionPageInfo
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
    recurrance: Recurrance
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
    status: Status!
    feedback: [Feedback!]!
    averageFeedbackScore: Float
  }

  type EventVolunteer {
    _id: ID!
    createdAt: DateTime!
    creator: User
    event: Event
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
    isInvited: Boolean!
    isRegistered: Boolean!
    isCheckedIn: Boolean!
    isCheckedOut: Boolean!
    createdAt: DateTime!
    updatedAt: DateTime!
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
    campaigns: [FundraisingCampaign!]
    createdAt: DateTime!
    updatedAt: DateTime!
  }
  type FundraisingCampaign {
    _id: ID!
    fundId: Fund!
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
    campaigns: [FundraisingCampaign]!
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

  type GroupChat {
    _id: ID!
    users: [User!]!
    messages: [GroupChatMessage]
    creator: User
    createdAt: DateTime!
    updatedAt: DateTime!
    organization: Organization!
  }

  type GroupChatMessage {
    _id: ID!
    groupChatMessageBelongsTo: GroupChat!
    sender: User!
    createdAt: DateTime!
    updatedAt: DateTime!
    messageContent: String!
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

  type MessageChat {
    _id: ID!
    sender: User!
    receiver: User!
    message: String!
    languageBarrier: Boolean
    createdAt: DateTime!
    updatedAt: DateTime!
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
    membershipRequests: [MembershipRequest]
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
    address: Address
    adminApproved: Boolean
    adminFor: [Organization]
    appLanguageCode: String!
    birthDate: Date
    createdAt: DateTime!
    createdEvents: [Event]
    createdOrganizations: [Organization]
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
    membershipRequests: [MembershipRequest]
    organizationsBlockedBy: [Organization]
    phone: UserPhone
    pluginCreationAllowed: Boolean!
    registeredEvents: [Event]
    tagsAssignedWith(
      after: String
      before: String
      first: PositiveInt
      last: PositiveInt
      organizationId: ID
    ): UserTagsConnection
    tokenVersion: Int!
    updatedAt: DateTime!
    userType: UserType!
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
  }

  """
  A default connection edge on the User type for UsersConnection.
  """
  type UsersConnectionEdge {
    cursor: String!
    node: User!
  }
`;
