import { gql } from "apollo-server-core";

// Place fields alphabetically to ensure easier lookup and navigation.
export const mutations = gql`
  type Mutation {
    acceptAdmin(id: ID!): Boolean! @auth @role(requires: SUPERADMIN)

    acceptMembershipRequest(membershipRequestId: ID!): MembershipRequest! @auth

    addLanguageTranslation(data: LanguageInput!): Language! @auth

    addOrganizationImage(file: String!, organizationId: String!): Organization!
      @auth

    addUserImage(file: String!): User! @auth

    addUserToGroupChat(userId: ID!, chatId: ID!): GroupChat! @auth

    adminRemoveEvent(eventId: ID!): Event! @auth

    adminRemoveGroup(groupId: ID!): Message! @auth

    blockPluginCreationBySuperadmin(userId: ID!, blockUser: Boolean!): User!
      @auth
      @role(requires: SUPERADMIN)

    blockUser(organizationId: ID!, userId: ID!): User! @auth

    cancelMembershipRequest(membershipRequestId: ID!): MembershipRequest! @auth

    createAdmin(data: UserAndOrganizationInput!): User!
      @auth
      @role(requires: SUPERADMIN)

    createComment(postId: ID!, data: CommentInput!): Comment @auth

    createDirectChat(data: createChatInput): DirectChat! @auth

    createDonation(
      userId: ID!
      orgId: ID!
      payPalId: ID!
      nameOfUser: String!
      amount: Float!
      nameOfOrg: String!
    ): Donation!

    createEvent(data: EventInput): Event! @auth

    createGroup(data: GroupInput!): Group! @auth

    createGroupChat(data: createGroupChatInput): GroupChat! @auth

    createMessageChat(data: MessageChatInput!): MessageChat! @auth

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

    createPost(data: PostInput!, file: String): Post @auth

    createTag(input: createTagInput): Tag @auth

    createTask(data: TaskInput, eventId: ID!): Task! @auth

    deleteDonationById(id: ID!): DeletePayload!

    forgotPassword(data: ForgotPasswordData!): Boolean!

    joinPublicOrganization(organizationId: ID!): User! @auth

    leaveOrganization(organizationId: ID!): User! @auth

    likeComment(id: ID!): Comment @auth

    likePost(id: ID!): Post @auth

    login(data: LoginInput!): AuthData!

    logout: Boolean! @auth

    otp(data: OTPInput!): OtpData!

    recaptcha(data: RecaptchaVerification!): Boolean!

    refreshToken(refreshToken: String!): ExtendSession!

    registerForEvent(id: ID!): Event! @auth

    rejectAdmin(id: ID!): Boolean! @auth @role(requires: SUPERADMIN)

    rejectMembershipRequest(membershipRequestId: ID!): MembershipRequest! @auth

    removeAdmin(data: UserAndOrganizationInput!): User!
      @auth
      @role(requires: SUPERADMIN)

    removeComment(id: ID!): Comment @auth

    removeDirectChat(chatId: ID!, organizationId: ID!): DirectChat! @auth

    removeEvent(id: ID!): Event! @auth

    removeGroupChat(chatId: ID!): GroupChat! @auth

    removeMember(data: UserAndOrganizationInput!): Organization! @auth

    removeOrganization(id: ID!): User! @auth @role(requires: SUPERADMIN)

    removeOrganizationImage(organizationId: String!): Organization! @auth

    removePost(id: ID!): Post @auth

    removeTag(id: ID!): Tag @auth

    removeTask(id: ID!): Task @auth

    removeUserFromGroupChat(userId: ID!, chatId: ID!): GroupChat! @auth

    removeUserImage: User! @auth

    revokeRefreshTokenForUser(userId: String!): Boolean!

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

    togglePostPin(id: ID!): Post! @auth

    toggleTagAssign(input: ToggleTagAssignInput): Boolean @auth

    unblockUser(organizationId: ID!, userId: ID!): User! @auth

    unlikeComment(id: ID!): Comment @auth

    unlikePost(id: ID!): Post @auth

    unregisterForEventByUser(id: ID!): Event! @auth

    updateEvent(id: ID!, data: UpdateEventInput): Event! @auth

    updatePost(id: ID!, data: PostUpdateInput): Post! @auth

    updateLanguage(languageCode: String!): User! @auth

    updateOrganization(id: ID!, data: UpdateOrganizationInput): Organization!
      @auth

    updatePluginInstalledOrgs(id: ID!, orgId: ID!): Plugin!

    updatePluginStatus(id: ID!, status: Boolean!): Plugin!

    updateTag(tagId: ID!, newName: String!): Tag @auth

    updateTask(id: ID!, data: UpdateTaskInput): Task @auth

    updateUserProfile(data: UpdateUserInput, file: String): User! @auth

    updateUserType(data: UpdateUserTypeInput!): Boolean!
      @auth
      @role(requires: SUPERADMIN)
  }
`;
