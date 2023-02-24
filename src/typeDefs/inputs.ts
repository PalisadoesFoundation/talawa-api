import { gql } from "apollo-server-core";

// Place fields alphabetically to ensure easier lookup and navigation.
export const inputs = gql`
  input CommentInput {
    text: String!
  }

  input createChatInput {
    userIds: [ObjectID!]!
    organizationId: ObjectID!
  }

  input createGroupChatInput {
    userIds: [ObjectID!]!
    organizationId: ObjectID!
    title: String!
  }

  input DonationWhereInput {
    id: ObjectID
    id_not: ObjectID
    id_in: [ObjectID!]
    id_not_in: [ObjectID!]
    id_contains: ObjectID
    id_starts_with: ObjectID

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
    organizationId: ObjectID!
  }

  input EventWhereInput {
    id: ObjectID
    id_not: ObjectID
    id_in: [ObjectID!]
    id_not_in: [ObjectID!]
    id_contains: ObjectID
    id_starts_with: ObjectID

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

    organization_id: ObjectID
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
    organizationId: ObjectID!
  }

  input LanguageInput {
    en_value: String!
    translation_lang_code: String!
    translation_value: String!
  }

  input LoginInput {
    email: EmailAddress!
    password: String!
  }

  input MessageChatInput {
    message: String!
    receiver: ObjectID!
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
    tags: [String!]!
  }

  input OrganizationWhereInput {
    id: ObjectID
    id_not: ObjectID
    id_in: [ObjectID!]
    id_not_in: [ObjectID!]
    id_contains: ObjectID
    id_starts_with: ObjectID

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
    orgId: ObjectID!
    pluginName: String!
    pluginKey: String
    pluginType: Type
    fields: [PluginFieldInput]
  }

  input PostInput {
    _id: ObjectID
    text: String!
    title: String
    imageUrl: URL
    videoUrl: URL
    organizationId: ObjectID!
  }

  input PostWhereInput {
    id: ObjectID
    id_not: ObjectID
    id_in: [ObjectID!]
    id_not_in: [ObjectID!]
    id_contains: ObjectID
    id_starts_with: ObjectID

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
    deadline: DateTime
  }

  input UpdateEventInput {
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

  input UpdateOrganizationInput {
    name: String
    description: String
    isPublic: Boolean
    visibleInSearch: Boolean
  }

  input UpdateTaskInput {
    title: String
    description: String
    deadline: DateTime
  }

  input UpdateUserInput {
    firstName: String
    lastName: String
    email: EmailAddress
  }

  input UpdateUserTypeInput {
    userType: String
    id: ObjectID
  }

  input UserAndOrganizationInput {
    organizationId: ObjectID!
    userId: ObjectID!
  }

  input UserInput {
    firstName: String!
    lastName: String!
    email: EmailAddress!
    password: String!
    appLanguageCode: String
    organizationUserBelongsToId: ObjectID
  }

  input UserWhereInput {
    id: ObjectID
    id_not: ObjectID
    id_in: [ObjectID!]
    id_not_in: [ObjectID!]
    id_contains: ObjectID
    id_starts_with: ObjectID

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

    admin_for: ObjectID

    event_title_contains: String
  }
  input PostUpdateInput {
    text: String
    title: String
    imageUrl: URL
    videoUrl: URL
  }
`;
