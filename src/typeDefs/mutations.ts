import { gql } from "apollo-server-core";

// Place fields alphabetically to ensure easier lookup and navigation.
export const mutations = gql`
  type Mutation {
    acceptAdmin(id: ObjectID!): Boolean! @auth @role(requires: SUPERADMIN)

    acceptMembershipRequest(membershipRequestId: ObjectID!): MembershipRequest!
      @auth

    addLanguageTranslation(data: LanguageInput!): Language! @auth

    addOrganizationImage(file: Upload!, organizationId: String!): Organization!
      @auth

    addUserImage(file: Upload!): User! @auth

    addUserToGroupChat(userId: ObjectID!, chatId: ObjectID!): GroupChat! @auth

    adminRemoveEvent(eventId: ObjectID!): Event! @auth

    adminRemoveGroup(groupId: ObjectID!): Message! @auth

    adminRemovePost(organizationId: ObjectID!, postId: ObjectID!): Post! @auth

    blockPluginCreationBySuperadmin(
      userId: ObjectID!
      blockUser: Boolean!
    ): User! @auth @role(requires: SUPERADMIN)

    blockUser(organizationId: ObjectID!, userId: ObjectID!): User! @auth

    cancelMembershipRequest(membershipRequestId: ObjectID!): MembershipRequest!
      @auth

    createAdmin(data: UserAndOrganizationInput!): User!
      @auth
      @role(requires: SUPERADMIN)

    createComment(postId: ObjectID!, data: CommentInput!): Comment @auth

    createDirectChat(data: createChatInput): DirectChat! @auth

    createDonation(
      userId: ObjectID!
      orgId: ObjectID!
      payPalId: ObjectID!
      nameOfUser: String!
      amount: Float!
      nameOfOrg: String!
    ): Donation!

    createEvent(data: EventInput): Event! @auth

    createGroup(data: GroupInput!): Group! @auth

    createGroupChat(data: createGroupChatInput): GroupChat! @auth

    createMessageChat(data: MessageChatInput!): MessageChat! @auth

    createOrganization(data: OrganizationInput, file: Upload): Organization!
      @auth
      @role(requires: SUPERADMIN)

    createPlugin(
      pluginName: String!
      pluginCreatedBy: String!
      pluginDesc: String!
      pluginInstallStatus: Boolean!
      installedOrgs: [ObjectID!]
    ): Plugin!

    createPost(data: PostInput!, file: Upload): Post @auth

    createTask(data: TaskInput, eventId: ObjectID!): Task! @auth

    deleteDonationById(id: ObjectID!): DeletePayload!

    forgotPassword(data: ForgotPasswordData!): Boolean!

    joinPublicOrganization(organizationId: ObjectID!): User! @auth

    leaveOrganization(organizationId: ObjectID!): User! @auth

    likeComment(id: ObjectID!): Comment @auth

    likePost(id: ObjectID!): Post @auth

    login(data: LoginInput!): AuthData!

    logout: Boolean! @auth

    otp(data: OTPInput!): OtpData!

    recaptcha(data: RecaptchaVerification!): Boolean!

    refreshToken(refreshToken: String!): ExtendSession!

    registerForEvent(id: ObjectID!): Event! @auth

    rejectAdmin(id: ObjectID!): Boolean! @auth @role(requires: SUPERADMIN)

    rejectMembershipRequest(membershipRequestId: ObjectID!): MembershipRequest!
      @auth

    removeAdmin(data: UserAndOrganizationInput!): User!
      @auth
      @role(requires: SUPERADMIN)

    removeComment(id: ObjectID!): Comment @auth

    removeDirectChat(chatId: ObjectID!, organizationId: ObjectID!): DirectChat!
      @auth

    removeEvent(id: ObjectID!): Event! @auth

    removeGroupChat(chatId: ObjectID!): GroupChat! @auth

    removeMember(data: UserAndOrganizationInput!): Organization! @auth

    removeOrganization(id: ObjectID!): User! @auth @role(requires: SUPERADMIN)

    removeOrganizationImage(organizationId: String!): Organization! @auth

    removePost(id: ObjectID!): Post @auth

    removeTask(id: ObjectID!): Task @auth

    removeUserFromGroupChat(userId: ObjectID!, chatId: ObjectID!): GroupChat!
      @auth

    removeUserImage: User! @auth

    revokeRefreshTokenForUser(userId: String!): Boolean!

    saveFcmToken(token: String): Boolean! @auth

    sendMembershipRequest(organizationId: ObjectID!): MembershipRequest! @auth

    sendMessageToDirectChat(
      chatId: ObjectID!
      messageContent: String!
    ): DirectChatMessage! @auth

    sendMessageToGroupChat(
      chatId: ObjectID!
      messageContent: String!
    ): GroupChatMessage! @auth

    signUp(data: UserInput!, file: Upload): AuthData!

    unblockUser(organizationId: ObjectID!, userId: ObjectID!): User! @auth

    unlikeComment(id: ObjectID!): Comment @auth

    unlikePost(id: ObjectID!): Post @auth

    unregisterForEventByUser(id: ObjectID!): Event! @auth

    updateEvent(id: ObjectID!, data: UpdateEventInput): Event! @auth

    updatePost(id: ObjectID!, data: PostUpdateInput): Post! @auth

    updateLanguage(languageCode: String!): User! @auth

    updateOrganization(
      id: ObjectID!
      data: UpdateOrganizationInput
    ): Organization! @auth

    updatePluginInstalledOrgs(id: ObjectID!, orgId: ObjectID!): Plugin!

    updatePluginStatus(id: ObjectID!, status: Boolean!): Plugin!

    updateTask(id: ObjectID!, data: UpdateTaskInput): Task @auth

    updateUserProfile(data: UpdateUserInput, file: Upload): User! @auth

    updateUserType(data: UpdateUserTypeInput!): Boolean!
      @auth
      @role(requires: SUPERADMIN)
  }
`;
