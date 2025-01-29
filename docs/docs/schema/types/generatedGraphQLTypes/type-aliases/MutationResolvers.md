[**talawa-api**](../../../README.md)

***

# Type Alias: MutationResolvers\<ContextType, ParentType\>

> **MutationResolvers**\<`ContextType`, `ParentType`\>: `object`

## Type Parameters

• **ContextType** = `any`

• **ParentType** *extends* [`ResolversParentTypes`](ResolversParentTypes.md)\[`"Mutation"`\] = [`ResolversParentTypes`](ResolversParentTypes.md)\[`"Mutation"`\]

## Type declaration

### acceptMembershipRequest?

> `optional` **acceptMembershipRequest**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"MembershipRequest"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationAcceptMembershipRequestArgs`](MutationAcceptMembershipRequestArgs.md), `"membershipRequestId"`\>\>

### addEventAttendee?

> `optional` **addEventAttendee**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"User"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationAddEventAttendeeArgs`](MutationAddEventAttendeeArgs.md), `"data"`\>\>

### addFeedback?

> `optional` **addFeedback**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Feedback"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationAddFeedbackArgs`](MutationAddFeedbackArgs.md), `"data"`\>\>

### addLanguageTranslation?

> `optional` **addLanguageTranslation**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Language"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationAddLanguageTranslationArgs`](MutationAddLanguageTranslationArgs.md), `"data"`\>\>

### addOrganizationCustomField?

> `optional` **addOrganizationCustomField**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"OrganizationCustomField"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationAddOrganizationCustomFieldArgs`](MutationAddOrganizationCustomFieldArgs.md), `"name"` \| `"organizationId"` \| `"type"`\>\>

### addOrganizationImage?

> `optional` **addOrganizationImage**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Organization"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationAddOrganizationImageArgs`](MutationAddOrganizationImageArgs.md), `"file"` \| `"organizationId"`\>\>

### addPeopleToUserTag?

> `optional` **addPeopleToUserTag**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"UserTag"`\]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationAddPeopleToUserTagArgs`](MutationAddPeopleToUserTagArgs.md), `"input"`\>\>

### addPledgeToFundraisingCampaign?

> `optional` **addPledgeToFundraisingCampaign**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"FundraisingCampaignPledge"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationAddPledgeToFundraisingCampaignArgs`](MutationAddPledgeToFundraisingCampaignArgs.md), `"campaignId"` \| `"pledgeId"`\>\>

### addUserCustomData?

> `optional` **addUserCustomData**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"UserCustomData"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationAddUserCustomDataArgs`](MutationAddUserCustomDataArgs.md), `"dataName"` \| `"dataValue"` \| `"organizationId"`\>\>

### addUserImage?

> `optional` **addUserImage**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"User"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationAddUserImageArgs`](MutationAddUserImageArgs.md), `"file"`\>\>

### addUserToGroupChat?

> `optional` **addUserToGroupChat**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Chat"`\]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationAddUserToGroupChatArgs`](MutationAddUserToGroupChatArgs.md), `"chatId"` \| `"userId"`\>\>

### addUserToUserFamily?

> `optional` **addUserToUserFamily**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"UserFamily"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationAddUserToUserFamilyArgs`](MutationAddUserToUserFamilyArgs.md), `"familyId"` \| `"userId"`\>\>

### assignToUserTags?

> `optional` **assignToUserTags**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"UserTag"`\]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationAssignToUserTagsArgs`](MutationAssignToUserTagsArgs.md), `"input"`\>\>

### assignUserTag?

> `optional` **assignUserTag**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"User"`\]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationAssignUserTagArgs`](MutationAssignUserTagArgs.md), `"input"`\>\>

### blockPluginCreationBySuperadmin?

> `optional` **blockPluginCreationBySuperadmin**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"AppUserProfile"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationBlockPluginCreationBySuperadminArgs`](MutationBlockPluginCreationBySuperadminArgs.md), `"blockUser"` \| `"userId"`\>\>

### blockUser?

> `optional` **blockUser**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"User"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationBlockUserArgs`](MutationBlockUserArgs.md), `"organizationId"` \| `"userId"`\>\>

### cancelMembershipRequest?

