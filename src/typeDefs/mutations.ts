import { gql } from "apollo-server-core";
/**
 * This graphQL typeDef defines the logic for different mutations defined in the talawa-api.
 */
// Place fields alphabetically to ensure easier lookup and navigation.
export const mutations = gql`
  type Mutation {
    acceptAdmin(input: AcceptAdminInput!): Boolean!
      @auth
      @role(requires: SUPERADMIN)

    acceptMembershipRequest(input: MembershipRequestInput!): MembershipRequest!
      @auth

    addLanguageTranslation(input: LanguageInput!): Language! @auth

    addOrganizationImage(input: AddOrganizationImageInput!): Organization! @auth

    addUserImage(input: AddUserImageInput!): User! @auth

    addUserToGroupChat(input: AddUserToGroupChatInput!): GroupChat! @auth

    adminRemoveEvent(input: AdminRemoveEventInput!): Event! @auth

    adminRemoveGroup(input: AdminRemoveGroupInput!): Message! @auth

    assignUserTag(input: ToggleUserTagAssignInput!): User @auth

    blockPluginCreationBySuperadmin(
      input: blockPluginCreationBySuperadminInput!
    ): User! @auth @role(requires: SUPERADMIN)

    blockUser(input: BlockUserInput!): User! @auth

    cancelMembershipRequest(input: MembershipRequestInput!): MembershipRequest!
      @auth

    createAdmin(input: UserAndOrganizationInput!): User!
      @auth
      @role(requires: SUPERADMIN)

    createComment(input: CreateCommentInput!): Comment @auth

    createDirectChat(input: CreateChatInput!): DirectChat! @auth

    createDonation(input: CreateDonationInput!): Donation!

    createEvent(input: EventInput!): Event! @auth

    createGroup(input: GroupInput!): Group! @auth

    createGroupChat(input: CreateGroupChatInput!): GroupChat! @auth

    createMessageChat(input: MessageChatInput!): MessageChat! @auth

    createOrganization(input: CreateOrganizationInput!): Organization!
      @auth
      @role(requires: SUPERADMIN)

    createPlugin(input: CreatePluginInput!): Plugin!

    createPost(input: CreatePostInput!): Post @auth

    createUserTag(input: CreateUserTagInput!): UserTag @auth

    createTask(input: CreateTaskInput!): Task! @auth

    deleteDonationById(input: DeleteDonationByIdInput!): DeletePayload!

    forgotPassword(input: ForgotPasswordData!): Boolean!

    joinPublicOrganization(input: OrganizationIdInput!): User! @auth

    leaveOrganization(input: OrganizationIdInput!): User! @auth

    likeComment(input: LikeCommentInput!): Comment @auth

    likePost(input: LikePostInput!): Post @auth

    login(input: LoginInput!): AuthData!

    logout: Boolean! @auth

    otp(input: OTPInput!): OtpData!

    recaptcha(input: RecaptchaVerification!): Boolean!

    refreshToken(input: RefreshTokenInput!): ExtendSession!

    registerForEvent(input: RegisterForEventInput!): Event! @auth

    rejectAdmin(input: RejectAdminInput!): Boolean!
      @auth
      @role(requires: SUPERADMIN)

    rejectMembershipRequest(input: MembershipRequestInput!): MembershipRequest!
      @auth

    removeAdmin(input: UserAndOrganizationInput!): User!
      @auth
      @role(requires: SUPERADMIN)

    removeComment(input: RemoveCommentInput!): Comment @auth

    removeDirectChat(input: RemoveDirectChatInput!): DirectChat! @auth

    removeEvent(input: RemoveEventInput!): Event! @auth

    removeGroupChat(input: RemoveGroupChatInput!): GroupChat! @auth

    removeMember(input: UserAndOrganizationInput!): Organization! @auth

    removeOrganization(input: OrganizationIdInput!): User!
      @auth
      @role(requires: SUPERADMIN)

    removeOrganizationImage(input: OrganizationIdInput!): Organization! @auth

    removePost(input: RemovePostInput!): Post @auth

    removeTask(input: RemoveTaskInput!): Task @auth

    removeUserTag(input: RemoveUserTagInput!): UserTag @auth

    removeUserFromGroupChat(input: RemoveUserFromGroupChatInput!): GroupChat!
      @auth

    removeUserImage: User! @auth

    revokeRefreshTokenForUser(input: RevokeRefreshTokenForUserInput!): Boolean!

    saveFcmToken(input: SaveFcmTokenInput!): Boolean! @auth

    sendMembershipRequest(input: OrganizationIdInput!): MembershipRequest! @auth

    sendMessageToDirectChat(input: SendMessageToChatInput!): DirectChatMessage!
      @auth

    sendMessageToGroupChat(input: SendMessageToChatInput!): GroupChatMessage!
      @auth

    signUp(input: SignUpInput!): AuthData!

    togglePostPin(input: TogglePostPinInput!): Post! @auth

    unassignUserTag(input: ToggleUserTagAssignInput!): User @auth

    unblockUser(input: UserAndOrganizationInput!): User! @auth

    unlikeComment(input: UnlikeCommentInput!): Comment @auth

    unlikePost(input: UnlikePostInput!): Post @auth

    unregisterForEventByUser(input: UnregisterForEventByUserInput!): Event!
      @auth

    updateEvent(input: UpdateEventInput!): Event! @auth

    updatePost(input: UpdatePostInput!): Post! @auth

    updateLanguage(input: UpdateLanguageInput!): User! @auth

    updateOrganization(input: UpdateOrganizationInput!): Organization! @auth

    updatePluginInstalledOrgs(input: UpdatePluginInstalledOrgsInput!): Plugin!

    updatePluginStatus(input: UpdatePluginStatusInput!): Plugin!

    updateUserTag(input: UpdateUserTagInput!): UserTag @auth

    updateTask(input: UpdateTaskInput!): Task @auth

    updateUserProfile(input: UpdateUserProfileInput!): User! @auth

    updateUserPassword(input: UpdateUserPasswordInput!): User! @auth

    updateUserType(input: UpdateUserTypeInput!): Boolean!
      @auth
      @role(requires: SUPERADMIN)
  }
`;
