import { gql } from "apollo-server-core";

// Place fields alphabetically to ensure easier lookup and navigation.
export const types = gql`
  type AggregatePost {
    count: Int!
  }

  type AggregateUser {
    count: Int!
  }

  type AndroidFirebaseOptions {
    apiKey: String
    appId: String
    messagingSenderId: String
    projectId: String
    storageBucket: String
  }

  type AuthData {
    user: User!
    accessToken: String!
    refreshToken: String!
    androidFirebaseOptions: AndroidFirebaseOptions!
    iosFirebaseOptions: IOSFirebaseOptions!
  }

  type Comment {
    _id: ObjectID
    text: String!
    createdAt: DateTime
    creator: User!
    post: Post!
    likedBy: [User]
    likeCount: Int
  }

  type DeletePayload {
    success: Boolean!
  }

  type DirectChat {
    _id: ObjectID!
    users: [User!]!
    messages: [DirectChatMessage]
    creator: User!
    organization: Organization!
  }

  type DirectChatMessage {
    _id: ObjectID!
    directChatMessageBelongsTo: DirectChat!
    sender: User!
    receiver: User!
    createdAt: DateTime!
    messageContent: String!
  }

  type Donation {
    _id: ObjectID!
    userId: ObjectID!
    orgId: ObjectID!
    payPalId: String!
    nameOfUser: String!
    nameOfOrg: String!
    amount: Float!
  }

  type ExtendSession {
    accessToken: String!
    refreshToken: String!
  }

  type Event {
    _id: ObjectID!
    title: String!
    description: String!
    startDate: Date!
    endDate: Date!
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
    registrants: [UserAttende]
    admins(adminId: ObjectID): [User]
    tasks: [Task]
    status: Status!
  }

  # type EventProject {
  #     _id: ObjectID!
  #     title:String!
  #     description: String!
  #     event: Event!
  #     tasks: [Task]
  # }

  type EventRegistrants {
    event: Event!
    isRegistered: Boolean!
  }

  type Group {
    _id: ObjectID
    title: String
    description: String
    createdAt: DateTime
    organization: Organization!
    admins: [User]
  }

  type GroupChat {
    _id: ObjectID!
    users: [User!]!
    messages: [GroupChatMessage]
    creator: User!
    organization: Organization!
  }

  type GroupChatMessage {
    _id: ObjectID!
    groupChatMessageBelongsTo: GroupChat!
    sender: User!
    createdAt: DateTime!
    messageContent: String!
  }

  type IOSFirebaseOptions {
    apiKey: String
    appId: String
    messagingSenderId: String
    projectId: String
    storageBucket: String
    iosClientId: String
    iosBundleId: String
  }

  type Language {
    _id: ObjectID!
    en: String!
    translation: [LanguageModel]
    createdAt: String!
  }

  type LanguageModel {
    _id: ObjectID!
    lang_code: String!
    value: String!
    verified: Boolean!
    createdAt: DateTime!
  }

  type MembershipRequest {
    _id: ObjectID!
    user: User!
    organization: Organization!
  }

  type Message {
    _id: ObjectID!
    text: String
    createdAt: DateTime
    imageUrl: URL
    videoUrl: URL
    creator: User
  }

  type MessageChat {
    _id: ObjectID!
    sender: User!
    receiver: User!
    message: String!
    languageBarrier: Boolean
    createdAt: DateTime!
  }

  type Organization {
    image: String
    _id: ObjectID!
    name: String!
    description: String!
    location: String
    isPublic: Boolean!
    creator: User!
    members: [User]
    admins(adminId: ObjectID): [User]
    membershipRequests: [MembershipRequest]
    blockedUsers: [User]
    visibleInSearch: Boolean!
    apiUrl: URL!
    createdAt: DateTime
    tags: [String!]!
  }

  type OrganizationInfoNode {
    image: String
    _id: ObjectID!
    name: String!
    description: String!
    isPublic: Boolean!
    creator: User!
    visibleInSearch: Boolean!
    apiUrl: URL!
    tags: [String!]!
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
    _id: ObjectID!
    pluginName: String!
    pluginCreatedBy: String!
    pluginDesc: String!
    pluginInstallStatus: Boolean!
    installedOrgs: [ObjectID!]!
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
    _id: ObjectID
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
    _id: ObjectID!
    title: String!
    description: String
    event: Event!
    creator: User!
    createdAt: DateTime!
    deadline: DateTime
  }

  type Translation {
    lang_code: String
    en_value: String
    translation: String
    verified: Boolean
  }

  type User {
    tokenVersion: Int!
    _id: ObjectID!
    firstName: String!
    lastName: String!
    email: EmailAddress!
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
    adminApproved: Boolean
    createdAt: DateTime
  }

  type UserAttende {
    _id: ObjectID!
    userId: String!
    user: User!
    status: Status!
    createdAt: DateTime
  }

  type UserConnection {
    pageInfo: PageInfo!
    edges: [User]!
    aggregate: AggregateUser!
  }
`;
