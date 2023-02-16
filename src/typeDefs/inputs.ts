import { gql } from "apollo-server-core";

// Place fields alphabetically to ensure easier lookup and navigation.
export const inputs = gql`
  input CommentInput {
    text: String!
  }

  input createChatInput {
    userIds: [ID!]!
    organizationId: ID!
  }

  input createGroupChatInput {
    userIds: [ID!]!
    organizationId: ID!
    title: String!
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
    startDate: String!
    endDate: String
    startTime: String
    endTime: String
    allDay: Boolean!
    recurring: Boolean!
    recurrance: Recurrance
    isPublic: Boolean!
    isRegisterable: Boolean!
    location: String
    latitude: Float
    longitude: Float
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

  input ForgotPasswordData {
    userOtp: String!
    newPassword: String!
    otpToken: String!
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

  input LoginInput {
    email: String!
    password: String!
  }

  input MessageChatInput {
    message: String!
    receiver: ID!
  }

  input MultipleUsersAndOrganizationInput {
    organizationId: ID!
    userIds: [ID!]!
  }

  input OrganizationInput {
    name: String!
    description: String!
    location: String
    attendees: String
    isPublic: Boolean!
    visibleInSearch: Boolean!
    apiUrl: String
    image: String
    tags: [String!]!
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

    apiUrl: String
    apiUrl_not: String
    apiUrl_in: [String!]
    apiUrl_not_in: [String!]
    apiUrl_contains: String
    apiUrl_starts_with: String

    visibleInSearch: Boolean

    isPublic: Boolean
  }

  input OTPInput {
    email: String!
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
    imageUrl: String
    videoUrl: String
    organizationId: ID!
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

  input TaskInput {
    title: String!
    description: String
    deadline: String
  }

  input UpdateEventInput {
    title: String
    description: String
    recurring: Boolean
    recurrance: Recurrance
    isPublic: Boolean
    isRegisterable: Boolean
    startDate: String
    endDate: String
    location: String
    latitude: Float
    longitude: Float
    allDay: Boolean
    startTime: String
    endTime: String
  }

  # input UpdateEventProjectInput {
  #   title: String
  #   description: String
  # }

  input UpdateOrganizationInput {
    name: String
    description: String
    isPublic: Boolean
    visibleInSearch: Boolean
  }

  input UpdateTaskInput {
    title: String
    description: String
    deadline: String
  }

  input UpdateUserInput {
    firstName: String
    lastName: String
    email: String
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
    email: String!
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

    admin_for: ID

    event_title_contains: String
  }
  input PostUpdateInput {
    text: String
    title: String
    imageUrl: String
    videoUrl: String
  }
`;