> `optional` **cancelMembershipRequest**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"MembershipRequest"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationCancelMembershipRequestArgs`](MutationCancelMembershipRequestArgs.md), `"membershipRequestId"`\>\>

### checkIn?

> `optional` **checkIn**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"CheckIn"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationCheckInArgs`](MutationCheckInArgs.md), `"data"`\>\>

### checkOut?

> `optional` **checkOut**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"CheckOut"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationCheckOutArgs`](MutationCheckOutArgs.md), `"data"`\>\>

### createActionItem?

> `optional` **createActionItem**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"ActionItem"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationCreateActionItemArgs`](MutationCreateActionItemArgs.md), `"actionItemCategoryId"` \| `"data"`\>\>

### createActionItemCategory?

> `optional` **createActionItemCategory**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"ActionItemCategory"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationCreateActionItemCategoryArgs`](MutationCreateActionItemCategoryArgs.md), `"isDisabled"` \| `"name"` \| `"organizationId"`\>\>

### createAdmin?

> `optional` **createAdmin**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"CreateAdminPayload"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationCreateAdminArgs`](MutationCreateAdminArgs.md), `"data"`\>\>

### createAdvertisement?

> `optional` **createAdvertisement**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"CreateAdvertisementPayload"`\]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationCreateAdvertisementArgs`](MutationCreateAdvertisementArgs.md), `"input"`\>\>

### createAgendaCategory?

> `optional` **createAgendaCategory**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"AgendaCategory"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationCreateAgendaCategoryArgs`](MutationCreateAgendaCategoryArgs.md), `"input"`\>\>

### createAgendaItem?

> `optional` **createAgendaItem**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"AgendaItem"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationCreateAgendaItemArgs`](MutationCreateAgendaItemArgs.md), `"input"`\>\>

### createAgendaSection?

> `optional` **createAgendaSection**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"AgendaSection"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationCreateAgendaSectionArgs`](MutationCreateAgendaSectionArgs.md), `"input"`\>\>

### createChat?

> `optional` **createChat**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Chat"`\]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationCreateChatArgs`](MutationCreateChatArgs.md), `"data"`\>\>

### createComment?

> `optional` **createComment**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Comment"`\]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationCreateCommentArgs`](MutationCreateCommentArgs.md), `"data"` \| `"postId"`\>\>

### createDonation?

> `optional` **createDonation**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Donation"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationCreateDonationArgs`](MutationCreateDonationArgs.md), `"amount"` \| `"nameOfOrg"` \| `"nameOfUser"` \| `"orgId"` \| `"payPalId"` \| `"userId"`\>\>

### createEvent?

> `optional` **createEvent**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Event"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationCreateEventArgs`](MutationCreateEventArgs.md), `"data"`\>\>

### createEventVolunteer?

> `optional` **createEventVolunteer**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"EventVolunteer"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationCreateEventVolunteerArgs`](MutationCreateEventVolunteerArgs.md), `"data"`\>\>

### createEventVolunteerGroup?

> `optional` **createEventVolunteerGroup**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"EventVolunteerGroup"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationCreateEventVolunteerGroupArgs`](MutationCreateEventVolunteerGroupArgs.md), `"data"`\>\>

### createFund?

> `optional` **createFund**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Fund"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationCreateFundArgs`](MutationCreateFundArgs.md), `"data"`\>\>

### createFundraisingCampaign?

> `optional` **createFundraisingCampaign**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"FundraisingCampaign"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationCreateFundraisingCampaignArgs`](MutationCreateFundraisingCampaignArgs.md), `"data"`\>\>

### createFundraisingCampaignPledge?

> `optional` **createFundraisingCampaignPledge**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"FundraisingCampaignPledge"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationCreateFundraisingCampaignPledgeArgs`](MutationCreateFundraisingCampaignPledgeArgs.md), `"data"`\>\>

### createMember?

> `optional` **createMember**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"CreateMemberPayload"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationCreateMemberArgs`](MutationCreateMemberArgs.md), `"input"`\>\>

### createNote?

> `optional` **createNote**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Note"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationCreateNoteArgs`](MutationCreateNoteArgs.md), `"data"`\>\>

### createOrganization?

> `optional` **createOrganization**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Organization"`\], `ParentType`, `ContextType`, `Partial`\<[`MutationCreateOrganizationArgs`](MutationCreateOrganizationArgs.md)\>\>

### createPlugin?

> `optional` **createPlugin**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Plugin"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationCreatePluginArgs`](MutationCreatePluginArgs.md), `"pluginCreatedBy"` \| `"pluginDesc"` \| `"pluginName"`\>\>

