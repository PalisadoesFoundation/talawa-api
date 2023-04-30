import { gql } from "apollo-server-core";
/**
 * This graphQL typeDef defines the logic for different mutations defined in the talawa-api.
 */
// Place fields alphabetically to ensure easier lookup and navigation.
export const mutations = gql`
  type Mutation {
    """
    Used in clients: Admin
    """
    acceptAdmin(id: ID!): Boolean! @auth @role(requires: SUPERADMIN)

    """
    Used in clients: Admin
    """
    acceptMembershipRequest(membershipRequestId: ID!): MembershipRequest! @auth

    addLanguageTranslation(data: LanguageInput!): Language! @auth

    addOrganizationImage(file: String!, organizationId: String!): Organization!
      @auth

    addUserImage(file: String!): User! @auth

    addUserToGroupChat(userId: ID!, chatId: ID!): GroupChat! @auth

    adminRemoveEvent(eventId: ID!): Event! @auth

    adminRemoveGroup(groupId: ID!): GroupChat! @auth

    assignUserTag(input: ToggleUserTagAssignInput!): User @auth

    blockPluginCreationBySuperadmin(userId: ID!, blockUser: Boolean!): User!
      @auth
      @role(requires: SUPERADMIN)

    """
    Used in clients: Admin
    """
    blockUser(organizationId: ID!, userId: ID!): User! @auth

    cancelMembershipRequest(membershipRequestId: ID!): MembershipRequest! @auth

    createMember(input: UserAndOrganizationInput!): Organization! @auth

    """
    Used in clients: Admin
    """
    createAdmin(data: UserAndOrganizationInput!): User!
      @auth
      @role(requires: SUPERADMIN)

    """
    Used in clients: Mobile
    """
    createComment(postId: ID!, data: CommentInput!): Comment @auth

    createDirectChat(data: createChatInput!): DirectChat! @auth

    """
    Used in clients: Mobile
    """
    createDonation(
      userId: ID!
      orgId: ID!
      payPalId: ID!
      nameOfUser: String!
      amount: Float!
      nameOfOrg: String!
    ): Donation!

    """
    Used in clients: Admin, Mobile
    """
    createEvent(data: EventInput): Event! @auth

    createGroupChat(data: createGroupChatInput!): GroupChat! @auth

    createMessageChat(data: MessageChatInput!): MessageChat! @auth

    """
    Used in clients: Admin
    """
    createOrganization(data: OrganizationInput, file: String): Organization!
      @auth
      @role(requires: SUPERADMIN)

    createPlugin(
      pluginName: String!
      pluginCreatedBy: String!
      pluginDesc: String!
      pluginInstallStatus: Boolean!
      installedOrgs: [ID!]
    ): Plugin!

    """
    Used in clients: Admin, Mobile
    """
    createPost(data: PostInput!, file: String): Post @auth

    createUserTag(input: CreateUserTagInput!): UserTag @auth

    createTask(data: TaskInput, eventId: ID!): Task! @auth

    deleteDonationById(id: ID!): DeletePayload!

    """
    Used in clients: Admin
    """
    forgotPassword(data: ForgotPasswordData!): Boolean!

    """
    Used in clients: Mobile
    """
    joinPublicOrganization(organizationId: ID!): User! @auth

    leaveOrganization(organizationId: ID!): User! @auth

    likeComment(id: ID!): Comment @auth

    """
    Used in clients: Mobile
    """
    likePost(id: ID!): Post @auth

    """
    Used in clients: Admin, Mobile
    """
    login(data: LoginInput!): AuthData!

    """
    Used in clients: Mobile
    """
    logout: Boolean! @auth

    """
    Used in clients: Admin
    """
    otp(data: OTPInput!): OtpData!

    """
    Used in clients: Admin
    """
    recaptcha(data: RecaptchaVerification!): Boolean!

    """
    Used in clients: Mobile
    """
    refreshToken(refreshToken: String!): ExtendSession!

    """
    Used in clients: Mobile
    """
    registerForEvent(id: ID!): Event! @auth

    """
    Used in clients: Admin
    """
    rejectAdmin(id: ID!): Boolean! @auth @role(requires: SUPERADMIN)

    """
    Used in clients: Admin
    """
    rejectMembershipRequest(membershipRequestId: ID!): MembershipRequest! @auth

    """
    Used in clients: Admin
    """
    removeAdmin(data: UserAndOrganizationInput!): User!
      @auth
      @role(requires: SUPERADMIN)

    removeComment(id: ID!): Comment @auth

    removeDirectChat(chatId: ID!, organizationId: ID!): DirectChat! @auth

    """
    Used in clients: Admin, Mobile
    """
    removeEvent(id: ID!): Event! @auth

    removeGroupChat(chatId: ID!): GroupChat! @auth

    """
    Used in clients: Admin
    """
    removeMember(data: UserAndOrganizationInput!): Organization! @auth

    """
    Used in clients: Admin
    """
    removeOrganization(id: ID!): User! @auth @role(requires: SUPERADMIN)

    removeOrganizationImage(organizationId: String!): Organization! @auth

    """
    Used in clients: Admin
    """
    removePost(id: ID!): Post @auth

    removeUserTag(id: ID!): UserTag @auth

    removeTask(id: ID!): Task @auth

    removeUserFromGroupChat(userId: ID!, chatId: ID!): GroupChat! @auth

    removeUserImage: User! @auth

    revokeRefreshTokenForUser(userId: String!): Boolean!

    """
    Used in clients: Mobile
    """
    saveFcmToken(token: String): Boolean! @auth

    """
    Used in clients: Mobile
    """
    sendMembershipRequest(organizationId: ID!): MembershipRequest! @auth

    """
    Used in clients: Mobile
    """
    sendMessageToDirectChat(
      chatId: ID!
      messageContent: String!
    ): DirectChatMessage! @auth

    sendMessageToGroupChat(
      chatId: ID!
      messageContent: String!
    ): GroupChatMessage! @auth

    """
    Used in clients: Admin, Mobile
    """
    signUp(data: UserInput!, file: String): AuthData!

    togglePostPin(id: ID!): Post! @auth

    unassignUserTag(input: ToggleUserTagAssignInput!): User @auth

    """
    Used in clients: Admin
    """
    unblockUser(organizationId: ID!, userId: ID!): User! @auth

    unlikeComment(id: ID!): Comment @auth

    """
    Used in clients: Mobile
    """
    unlikePost(id: ID!): Post @auth

    unregisterForEventByUser(id: ID!): Event! @auth

    """
    Used in clients: Admin, Mobile
    """
    updateEvent(id: ID!, data: UpdateEventInput): Event! @auth

    """
    Used in clients: Admin
    """
    updatePost(id: ID!, data: PostUpdateInput): Post! @auth

    """
    Used in clients: Mobile
    """
    updateLanguage(languageCode: String!): User! @auth

    """
    Used in clients: Admin
    """
    updateOrganization(
      id: ID!
      data: UpdateOrganizationInput
      file: String
    ): Organization! @auth

    updatePluginInstalledOrgs(id: ID!, orgId: ID!): Plugin!

    updatePluginStatus(id: ID!, status: Boolean!): Plugin!

    updateUserTag(input: UpdateUserTagInput!): UserTag @auth

    updateTask(id: ID!, data: UpdateTaskInput): Task @auth

    """
    Used in clients: Admin
    """
    updateUserProfile(data: UpdateUserInput, file: String): User! @auth

    """
    Used in clients: Admin
    """
    updateUserPassword(data: UpdateUserPasswordInput!): User! @auth

    """
    Used in clients: Admin
    """
    updateUserType(data: UpdateUserTypeInput!): Boolean!
      @auth
      @role(requires: SUPERADMIN)
  }
`;
