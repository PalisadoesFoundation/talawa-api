import { gql } from "graphql-tag";

// Place fields alphabetically to ensure easier lookup and navigation.
export const inputs = gql`
  input CommentInput {
    text: String!
  }

  input EventAttendeeInput {
    userId: ID!
    eventId: ID!
  }

  input CheckInInput {
    userId: ID!
    eventId: ID!
    allotedRoom: String
    allotedSeat: String
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

  input CreateUserTagInput {
    name: String!
    parentTagId: ID
    organizationId: ID!
  }

  input CursorPaginationInput {
    cursor: String
    direction: PaginationDirection!
    limit: PositiveInt!
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
    images: [String]
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

  input FeedbackInput {
    eventId: ID!
    rating: Int!
    review: String
  }

  input ForgotPasswordData {
    userOtp: String!
    newPassword: String!
    otpToken: String!
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
    receiver: ID!
  }

  input OrganizationInput {
    name: String!
    description: String!
    location: String
    attendees: String
    apiUrl: URL
    image: String
    userRegistrationRequired: Boolean
    visibleInSearch: Boolean
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
    userRegistrationRequired: Boolean
    visibleInSearch: Boolean
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

  input ToggleUserTagAssignInput {
    userId: ID!
    tagId: ID!
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
    images: [String]
    allDay: Boolean
    startTime: Time
    endTime: Time
  }

  # Implements CursorPaginationInput
  input UsersConnectionInput {
    cursor: String
    direction: PaginationDirection!
    limit: PositiveInt!
  }

  # Implements CursorPaginationInput
  input UserTagsConnectionInput {
    cursor: String
    direction: PaginationDirection!
    limit: PositiveInt!
  }

  input UpdateOrganizationInput {
    name: String
    description: String
    location: String
    userRegistrationRequired: Boolean
    visibleInSearch: Boolean
  }

  input UpdateUserTagInput {
    _id: ID!
    name: String!
  }

  input AddressInput {
    city: String
    countryCode: CountryCode
    dependentLocality: String
    line1: String
    line2: String
    postalCode: String
    sortingCode: String
    state: String
  }

  input UserPhoneInput {
    home: PhoneNumber
    mobile: PhoneNumber
    work: PhoneNumber
  }

  input UpdateUserInput {
    address: AddressInput
    birthDate: Date
    educationGrade: EducationGrade
    email: EmailAddress
    employmentStatus: EmploymentStatus
    firstName: String
    gender: Gender
    lastName: String
    maritalStatus: MaritalStatus
    phone: UserPhoneInput
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
  input PostUpdateInput {
    text: String
    title: String
    imageUrl: String
    videoUrl: String
  }
`;