### createPost?

> `optional` **createPost**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Post"`\]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationCreatePostArgs`](MutationCreatePostArgs.md), `"data"`\>\>

### createSampleOrganization?

> `optional` **createSampleOrganization**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Boolean"`\], `ParentType`, `ContextType`\>

### createUserFamily?

> `optional` **createUserFamily**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"UserFamily"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationCreateUserFamilyArgs`](MutationCreateUserFamilyArgs.md), `"data"`\>\>

### createUserTag?

> `optional` **createUserTag**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"UserTag"`\]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationCreateUserTagArgs`](MutationCreateUserTagArgs.md), `"input"`\>\>

### createVenue?

> `optional` **createVenue**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Venue"`\]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationCreateVenueArgs`](MutationCreateVenueArgs.md), `"data"`\>\>

### createVolunteerMembership?

> `optional` **createVolunteerMembership**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"VolunteerMembership"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationCreateVolunteerMembershipArgs`](MutationCreateVolunteerMembershipArgs.md), `"data"`\>\>

### deleteAdvertisement?

> `optional` **deleteAdvertisement**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"DeleteAdvertisementPayload"`\]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationDeleteAdvertisementArgs`](MutationDeleteAdvertisementArgs.md), `"id"`\>\>

### deleteAgendaCategory?

> `optional` **deleteAgendaCategory**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"ID"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationDeleteAgendaCategoryArgs`](MutationDeleteAgendaCategoryArgs.md), `"id"`\>\>

### deleteDonationById?

> `optional` **deleteDonationById**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"DeletePayload"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationDeleteDonationByIdArgs`](MutationDeleteDonationByIdArgs.md), `"id"`\>\>

### deleteNote?

> `optional` **deleteNote**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"ID"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationDeleteNoteArgs`](MutationDeleteNoteArgs.md), `"id"`\>\>

### deleteVenue?

> `optional` **deleteVenue**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Venue"`\]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationDeleteVenueArgs`](MutationDeleteVenueArgs.md), `"id"`\>\>

### editVenue?

> `optional` **editVenue**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Venue"`\]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationEditVenueArgs`](MutationEditVenueArgs.md), `"data"`\>\>

### forgotPassword?

> `optional` **forgotPassword**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Boolean"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationForgotPasswordArgs`](MutationForgotPasswordArgs.md), `"data"`\>\>

### inviteEventAttendee?

> `optional` **inviteEventAttendee**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"EventAttendee"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationInviteEventAttendeeArgs`](MutationInviteEventAttendeeArgs.md), `"data"`\>\>

### joinPublicOrganization?

> `optional` **joinPublicOrganization**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"User"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationJoinPublicOrganizationArgs`](MutationJoinPublicOrganizationArgs.md), `"organizationId"`\>\>

### leaveOrganization?

> `optional` **leaveOrganization**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"User"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationLeaveOrganizationArgs`](MutationLeaveOrganizationArgs.md), `"organizationId"`\>\>

### likeComment?

> `optional` **likeComment**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Comment"`\]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationLikeCommentArgs`](MutationLikeCommentArgs.md), `"id"`\>\>

### likePost?

> `optional` **likePost**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Post"`\]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationLikePostArgs`](MutationLikePostArgs.md), `"id"`\>\>

### login?

> `optional` **login**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"AuthData"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationLoginArgs`](MutationLoginArgs.md), `"data"`\>\>

### logout?

> `optional` **logout**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Boolean"`\], `ParentType`, `ContextType`\>

### markChatMessagesAsRead?

> `optional` **markChatMessagesAsRead**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Chat"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationMarkChatMessagesAsReadArgs`](MutationMarkChatMessagesAsReadArgs.md), `"chatId"` \| `"userId"`\>\>

### otp?

> `optional` **otp**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"OtpData"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationOtpArgs`](MutationOtpArgs.md), `"data"`\>\>

### recaptcha?

> `optional` **recaptcha**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Boolean"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationRecaptchaArgs`](MutationRecaptchaArgs.md), `"data"`\>\>

### refreshToken?

> `optional` **refreshToken**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"ExtendSession"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationRefreshTokenArgs`](MutationRefreshTokenArgs.md), `"refreshToken"`\>\>

### registerEventAttendee?

> `optional` **registerEventAttendee**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"EventAttendee"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationRegisterEventAttendeeArgs`](MutationRegisterEventAttendeeArgs.md), `"data"`\>\>

