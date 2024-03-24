import { gql } from "graphql-tag";
/**
 * This graphQL typeDef defines the logic for different mutations defined in the talawa-api.
 */
// Place fields alphabetically to ensure easier lookup and navigation.
export const mutations = gql`
  type Mutation {
    acceptAdmin(id: ID!): Boolean! @auth @role(requires: SUPERADMIN)

    acceptMembershipRequest(membershipRequestId: ID!): MembershipRequest! @auth

    addOrganizationCustomField(
      organizationId: ID!
      type: String!
      name: String!
    ): OrganizationCustomField! @auth

    addEventAttendee(data: EventAttendeeInput!): User! @auth

    addFeedback(data: FeedbackInput!): Feedback! @auth

    addLanguageTranslation(data: LanguageInput!): Language! @auth

    addOrganizationImage(file: String!, organizationId: String!): Organization!
      @auth
    addPledgeToFundraisingCampaign(
      pledgeId: ID!
      campaignId: ID!
    ): FundraisingCampaignPledge! @auth
    addUserCustomData(
      organizationId: ID!
      dataName: String!
      dataValue: Any!
    ): UserCustomData! @auth

    addUserImage(file: String!): User! @auth

    addUserToGroupChat(userId: ID!, chatId: ID!): GroupChat! @auth

    addUserToUserFamily(userId: ID!, familyId: ID!): UserFamily! @auth

    removeUserFromUserFamily(userId: ID!, familyId: ID!): UserFamily! @auth

    removeUserFamily(familyId: ID!): UserFamily! @auth

    createUserFamily(data: createUserFamilyInput!): UserFamily! @auth

    checkInEventAttendee(data: EventAttendeeInput!): EventAttendee!

    checkOutEventAttendee(data: EventAttendeeInput!): EventAttendee!

    adminRemoveEvent(eventId: ID!): Event! @auth

    adminRemoveGroup(groupId: ID!): GroupChat! @auth

    assignUserTag(input: ToggleUserTagAssignInput!): User @auth

    blockPluginCreationBySuperadmin(
      userId: ID!
      blockUser: Boolean!
    ): AppUserProfile! @auth @role(requires: SUPERADMIN)

    blockUser(organizationId: ID!, userId: ID!): User! @auth

    cancelMembershipRequest(membershipRequestId: ID!): MembershipRequest! @auth

    checkIn(data: CheckInInput!): CheckIn! @auth

    createMember(input: UserAndOrganizationInput!): Organization! @auth

    createAdmin(data: UserAndOrganizationInput!): AppUserProfile!
      @auth
      @role(requires: SUPERADMIN)

    createActionItem(
      data: CreateActionItemInput!
      actionItemCategoryId: ID!
    ): ActionItem! @auth

    createActionItemCategory(
      name: String!
      organizationId: ID!
    ): ActionItemCategory! @auth

    createAgendaItem(input: CreateAgendaItemInput!): AgendaItem!

    createAgendaCategory(input: CreateAgendaCategoryInput!): AgendaCategory!

    createAgendaSection(input: CreateAgendaSectionInput!): AgendaSection!

    createComment(postId: ID!, data: CommentInput!): Comment @auth

    createDirectChat(data: createChatInput!): DirectChat! @auth

    createDonation(
      userId: ID!
      orgId: ID!
      payPalId: ID!
      nameOfUser: String!
      amount: Float!
      nameOfOrg: String!
    ): Donation!

    createEvent(
      data: EventInput!
      recurrenceRuleData: RecurrenceRuleInput
    ): Event! @auth
    createFund(data: FundInput!): Fund! @auth
    createFundraisingCampaign(data: FundCampaignInput!): FundraisingCampaign!
      @auth
    createFundraisingCampaignPledge(
      data: FundCampaignPledgeInput!
    ): FundraisingCampaignPledge! @auth

    createGroupChat(data: createGroupChatInput!): GroupChat! @auth

    createMessageChat(data: MessageChatInput!): MessageChat! @auth

    createOrganization(data: OrganizationInput, file: String): Organization!
      @auth
      @role(requires: SUPERADMIN)

    createPlugin(
      pluginName: String!
      pluginCreatedBy: String!
      pluginDesc: String!
      uninstalledOrgs: [ID!]
    ): Plugin!

    createAdvertisement(
      input: CreateAdvertisementInput!
    ): CreateAdvertisementPayload @auth

    createPost(data: PostInput!, file: String): Post @auth

    createUserTag(input: CreateUserTagInput!): UserTag @auth

    createSampleOrganization: Boolean! @auth

    createVenue(data: VenueInput!): Venue @auth

    deleteAdvertisement(id: ID!): DeleteAdvertisementPayload

    deleteAgendaCategory(id: ID!): ID!

    deleteDonationById(id: ID!): DeletePayload!

    deleteVenue(id: ID!): Venue @auth

    editVenue(data: EditVenueInput!): Venue @auth

    forgotPassword(data: ForgotPasswordData!): Boolean!

    inviteEventAttendee(data: EventAttendeeInput!): EventAttendee!

    joinPublicOrganization(organizationId: ID!): User! @auth

    createEventVolunteer(data: EventVolunteerInput!): EventVolunteer! @auth

    leaveOrganization(organizationId: ID!): User! @auth

    likeComment(id: ID!): Comment @auth

    likePost(id: ID!): Post @auth

    login(data: LoginInput!): AuthData!

    logout: Boolean! @auth

    otp(data: OTPInput!): OtpData!

    recaptcha(data: RecaptchaVerification!): Boolean!

    refreshToken(refreshToken: String!): ExtendSession!

    registerForEvent(id: ID!): EventAttendee! @auth

    rejectAdmin(id: ID!): Boolean! @auth @role(requires: SUPERADMIN)

    registerEventAttendee(data: EventAttendeeInput!): EventAttendee!

    rejectMembershipRequest(membershipRequestId: ID!): MembershipRequest! @auth

    removeAdmin(data: UserAndOrganizationInput!): AppUserProfile!
      @auth
      @role(requires: SUPERADMIN)

    removeActionItem(id: ID!): ActionItem! @auth

    removeOrganizationCustomField(
      organizationId: ID!
      customFieldId: ID!
    ): OrganizationCustomField! @auth

    removeComment(id: ID!): Comment @auth

    removeDirectChat(chatId: ID!, organizationId: ID!): DirectChat! @auth

    removeEvent(
      id: ID!
      recurringEventDeleteType: RecurringEventMutationType
    ): Event! @auth

    removeEventAttendee(data: EventAttendeeInput!): User! @auth

    removeAgendaItem(id: ID!): AgendaItem!

    removeEventVolunteer(id: ID!): EventVolunteer! @auth
    removeFund(id: ID!): Fund! @auth
    removeFundraisingCampaign(id: ID!): FundraisingCampaign! @auth
    removeFundraisingCampaignPledge(id: ID!): FundraisingCampaignPledge! @auth

    removeGroupChat(chatId: ID!): GroupChat! @auth

    removeMember(data: UserAndOrganizationInput!): Organization! @auth

    removeOrganization(id: ID!): UserData! @auth @role(requires: SUPERADMIN)

    removeOrganizationImage(organizationId: String!): Organization! @auth

    removePost(id: ID!): Post @auth

    removeUserCustomData(organizationId: ID!): UserCustomData! @auth

    removeAdvertisement(id: ID!): Advertisement

    removeAgendaSection(id: ID!): ID!

    removeUserTag(id: ID!): UserTag @auth

    removeSampleOrganization: Boolean! @auth

    removeUserFromGroupChat(userId: ID!, chatId: ID!): GroupChat! @auth

    removeUserImage: User! @auth

    resetCommunity: Boolean! @auth @role(requires: SUPERADMIN)

    revokeRefreshTokenForUser: Boolean! @auth

    saveFcmToken(token: String): Boolean! @auth

    sendMembershipRequest(organizationId: ID!): MembershipRequest! @auth

    sendMessageToDirectChat(
      chatId: ID!
      messageContent: String!
    ): DirectChatMessage! @auth

    sendMessageToGroupChat(
      chatId: ID!
      messageContent: String!
    ): GroupChatMessage! @auth

    signUp(data: UserInput!, file: String): AuthData!

    togglePostPin(id: ID!, title: String): Post! @auth

    unassignUserTag(input: ToggleUserTagAssignInput!): User @auth

    unblockUser(organizationId: ID!, userId: ID!): User! @auth

    unlikeComment(id: ID!): Comment @auth

    unlikePost(id: ID!): Post @auth

    unregisterForEventByUser(id: ID!): Event! @auth

    updateActionItem(id: ID!, data: UpdateActionItemInput!): ActionItem @auth

    updateActionItemCategory(
      id: ID!
      data: UpdateActionItemCategoryInput!
    ): ActionItemCategory @auth

    updateAgendaItem(id: ID!, input: UpdateAgendaItemInput!): AgendaItem

    updateAgendaCategory(
      id: ID!
      input: UpdateAgendaCategoryInput!
    ): AgendaCategory

    updateAgendaSection(
      id: ID!
      input: UpdateAgendaSectionInput!
    ): AgendaSection

    updateAdvertisement(
      input: UpdateAdvertisementInput!
    ): UpdateAdvertisementPayload @auth

    updateCommunity(data: UpdateCommunityInput!): Boolean!
      @auth
      @role(requires: SUPERADMIN)

    updateEvent(
      id: ID!
      data: UpdateEventInput
      recurrenceRuleData: RecurrenceRuleInput
      recurringEventUpdateType: RecurringEventMutationType
    ): Event! @auth

    updateEventVolunteer(
      id: ID!
      data: UpdateEventVolunteerInput
    ): EventVolunteer! @auth
    updateFund(id: ID!, data: UpdateFundInput!): Fund! @auth
    updateFundraisingCampaign(
      id: ID!
      data: UpdateFundCampaignInput!
    ): FundraisingCampaign! @auth
    updateFundraisingCampaignPledge(
      id: ID!
      data: UpdateFundCampaignPledgeInput!
    ): FundraisingCampaignPledge! @auth
    updatePost(id: ID!, data: PostUpdateInput): Post! @auth

    updateLanguage(languageCode: String!): User! @auth

    updateOrganization(
      id: ID!
      data: UpdateOrganizationInput
      file: String
    ): Organization! @auth

    updatePluginStatus(id: ID!, orgId: ID!): Plugin!

    updateUserTag(input: UpdateUserTagInput!): UserTag @auth

    updateUserProfile(data: UpdateUserInput, file: String): User! @auth

    updateUserPassword(data: UpdateUserPasswordInput!): UserData! @auth

    updateUserRoleInOrganization(
      organizationId: ID!
      userId: ID!
      role: String!
    ): Organization! @auth

    updateUserType(data: UpdateUserTypeInput!): Boolean!
      @auth
      @role(requires: SUPERADMIN)
  }
`;
