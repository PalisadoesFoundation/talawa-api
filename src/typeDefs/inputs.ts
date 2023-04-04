import { gql } from "apollo-server-core";

// Place fields alphabetically to ensure easier lookup and navigation.
export const inputs = gql`
  input AcceptAdminInput {
    id: ID!
  }

  input AcceptMembershipRequestInput {
    membershipRequestId: ID!
  }

  input AddLanguageTranslationInput {
    en_value: String!
    translation_lang_code: String!
    translation_value: String!
  }

  input AddOrganizationImageInput {
    organizationImage: String!
    organizationId: String!
  }

  input AddUserImageInput {
    userProfileImage: String!
  }

  input AddUserToGroupChatInput {
    userId: ID!
    chatId: ID!
  }

  input AdminRemoveEventInput {
    eventId: ID!
  }

  input AdminRemoveGroupInput {
    groupId: ID!
  }

  input BlockPluginCreationBySuperadminInput {
    userId: ID!
    blockUser: Boolean!
  }

  input BlockUserInput {
    organizationId: ID!
    userId: ID!
  }

  input CancelMembershipRequestInput {
    membershipRequestId: ID!
  }

  input CreateAdminInput {
    organizationId: ID!
    userId: ID!
  }

  input CreateCommentInput {
    postId: ID!
    data: CommentInput!
  }

  input CommentInput {
    text: String!
  }

  input CreateChatInput {
    userIds: [ID!]!
    organizationId: ID!
  }

  input CreateDonationInput {
    userId: ID!
    orgId: ID!
    payPalId: ID!
    nameOfUser: String!
    amount: Float!
    nameOfOrg: String!
  }

  input CreateEventInput {
    title: String!
    description: String!
    startDate: Date!
    endDate: Date
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
    organizationId: ID!
  }

  input CreateGroupInput {
    title: String
    description: String
    organizationId: ID!
  }

  input CreateGroupChatInput {
    userIds: [ID!]!
    organizationId: ID!
    title: String!
  }

  input CreateMessageChatInput {
    message: String!
    receiver: ID!
  }

  input CreateOrganizationInput {
    data: OrganizationInput!
    organizationImage: String
  }

  input CreatePluginInput {
    pluginName: String!
    pluginCreatedBy: String!
    pluginDesc: String!
    pluginInstallStatus: Boolean!
    installedOrgs: [ID!]
  }

  input CreatePostInput {
    data: PostInput!
    postImage: String
  }

  input CreateUserTagInput {
    name: String!
    parentTagId: ID
    organizationId: ID!
  }

  input CreateTaskInput {
    data: TaskInput!
    eventId: ID!
  }

  input DeleteDonationByIdInput {
    donationId: ID!
  }

  input DonationWhereInput {
    id: ID
    id_not: ID
    id_in: [ID!]
    id_not_in: [ID!]
    id_contains: ID
    id_starts_with: ID

    name_of_user: String
    name_of_user_not: String
    name_of_user_in: [String!]
    name_of_user_not_in: [String!]
    name_of_user_contains: String
    name_of_user_starts_with: String
  }

  input EventInput {
    title: String!
    description: String!
    startDate: Date!
    endDate: Date
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
    organizationId: ID!
  }

  input EventWhereInput {
    id: ID
    id_not: ID
    id_in: [ID!]
    id_not_in: [ID!]
    id_contains: ID
    id_starts_with: ID

    title: String
    title_not: String
    title_in: [String!]
    title_not_in: [String!]
    title_contains: String
    title_starts_with: String

    description: String
    description_not: String
    description_in: [String!]
    description_not_in: [String!]
    description_contains: String
    description_starts_with: String

    location: String
    location_not: String
    location_in: [String!]
    location_not_in: [String!]
    location_contains: String
    location_starts_with: String

    organization_id: ID
  }

  # input EventProjectInput {
  #   title: String!
  #   description: String!
  #   eventId: String
  # }

  input ForgotPasswordInput {
    userOtp: String!
    newPassword: String!
    otpToken: String!
  }

  input JoinPublicOrganizationInput {
    organizationId: ID!
  }

  input LeaveOrganizationInput {
    organizationId: ID!
  }

  input GroupInput {
    title: String
    description: String
    organizationId: ID!
  }

  input LanguageInput {
    en_value: String!
    translation_lang_code: String!
    translation_value: String!
  }

  input LikeCommentInput {
    commentId: ID!
  }

  input LikePostInput {
    postId: ID!
  }

  input LoginInput {
    email: EmailAddress!
    password: String!
  }

  input MembershipRequestInput {
    membershipRequestId: ID!
  }

  input MessageChatInput {
    message: String!
    receiver: ID!
  }

  input OrganizationInput {
    name: String!
    description: String!
    location: String
    attendees: String
    isPublic: Boolean!
    visibleInSearch: Boolean!
    apiUrl: URL
    image: String
  }

  input OrganizationIdInput {
    organizationId: ID!
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

    apiUrl: URL
    apiUrl_not: URL
    apiUrl_in: [URL!]
    apiUrl_not_in: [URL!]
    apiUrl_contains: URL
    apiUrl_starts_with: URL

    visibleInSearch: Boolean

    isPublic: Boolean
  }

  input OTPInput {
    email: EmailAddress!
  }

  input PluginFieldInput {
    key: String!
    value: String!
  }

  input PluginInput {
    orgId: ID!
    pluginName: String!
    pluginKey: String
    pluginType: Type
    fields: [PluginFieldInput]
  }

  input PostInput {
    _id: ID
    text: String!
    title: String
    imageUrl: URL
    videoUrl: URL
    organizationId: ID!
    pinned: Boolean
  }

  input PostWhereInput {
    id: ID
    id_not: ID
    id_in: [ID!]
    id_not_in: [ID!]
    id_contains: ID
    id_starts_with: ID

    text: String
    text_not: String
    text_in: [String!]
    text_not_in: [String!]
    text_contains: String
    text_starts_with: String

    title: String
    title_not: String
    title_in: [String!]
    title_not_in: [String!]
    title_contains: String
    title_starts_with: String
  }

  input RecaptchaVerification {
    recaptchaToken: String!
  }

  input RefreshTokenInput {
    refreshToken: String!
  }

  input RegisterForEventInput {
    eventId: ID!
  }

  input RejectAdminInput {
    userId: ID!
  }

  input RejectMembershipRequestInput {
    membershipRequestId: ID!
  }

  input RemoveAdminInput {
    organizationId: ID!
    userId: ID!
  }

  input RemoveCommentInput {
    commentId: ID!
  }

  input RemoveDirectChatInput {
    chatId: ID!
    organizationId: ID!
  }
  input RemoveEventInput {
    id: ID!
  }

  input RemoveGroupChatInput {
    chatId: ID!
  }

  input RemoveMemberInput {
    organizationId: ID!
    userId: ID!
  }

  input RemoveOrganizationInput {
    organizationId: ID!
  }

  input RemoveOrganizationImageInput {
    organizationId: ID!
  }

  input RemovePostInput {
    id: ID!
  }

  input RemoveTaskInput {
    id: ID!
  }

  input RemoveUserTagInput {
    id: ID!
  }

  input RemoveUserFromGroupChatInput {
    userId: ID!
    chatId: ID!
  }

  input RevokeRefreshTokenForUserInput {
    userId: ID!
  }

  input SaveFcmTokenInput {
    token: String
  }

  input SendMembershipRequestInput {
    organizationId: ID!
  }

  input SendMessageToChatInput {
    chatId: ID!
    messageContent: String!
  }

  input SignUpInput {
    data: UserInput!
    userProfileImage: String
  }

  input TaskInput {
    title: String!
    description: String
    deadline: DateTime
  }

  input TogglePostPinInput {
    id: ID!
  }

  input ToggleUserTagAssignInput {
    userId: ID!
    tagId: ID!
  }

  input UpdateEventInput {
    id: ID!
    title: String
    description: String
    recurring: Boolean
    recurrance: Recurrance
    isPublic: Boolean
    isRegisterable: Boolean
    startDate: Date
    endDate: Date
    location: String
    latitude: Latitude
    longitude: Longitude
    allDay: Boolean
    startTime: Time
    endTime: Time
  }

  # input UpdateEventProjectInput {
  #   title: String
  #   description: String
  # }

  input UnblockUserInput {
    organizationId: ID!
    userId: ID!
  }

  input UnlikeCommentInput {
    id: ID!
  }

  input UnlikePostInput {
    id: ID!
  }

  input UnregisterForEventByUserInput {
    id: ID!
  }

  input UpdateLanguageInput {
    languageCode: String!
  }

  input UpdateOrganization {
    id: ID!
    name: String
    description: String
    isPublic: Boolean
    visibleInSearch: Boolean
    location: String
  }

  input UpdateOrganizationInput {
    data: UpdateOrganization!
    file: String
  }

  input UpdatePluginInstalledOrgsInput {
    id: ID!
    orgId: ID!
  }

  input UpdatePluginStatusInput {
    id: ID!
    status: Boolean!
  }

  input UpdateUserTagInput {
    _id: ID!
    name: String!
  }

  input UpdateTaskData {
    title: String
    description: String
    deadline: DateTime
  }

  input UpdateTaskInput {
    id: ID!
    data: UpdateTaskData!
  }

  input UpdateUserData {
    firstName: String
    lastName: String
    email: EmailAddress
  }

  input UpdateUserProfileInput {
    data: UpdateUserData!
    newUserProfileImage: String
  }

  input UpdateUserPasswordInput {
    previousPassword: String!
    newPassword: String!
    confirmNewPassword: String!
  }

  input UpdateUserTypeInput {
    userType: String
    id: ID
  }

  input UserAndOrganizationInput {
    organizationId: ID!
    userId: ID!
  }

  input UserInput {
    firstName: String!
    lastName: String!
    email: EmailAddress!
    password: String!
    appLanguageCode: String
    organizationUserBelongsToId: ID
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

    email: EmailAddress
    email_not: EmailAddress
    email_in: [EmailAddress!]
    email_not_in: [EmailAddress!]
    email_contains: EmailAddress
    email_starts_with: EmailAddress

    appLanguageCode: String
    appLanguageCode_not: String
    appLanguageCode_in: [String!]
    appLanguageCode_not_in: [String!]
    appLanguageCode_contains: String
    appLanguageCode_starts_with: String

    admin_for: ID

    event_title_contains: String
  }
  input UpdatePostInput {
    id: ID!
    text: String
    title: String
    imageUrl: URL
    videoUrl: URL
  }
`;