### registerForEvent?

> `optional` **registerForEvent**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"EventAttendee"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationRegisterForEventArgs`](MutationRegisterForEventArgs.md), `"id"`\>\>

### rejectMembershipRequest?

> `optional` **rejectMembershipRequest**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"MembershipRequest"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationRejectMembershipRequestArgs`](MutationRejectMembershipRequestArgs.md), `"membershipRequestId"`\>\>

### removeActionItem?

> `optional` **removeActionItem**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"ActionItem"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationRemoveActionItemArgs`](MutationRemoveActionItemArgs.md), `"id"`\>\>

### removeAdmin?

> `optional` **removeAdmin**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"AppUserProfile"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationRemoveAdminArgs`](MutationRemoveAdminArgs.md), `"data"`\>\>

### removeAdvertisement?

> `optional` **removeAdvertisement**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Advertisement"`\]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationRemoveAdvertisementArgs`](MutationRemoveAdvertisementArgs.md), `"id"`\>\>

### removeAgendaItem?

> `optional` **removeAgendaItem**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"AgendaItem"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationRemoveAgendaItemArgs`](MutationRemoveAgendaItemArgs.md), `"id"`\>\>

### removeAgendaSection?

> `optional` **removeAgendaSection**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"ID"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationRemoveAgendaSectionArgs`](MutationRemoveAgendaSectionArgs.md), `"id"`\>\>

### removeComment?

> `optional` **removeComment**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Comment"`\]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationRemoveCommentArgs`](MutationRemoveCommentArgs.md), `"id"`\>\>

### removeEvent?

> `optional` **removeEvent**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Event"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationRemoveEventArgs`](MutationRemoveEventArgs.md), `"id"`\>\>

### removeEventAttendee?

> `optional` **removeEventAttendee**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"User"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationRemoveEventAttendeeArgs`](MutationRemoveEventAttendeeArgs.md), `"data"`\>\>

### removeEventVolunteer?

> `optional` **removeEventVolunteer**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"EventVolunteer"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationRemoveEventVolunteerArgs`](MutationRemoveEventVolunteerArgs.md), `"id"`\>\>

### removeEventVolunteerGroup?

> `optional` **removeEventVolunteerGroup**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"EventVolunteerGroup"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationRemoveEventVolunteerGroupArgs`](MutationRemoveEventVolunteerGroupArgs.md), `"id"`\>\>

### removeFromUserTags?

> `optional` **removeFromUserTags**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"UserTag"`\]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationRemoveFromUserTagsArgs`](MutationRemoveFromUserTagsArgs.md), `"input"`\>\>

### removeFundraisingCampaignPledge?

> `optional` **removeFundraisingCampaignPledge**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"FundraisingCampaignPledge"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationRemoveFundraisingCampaignPledgeArgs`](MutationRemoveFundraisingCampaignPledgeArgs.md), `"id"`\>\>

### removeMember?

> `optional` **removeMember**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Organization"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationRemoveMemberArgs`](MutationRemoveMemberArgs.md), `"data"`\>\>

### removeOrganization?

> `optional` **removeOrganization**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"UserData"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationRemoveOrganizationArgs`](MutationRemoveOrganizationArgs.md), `"id"`\>\>

### removeOrganizationCustomField?

> `optional` **removeOrganizationCustomField**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"OrganizationCustomField"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationRemoveOrganizationCustomFieldArgs`](MutationRemoveOrganizationCustomFieldArgs.md), `"customFieldId"` \| `"organizationId"`\>\>

### removeOrganizationImage?

> `optional` **removeOrganizationImage**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Organization"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationRemoveOrganizationImageArgs`](MutationRemoveOrganizationImageArgs.md), `"organizationId"`\>\>

### removePost?

> `optional` **removePost**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Post"`\]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationRemovePostArgs`](MutationRemovePostArgs.md), `"id"`\>\>

### removeSampleOrganization?

> `optional` **removeSampleOrganization**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Boolean"`\], `ParentType`, `ContextType`\>

### removeUserCustomData?

