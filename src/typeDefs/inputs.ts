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

  input CheckInCheckOutInput {
    eventId: ID!
    userId: ID!
  }

  input chatInput {
    isGroup: Boolean!
    organizationId: ID
    userIds: [ID!]!
    name: String
    image: String
  }

  input createGroupChatInput {
    userIds: [ID!]!
    organizationId: ID!
    title: String!
  }

  input createUserFamilyInput {
    title: String!
    userIds: [ID!]!
  }

  input CreateUserTagInput {
    name: String!
    tagColor: String
    parentTagId: ID
    organizationId: ID!
  }

  input CreateActionItemInput {
    assigneeId: ID!
    preCompletionNotes: String
    allotedHours: Float
    dueDate: Date
    eventId: ID
  }

  input CreateAgendaItemInput {
    title: String
    description: String
    duration: String!
    attachments: [String]
    relatedEventId: ID
    urls: [String]
    users: [ID]
    categories: [ID]
    sequence: Int!
    organizationId: ID!
  }

  input UpdateAgendaItemInput {
    title: String
    description: String
    duration: String
    attachments: [String]
    relatedEvent: ID
    urls: [String]
    users: [ID]
    categories: [ID]
    sequence: Int
  }

  input ActionItemWhereInput {
    actionItemCategory_id: ID
    event_id: ID
    categoryName: String
    assigneeName: String
    is_completed: Boolean
  }

  input ActionItemCategoryWhereInput {
    name_contains: String
    is_disabled: Boolean
  }

  input CreateAgendaCategoryInput {
    name: String!
    description: String
    organizationId: ID!
  }

  input CreateAgendaSectionInput {
    description: String!
    relatedEvent: ID
    items: [CreateAgendaItemInput]
    sequence: Int!
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

  input EditVenueInput {
    id: ID!
    capacity: Int
    name: String
    description: String
    file: String
  }

  input EventInput {
    title: String!
    description: String!
    startDate: Date!
    endDate: Date!
    startTime: Time
    endTime: Time
    allDay: Boolean!
    recurring: Boolean!
    isPublic: Boolean!
    isRegisterable: Boolean!
    images: [String]
    location: String
    latitude: Latitude
    longitude: Longitude
    organizationId: ID!
  }

  input EventVolunteerInput {
    userId: ID!
    eventId: ID!
    groupId: ID!
  }

  input EventVolunteerGroupInput {
    name: String
    eventId: ID!
    volunteersRequired: Int
  }

  input EventVolunteerGroupWhereInput {
    eventId: ID
    volunteerId: ID
    name_contains: String
  }

  input UpdateEventVolunteerInput {
    eventId: ID
    isAssigned: Boolean
    isInvited: Boolean
    response: EventVolunteerResponse
  }

  input UpdateEventVolunteerGroupInput {
    eventId: ID
    name: String
    volunteersRequired: Int
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
  input FundInput {
    name: String!
    organizationId: ID!
    refrenceNumber: String
    taxDeductible: Boolean!
    isDefault: Boolean!
    isArchived: Boolean!
  }
  input FundCampaignInput {
    name: String!
    fundId: ID!
    startDate: Date!
    endDate: Date!
    fundingGoal: Float!
    currency: Currency!
    organizationId: ID!
  }
  input FundCampaignPledgeInput {
    campaignId: ID!
    userIds: [ID!]!
    startDate: Date
    endDate: Date
    amount: Float!
    currency: Currency!
  }

  input FundWhereInput {
    name_contains: String
  }

  input CampaignWhereInput {
    id: ID
    fundId: ID
    organizationId: ID
    name_contains: String
  }

  input PledgeWhereInput {
    id: ID
    campaignId: ID
    firstName_contains: String
    name_contains: String
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

  input MembershipRequestsWhereInput {
    id: ID
    id_not: ID
    id_in: [ID!]
    id_not_in: [ID!]
    id_contains: ID
    id_starts_with: ID

    user: UserWhereInput

    creatorId: ID
    creatorId_not: ID
    creatorId_in: [ID!]
    creatorId_not_in: [ID!]
  }

  input MessageChatInput {
    message: String!
    receiver: ID!
  }

  input NoteInput {
    content: String!
    agendaItemId: ID!
  }

  input UpdateNoteInput {
    content: String
    updatedBy: ID!
  }

  input OrganizationInput {
    name: String!
    description: String!
    address: AddressInput!
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

  input RecurrenceRuleInput {
    recurrenceStartDate: Date
    recurrenceEndDate: Date
    frequency: Frequency
    weekDays: [WeekDays]
    interval: PositiveInt
    count: PositiveInt
    weekDayOccurenceInMonth: Int
  }

  input SocialMediaUrlsInput {
    facebook: String
    gitHub: String
    instagram: String
    linkedIn: String
    reddit: String
    slack: String
    X: String
    youTube: String
  }

  input ToggleUserTagAssignInput {
    userId: ID!
    tagId: ID!
  }

  input UpdateActionItemInput {
    assigneeId: ID
    preCompletionNotes: String
    postCompletionNotes: String
    dueDate: Date
    completionDate: Date
    allotedHours: Float
    isCompleted: Boolean
  }

  input UpdateCommunityInput {
    name: String!
    socialMediaUrls: SocialMediaUrlsInput!
    websiteLink: String!
    logo: String!
  }

  input UpdateEventInput {
    title: String
    description: String
    recurring: Boolean
    isRecurringEventException: Boolean
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
  input UpdateFundInput {
    name: String
    taxDeductible: Boolean
    isDefault: Boolean
    isArchived: Boolean
    refrenceNumber: String
  }
  input UpdateFundCampaignInput {
    name: String
    startDate: Date
    endDate: Date
    fundingGoal: Float
    currency: Currency
  }
  input UpdateFundCampaignPledgeInput {
    users: [ID]
    startDate: Date
    endDate: Date
    amount: Float
    currency: Currency
  }

  input UpdateAdvertisementInput {
    _id: ID!
    name: String
    mediaFile: String
    type: AdvertisementType
    startDate: Date
    endDate: Date
  }

  input UpdateOrganizationInput {
    name: String
    description: String
    address: AddressInput
    userRegistrationRequired: Boolean
    visibleInSearch: Boolean
  }

  input UpdateUserTagInput {
    tagId: ID!
    tagColor: String
    name: String!
  }

  input UpdateActionItemCategoryInput {
    name: String
    isDisabled: Boolean
  }

  input UpdateAgendaCategoryInput {
    name: String
    description: String
  }

  input UpdateAgendaSectionInput {
    relatedEvent: ID
    description: String
    sequence: Int
  }
  input AddressInput {
    city: String
    countryCode: String
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
    appLanguageCode: String
  }

  input UpdateUserPasswordInput {
    previousPassword: String!
    newPassword: String!
    confirmNewPassword: String!
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
    selectedOrganization: ID!
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

    event_title_contains: String
  }
  input PostUpdateInput {
    text: String
    title: String
    imageUrl: String
    videoUrl: String
  }

  input CreateAdvertisementInput {
    endDate: Date!
    name: String!
    organizationId: ID!
    startDate: Date!
    type: AdvertisementType!
    mediaFile: String!
  }

  input VenueInput {
    organizationId: ID!
    name: String!
    capacity: Int!
    description: String
    file: String
  }

  input VenueWhereInput {
    name_contains: String
    name_starts_with: String
    description_starts_with: String
    description_contains: String
  }
`;
