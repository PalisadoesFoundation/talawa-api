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

  # Stores the detail of an check in of an user in an event
  type CheckIn {
    _id: ID!
    time: DateTime!
    allotedRoom: String
    allotedSeat: String
    user: User!
    event: Event!
    feedbackSubmitted: Boolean!
  }

  # Used to show whether an user has checked in for an event
  type CheckInStatus {
    _id: ID!
    user: User!
    checkIn: CheckIn
  }

  type Comment {
    _id: ID
    text: String!
    createdAt: DateTime
    creator: User!
    post: Post!
    likedBy: [User]
    likeCount: Int
  }

  # A page info type adhering to Relay Specification for both cursor based pagination
  type ConnectionPageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  type DeletePayload {
    success: Boolean!
  }

  type DirectChat {
    _id: ID!
    users: [User!]!
    messages: [DirectChatMessage]
    creator: User!
    organization: Organization!
  }

  type DirectChatMessage {
    _id: ID!
    directChatMessageBelongsTo: DirectChat!
    sender: User!
    receiver: User!
    createdAt: DateTime!
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
  }
  type Advertisement {
    _id: ID
    name: String!
    orgId: ID
    link: String!
    type: String!
    startDate: Date!
    endDate: Date!
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
    endDate: Date!
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
    creator: User!
    attendees: [User!]!
    # For each attendee, gives information about whether he/she has checked in yet or not
    attendeesCheckInStatus: [CheckInStatus!]!
    admins(adminId: ID): [User]
    status: Status!
    projects: [EventProject]
    feedback: [Feedback!]!
    averageFeedbackScore: Float
  }

  type EventProject {
    _id: ID!
    title: String!
    description: String!
    event: Event!
    tasks: [Task]
  }

  type Feedback {
    _id: ID!
    event: Event!
    rating: Int!
    review: String
  }

  type Group {
    _id: ID
    title: String
    description: String
    createdAt: DateTime
    organization: Organization!
    admins: [User]
  }

  type GroupChat {
    _id: ID!
    users: [User!]!
    messages: [GroupChatMessage]
    creator: User!
    organization: Organization!
  }

  type GroupChatMessage {
    _id: ID!
    groupChatMessageBelongsTo: GroupChat!
    sender: User!
    createdAt: DateTime!
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
    text: String
    createdAt: DateTime
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
  }

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
    apiUrl: URL!
    createdAt: DateTime
    pinnedPosts: [Post]
    userTags(
      after: String
      before: String
      first: PositiveInt
      last: PositiveInt
    ): UserTagsConnection
    customFields: [OrganizationCustomField!]!
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
    isPublic: Boolean!
    creator: User!
    visibleInSearch: Boolean!
    apiUrl: URL!
  }

  type OtpData {
    otpToken: String!
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
    uninstalledOrgs: [ID!]!
  }

  # type Plugin {
  #   orgId: Organization!
  #   pluginName: String!
  #   pluginKey: String
  #   pluginStatus: Status!
  #   pluginType: Type!
  #   additionalInfo: [PluginField!]
  #   createdAt: String
  # }

  type PluginField {
    key: String!
    value: String!
    status: Status!
    createdAt: DateTime
  }

  type Post {
    _id: ID
    text: String!
    title: String
    createdAt: DateTime
    imageUrl: URL
    videoUrl: URL
    creator: User!
    organization: Organization!
    likedBy: [User]
    comments: [Comment]
    likeCount: Int
    commentCount: Int
    pinned: Boolean
  }

  """
  A connection to a list of items.
  """
  type PostConnection {
    """
    Information to aid in pagination.
    """
    pageInfo: PageInfo!

    """
    A list of edges.
    """
    edges: [Post]!

    aggregate: AggregatePost!
  }

  type Task {
    _id: ID!
    title: String!
    description: String
    event: Event!
    creator: User!
    createdAt: DateTime!
    completed: Boolean
    deadline: DateTime
    volunteers: [User]
  }

  type Translation {
    lang_code: String
    en_value: String
    translation: String
    verified: Boolean
  }

  type Address {
    city: String
    countryCode: CountryCode
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
    assignedTasks: [Task]
    birthDate: Date
    createdAt: DateTime
    createdEvents: [Event]
    createdOrganizations: [Organization]
    educationGrade: EducationGrade
    email: EmailAddress!
    employmentStatus: EmploymentStatus
    eventAdmin: [Event]
    firstName: String!
    gender: Gender
    image: String
    joinedOrganizations: [Organization]
    lastName: String!
    maritalStatus: MaritalStatus
    membershipRequests: [MembershipRequest]
    organizationUserBelongsTo: Organization
    organizationsBlockedBy: [Organization]
    phone: UserPhone
    pluginCreationAllowed: Boolean
    registeredEvents: [Event]
    tagsAssignedWith(
      after: String
      before: String
      first: PositiveInt
      last: PositiveInt
      organizationId: ID
    ): UserTagsConnection
    tokenVersion: Int!
    userType: String
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

  type UserEdge {
    node: User!
    cursor: String!
  }

  type UserTag {
    _id: ID!
    name: String!
    organization: Organization
    parentTag: UserTag
    childTags(input: UserTagsConnectionInput!): UserTagsConnectionResult!
    usersAssignedTo(input: UsersConnectionInput!): UsersConnectionResult!
  }

  type UsersConnectionResult {
    data: UsersConnection
    errors: [ConnectionError!]!
  }

  type UserTagsConnectionResult {
    data: UserTagsConnection
    errors: [ConnectionError!]!
  }

  type UserTagsConnection {
    edges: [UserTagEdge!]!
    pageInfo: ConnectionPageInfo!
  }

  type UserTagEdge {
    node: UserTag!
    cursor: String!
  }

  type UsersConnection {
    edges: [UserEdge!]!
    pageInfo: ConnectionPageInfo!
  }
`;