> `optional` **removeUserCustomData**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"UserCustomData"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationRemoveUserCustomDataArgs`](MutationRemoveUserCustomDataArgs.md), `"organizationId"`\>\>

### removeUserFamily?

> `optional` **removeUserFamily**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"UserFamily"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationRemoveUserFamilyArgs`](MutationRemoveUserFamilyArgs.md), `"familyId"`\>\>

### removeUserFromUserFamily?

> `optional` **removeUserFromUserFamily**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"UserFamily"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationRemoveUserFromUserFamilyArgs`](MutationRemoveUserFromUserFamilyArgs.md), `"familyId"` \| `"userId"`\>\>

### removeUserImage?

> `optional` **removeUserImage**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"User"`\], `ParentType`, `ContextType`\>

### removeUserTag?

> `optional` **removeUserTag**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"UserTag"`\]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationRemoveUserTagArgs`](MutationRemoveUserTagArgs.md), `"id"`\>\>

### resetCommunity?

> `optional` **resetCommunity**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Boolean"`\], `ParentType`, `ContextType`\>

### revokeRefreshTokenForUser?

> `optional` **revokeRefreshTokenForUser**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Boolean"`\], `ParentType`, `ContextType`\>

### saveFcmToken?

> `optional` **saveFcmToken**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Boolean"`\], `ParentType`, `ContextType`, `Partial`\<[`MutationSaveFcmTokenArgs`](MutationSaveFcmTokenArgs.md)\>\>

### sendMembershipRequest?

> `optional` **sendMembershipRequest**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"MembershipRequest"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationSendMembershipRequestArgs`](MutationSendMembershipRequestArgs.md), `"organizationId"`\>\>

### sendMessageToChat?

> `optional` **sendMessageToChat**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"ChatMessage"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationSendMessageToChatArgs`](MutationSendMessageToChatArgs.md), `"chatId"`\>\>

### signUp?

> `optional` **signUp**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"AuthData"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationSignUpArgs`](MutationSignUpArgs.md), `"data"`\>\>

### togglePostPin?

> `optional` **togglePostPin**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Post"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationTogglePostPinArgs`](MutationTogglePostPinArgs.md), `"id"`\>\>

### unassignUserTag?

> `optional` **unassignUserTag**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"User"`\]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationUnassignUserTagArgs`](MutationUnassignUserTagArgs.md), `"input"`\>\>

### unblockUser?

> `optional` **unblockUser**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"User"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationUnblockUserArgs`](MutationUnblockUserArgs.md), `"organizationId"` \| `"userId"`\>\>

### unlikeComment?

> `optional` **unlikeComment**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Comment"`\]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationUnlikeCommentArgs`](MutationUnlikeCommentArgs.md), `"id"`\>\>

### unlikePost?

> `optional` **unlikePost**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Post"`\]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationUnlikePostArgs`](MutationUnlikePostArgs.md), `"id"`\>\>

### unregisterForEventByUser?

> `optional` **unregisterForEventByUser**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Event"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationUnregisterForEventByUserArgs`](MutationUnregisterForEventByUserArgs.md), `"id"`\>\>

### updateActionItem?

> `optional` **updateActionItem**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"ActionItem"`\]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationUpdateActionItemArgs`](MutationUpdateActionItemArgs.md), `"data"` \| `"id"`\>\>

### updateActionItemCategory?

> `optional` **updateActionItemCategory**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"ActionItemCategory"`\]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationUpdateActionItemCategoryArgs`](MutationUpdateActionItemCategoryArgs.md), `"data"` \| `"id"`\>\>

### updateAdvertisement?

> `optional` **updateAdvertisement**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"UpdateAdvertisementPayload"`\]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationUpdateAdvertisementArgs`](MutationUpdateAdvertisementArgs.md), `"input"`\>\>

### updateAgendaCategory?

> `optional` **updateAgendaCategory**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"AgendaCategory"`\]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationUpdateAgendaCategoryArgs`](MutationUpdateAgendaCategoryArgs.md), `"id"` \| `"input"`\>\>

### updateAgendaItem?

> `optional` **updateAgendaItem**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"AgendaItem"`\]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationUpdateAgendaItemArgs`](MutationUpdateAgendaItemArgs.md), `"id"` \| `"input"`\>\>

### updateAgendaSection?

> `optional` **updateAgendaSection**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"AgendaSection"`\]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationUpdateAgendaSectionArgs`](MutationUpdateAgendaSectionArgs.md), `"id"` \| `"input"`\>\>

### updateChat?

> `optional` **updateChat**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Chat"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationUpdateChatArgs`](MutationUpdateChatArgs.md), `"input"`\>\>

### updateChatMessage?

> `optional` **updateChatMessage**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"ChatMessage"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationUpdateChatMessageArgs`](MutationUpdateChatMessageArgs.md), `"input"`\>\>

### updateCommunity?

> `optional` **updateCommunity**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Boolean"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationUpdateCommunityArgs`](MutationUpdateCommunityArgs.md), `"data"`\>\>

### updateEvent?

> `optional` **updateEvent**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Event"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationUpdateEventArgs`](MutationUpdateEventArgs.md), `"data"` \| `"id"`\>\>

### updateEventVolunteer?

> `optional` **updateEventVolunteer**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"EventVolunteer"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationUpdateEventVolunteerArgs`](MutationUpdateEventVolunteerArgs.md), `"id"`\>\>

### updateEventVolunteerGroup?

> `optional` **updateEventVolunteerGroup**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"EventVolunteerGroup"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationUpdateEventVolunteerGroupArgs`](MutationUpdateEventVolunteerGroupArgs.md), `"data"` \| `"id"`\>\>

### updateFund?

> `optional` **updateFund**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Fund"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationUpdateFundArgs`](MutationUpdateFundArgs.md), `"data"` \| `"id"`\>\>

### updateFundraisingCampaign?

> `optional` **updateFundraisingCampaign**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"FundraisingCampaign"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationUpdateFundraisingCampaignArgs`](MutationUpdateFundraisingCampaignArgs.md), `"data"` \| `"id"`\>\>

### updateFundraisingCampaignPledge?

> `optional` **updateFundraisingCampaignPledge**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"FundraisingCampaignPledge"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationUpdateFundraisingCampaignPledgeArgs`](MutationUpdateFundraisingCampaignPledgeArgs.md), `"data"` \| `"id"`\>\>

### updateLanguage?

> `optional` **updateLanguage**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"User"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationUpdateLanguageArgs`](MutationUpdateLanguageArgs.md), `"languageCode"`\>\>

### updateNote?

> `optional` **updateNote**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Note"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationUpdateNoteArgs`](MutationUpdateNoteArgs.md), `"data"` \| `"id"`\>\>

### updateOrganization?

> `optional` **updateOrganization**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Organization"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationUpdateOrganizationArgs`](MutationUpdateOrganizationArgs.md), `"id"`\>\>

### updatePluginStatus?

> `optional` **updatePluginStatus**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Plugin"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationUpdatePluginStatusArgs`](MutationUpdatePluginStatusArgs.md), `"id"` \| `"orgId"`\>\>

### updatePost?

> `optional` **updatePost**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Post"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationUpdatePostArgs`](MutationUpdatePostArgs.md), `"id"`\>\>

### updateSessionTimeout?

> `optional` **updateSessionTimeout**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Boolean"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationUpdateSessionTimeoutArgs`](MutationUpdateSessionTimeoutArgs.md), `"timeout"`\>\>

### updateUserPassword?

> `optional` **updateUserPassword**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"UserData"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationUpdateUserPasswordArgs`](MutationUpdateUserPasswordArgs.md), `"data"`\>\>

### updateUserProfile?

> `optional` **updateUserProfile**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"User"`\], `ParentType`, `ContextType`, `Partial`\<[`MutationUpdateUserProfileArgs`](MutationUpdateUserProfileArgs.md)\>\>

### updateUserRoleInOrganization?

> `optional` **updateUserRoleInOrganization**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Organization"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationUpdateUserRoleInOrganizationArgs`](MutationUpdateUserRoleInOrganizationArgs.md), `"organizationId"` \| `"role"` \| `"userId"`\>\>

### updateUserTag?

> `optional` **updateUserTag**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"UserTag"`\]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationUpdateUserTagArgs`](MutationUpdateUserTagArgs.md), `"input"`\>\>

### updateVolunteerMembership?

> `optional` **updateVolunteerMembership**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"VolunteerMembership"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`MutationUpdateVolunteerMembershipArgs`](MutationUpdateVolunteerMembershipArgs.md), `"id"` \| `"status"`\>\>

## Defined in

[src/types/generatedGraphQLTypes.ts:4567](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/types/generatedGraphQLTypes.ts#L4567)
