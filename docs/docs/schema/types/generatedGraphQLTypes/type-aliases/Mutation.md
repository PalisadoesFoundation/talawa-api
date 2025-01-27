[**talawa-api**](../../../README.md)

***

# Type Alias: Mutation

> **Mutation**: `object`

## Type declaration

### \_\_typename?

> `optional` **\_\_typename**: `"Mutation"`

### acceptMembershipRequest

> **acceptMembershipRequest**: [`MembershipRequest`](MembershipRequest.md)

### addEventAttendee

> **addEventAttendee**: [`User`](User.md)

### addFeedback

> **addFeedback**: [`Feedback`](Feedback.md)

### addLanguageTranslation

> **addLanguageTranslation**: [`Language`](Language.md)

### addOrganizationCustomField

> **addOrganizationCustomField**: [`OrganizationCustomField`](OrganizationCustomField.md)

### addOrganizationImage

> **addOrganizationImage**: [`Organization`](Organization.md)

### addPeopleToUserTag?

> `optional` **addPeopleToUserTag**: [`Maybe`](Maybe.md)\<[`UserTag`](UserTag.md)\>

### addPledgeToFundraisingCampaign

> **addPledgeToFundraisingCampaign**: [`FundraisingCampaignPledge`](FundraisingCampaignPledge.md)

### addUserCustomData

> **addUserCustomData**: [`UserCustomData`](UserCustomData.md)

### addUserImage

> **addUserImage**: [`User`](User.md)

### addUserToGroupChat?

> `optional` **addUserToGroupChat**: [`Maybe`](Maybe.md)\<[`Chat`](Chat.md)\>

### addUserToUserFamily

> **addUserToUserFamily**: [`UserFamily`](UserFamily.md)

### assignToUserTags?

> `optional` **assignToUserTags**: [`Maybe`](Maybe.md)\<[`UserTag`](UserTag.md)\>

### assignUserTag?

> `optional` **assignUserTag**: [`Maybe`](Maybe.md)\<[`User`](User.md)\>

### blockPluginCreationBySuperadmin

> **blockPluginCreationBySuperadmin**: [`AppUserProfile`](AppUserProfile.md)

### blockUser

> **blockUser**: [`User`](User.md)

### cancelMembershipRequest

> **cancelMembershipRequest**: [`MembershipRequest`](MembershipRequest.md)

### checkIn

> **checkIn**: [`CheckIn`](CheckIn.md)

### checkOut

> **checkOut**: [`CheckOut`](CheckOut.md)

### createActionItem

> **createActionItem**: [`ActionItem`](ActionItem.md)

### createActionItemCategory

> **createActionItemCategory**: [`ActionItemCategory`](ActionItemCategory.md)

### createAdmin

> **createAdmin**: [`CreateAdminPayload`](CreateAdminPayload.md)

### createAdvertisement?

> `optional` **createAdvertisement**: [`Maybe`](Maybe.md)\<[`CreateAdvertisementPayload`](CreateAdvertisementPayload.md)\>

### createAgendaCategory

> **createAgendaCategory**: [`AgendaCategory`](AgendaCategory.md)

### createAgendaItem

> **createAgendaItem**: [`AgendaItem`](AgendaItem.md)

### createAgendaSection

> **createAgendaSection**: [`AgendaSection`](AgendaSection.md)

### createChat?

> `optional` **createChat**: [`Maybe`](Maybe.md)\<[`Chat`](Chat.md)\>

### createComment?

> `optional` **createComment**: [`Maybe`](Maybe.md)\<[`Comment`](Comment.md)\>

### createDonation

> **createDonation**: [`Donation`](Donation.md)

### createEvent

> **createEvent**: [`Event`](Event.md)

### createEventVolunteer

> **createEventVolunteer**: [`EventVolunteer`](EventVolunteer.md)

### createEventVolunteerGroup

> **createEventVolunteerGroup**: [`EventVolunteerGroup`](EventVolunteerGroup.md)

### createFund

> **createFund**: [`Fund`](Fund.md)

### createFundraisingCampaign

> **createFundraisingCampaign**: [`FundraisingCampaign`](FundraisingCampaign.md)

### createFundraisingCampaignPledge

> **createFundraisingCampaignPledge**: [`FundraisingCampaignPledge`](FundraisingCampaignPledge.md)

### createMember

> **createMember**: [`CreateMemberPayload`](CreateMemberPayload.md)

### createNote

> **createNote**: [`Note`](Note.md)

### createOrganization

> **createOrganization**: [`Organization`](Organization.md)

### createPlugin

> **createPlugin**: [`Plugin`](Plugin.md)

### createPost?

> `optional` **createPost**: [`Maybe`](Maybe.md)\<[`Post`](Post.md)\>

### createSampleOrganization

> **createSampleOrganization**: [`Scalars`](Scalars.md)\[`"Boolean"`\]\[`"output"`\]

### createUserFamily

> **createUserFamily**: [`UserFamily`](UserFamily.md)

### createUserTag?

> `optional` **createUserTag**: [`Maybe`](Maybe.md)\<[`UserTag`](UserTag.md)\>

### createVenue?

> `optional` **createVenue**: [`Maybe`](Maybe.md)\<[`Venue`](Venue.md)\>

### createVolunteerMembership

> **createVolunteerMembership**: [`VolunteerMembership`](VolunteerMembership.md)

### deleteAdvertisement?

> `optional` **deleteAdvertisement**: [`Maybe`](Maybe.md)\<[`DeleteAdvertisementPayload`](DeleteAdvertisementPayload.md)\>

### deleteAgendaCategory

> **deleteAgendaCategory**: [`Scalars`](Scalars.md)\[`"ID"`\]\[`"output"`\]

### deleteDonationById

> **deleteDonationById**: [`DeletePayload`](DeletePayload.md)

### deleteNote

> **deleteNote**: [`Scalars`](Scalars.md)\[`"ID"`\]\[`"output"`\]

### deleteVenue?

> `optional` **deleteVenue**: [`Maybe`](Maybe.md)\<[`Venue`](Venue.md)\>

### editVenue?

> `optional` **editVenue**: [`Maybe`](Maybe.md)\<[`Venue`](Venue.md)\>

### forgotPassword

> **forgotPassword**: [`Scalars`](Scalars.md)\[`"Boolean"`\]\[`"output"`\]

### inviteEventAttendee

> **inviteEventAttendee**: [`EventAttendee`](EventAttendee.md)

### joinPublicOrganization

> **joinPublicOrganization**: [`User`](User.md)

### leaveOrganization

> **leaveOrganization**: [`User`](User.md)

### likeComment?

> `optional` **likeComment**: [`Maybe`](Maybe.md)\<[`Comment`](Comment.md)\>

### likePost?

> `optional` **likePost**: [`Maybe`](Maybe.md)\<[`Post`](Post.md)\>

### login

> **login**: [`AuthData`](AuthData.md)

### logout

> **logout**: [`Scalars`](Scalars.md)\[`"Boolean"`\]\[`"output"`\]

### markChatMessagesAsRead

> **markChatMessagesAsRead**: [`Chat`](Chat.md)

### otp

> **otp**: [`OtpData`](OtpData.md)

### recaptcha

> **recaptcha**: [`Scalars`](Scalars.md)\[`"Boolean"`\]\[`"output"`\]

### refreshToken

> **refreshToken**: [`ExtendSession`](ExtendSession.md)

### registerEventAttendee

> **registerEventAttendee**: [`EventAttendee`](EventAttendee.md)

### registerForEvent

> **registerForEvent**: [`EventAttendee`](EventAttendee.md)

### rejectMembershipRequest

> **rejectMembershipRequest**: [`MembershipRequest`](MembershipRequest.md)

### removeActionItem

> **removeActionItem**: [`ActionItem`](ActionItem.md)

### removeAdmin

> **removeAdmin**: [`AppUserProfile`](AppUserProfile.md)

### removeAdvertisement?

> `optional` **removeAdvertisement**: [`Maybe`](Maybe.md)\<[`Advertisement`](Advertisement.md)\>

### removeAgendaItem

> **removeAgendaItem**: [`AgendaItem`](AgendaItem.md)

### removeAgendaSection

> **removeAgendaSection**: [`Scalars`](Scalars.md)\[`"ID"`\]\[`"output"`\]

### removeComment?

> `optional` **removeComment**: [`Maybe`](Maybe.md)\<[`Comment`](Comment.md)\>

### removeEvent

> **removeEvent**: [`Event`](Event.md)

### removeEventAttendee

> **removeEventAttendee**: [`User`](User.md)

### removeEventVolunteer

> **removeEventVolunteer**: [`EventVolunteer`](EventVolunteer.md)

### removeEventVolunteerGroup

> **removeEventVolunteerGroup**: [`EventVolunteerGroup`](EventVolunteerGroup.md)

### removeFromUserTags?

> `optional` **removeFromUserTags**: [`Maybe`](Maybe.md)\<[`UserTag`](UserTag.md)\>

### removeFundraisingCampaignPledge

> **removeFundraisingCampaignPledge**: [`FundraisingCampaignPledge`](FundraisingCampaignPledge.md)

### removeMember

> **removeMember**: [`Organization`](Organization.md)

### removeOrganization

> **removeOrganization**: [`UserData`](UserData.md)

### removeOrganizationCustomField

> **removeOrganizationCustomField**: [`OrganizationCustomField`](OrganizationCustomField.md)

### removeOrganizationImage

> **removeOrganizationImage**: [`Organization`](Organization.md)

### removePost?

> `optional` **removePost**: [`Maybe`](Maybe.md)\<[`Post`](Post.md)\>

### removeSampleOrganization

> **removeSampleOrganization**: [`Scalars`](Scalars.md)\[`"Boolean"`\]\[`"output"`\]

### removeUserCustomData

> **removeUserCustomData**: [`UserCustomData`](UserCustomData.md)

### removeUserFamily

> **removeUserFamily**: [`UserFamily`](UserFamily.md)

### removeUserFromUserFamily

> **removeUserFromUserFamily**: [`UserFamily`](UserFamily.md)

### removeUserImage

> **removeUserImage**: [`User`](User.md)

### removeUserTag?

> `optional` **removeUserTag**: [`Maybe`](Maybe.md)\<[`UserTag`](UserTag.md)\>

### resetCommunity

> **resetCommunity**: [`Scalars`](Scalars.md)\[`"Boolean"`\]\[`"output"`\]

### revokeRefreshTokenForUser

> **revokeRefreshTokenForUser**: [`Scalars`](Scalars.md)\[`"Boolean"`\]\[`"output"`\]

### saveFcmToken

> **saveFcmToken**: [`Scalars`](Scalars.md)\[`"Boolean"`\]\[`"output"`\]

### sendMembershipRequest

> **sendMembershipRequest**: [`MembershipRequest`](MembershipRequest.md)

### sendMessageToChat

> **sendMessageToChat**: [`ChatMessage`](ChatMessage.md)

### signUp

> **signUp**: [`AuthData`](AuthData.md)

### togglePostPin

> **togglePostPin**: [`Post`](Post.md)

### unassignUserTag?

> `optional` **unassignUserTag**: [`Maybe`](Maybe.md)\<[`User`](User.md)\>

### unblockUser

> **unblockUser**: [`User`](User.md)

### unlikeComment?

> `optional` **unlikeComment**: [`Maybe`](Maybe.md)\<[`Comment`](Comment.md)\>

### unlikePost?

> `optional` **unlikePost**: [`Maybe`](Maybe.md)\<[`Post`](Post.md)\>

### unregisterForEventByUser

> **unregisterForEventByUser**: [`Event`](Event.md)

### updateActionItem?

> `optional` **updateActionItem**: [`Maybe`](Maybe.md)\<[`ActionItem`](ActionItem.md)\>

### updateActionItemCategory?

> `optional` **updateActionItemCategory**: [`Maybe`](Maybe.md)\<[`ActionItemCategory`](ActionItemCategory.md)\>

### updateAdvertisement?

> `optional` **updateAdvertisement**: [`Maybe`](Maybe.md)\<[`UpdateAdvertisementPayload`](UpdateAdvertisementPayload.md)\>

### updateAgendaCategory?

> `optional` **updateAgendaCategory**: [`Maybe`](Maybe.md)\<[`AgendaCategory`](AgendaCategory.md)\>

### updateAgendaItem?

> `optional` **updateAgendaItem**: [`Maybe`](Maybe.md)\<[`AgendaItem`](AgendaItem.md)\>

### updateAgendaSection?

> `optional` **updateAgendaSection**: [`Maybe`](Maybe.md)\<[`AgendaSection`](AgendaSection.md)\>

### updateChat

> **updateChat**: [`Chat`](Chat.md)

### updateChatMessage

> **updateChatMessage**: [`ChatMessage`](ChatMessage.md)

### updateCommunity

> **updateCommunity**: [`Scalars`](Scalars.md)\[`"Boolean"`\]\[`"output"`\]

### updateEvent

> **updateEvent**: [`Event`](Event.md)

### updateEventVolunteer

> **updateEventVolunteer**: [`EventVolunteer`](EventVolunteer.md)

### updateEventVolunteerGroup

> **updateEventVolunteerGroup**: [`EventVolunteerGroup`](EventVolunteerGroup.md)

### updateFund

> **updateFund**: [`Fund`](Fund.md)

### updateFundraisingCampaign

> **updateFundraisingCampaign**: [`FundraisingCampaign`](FundraisingCampaign.md)

### updateFundraisingCampaignPledge

> **updateFundraisingCampaignPledge**: [`FundraisingCampaignPledge`](FundraisingCampaignPledge.md)

### updateLanguage

> **updateLanguage**: [`User`](User.md)

### updateNote

> **updateNote**: [`Note`](Note.md)

### updateOrganization

> **updateOrganization**: [`Organization`](Organization.md)

### updatePluginStatus

> **updatePluginStatus**: [`Plugin`](Plugin.md)

### updatePost

> **updatePost**: [`Post`](Post.md)

### updateSessionTimeout

> **updateSessionTimeout**: [`Scalars`](Scalars.md)\[`"Boolean"`\]\[`"output"`\]

### updateUserPassword

> **updateUserPassword**: [`UserData`](UserData.md)

### updateUserProfile

> **updateUserProfile**: [`User`](User.md)

### updateUserRoleInOrganization

> **updateUserRoleInOrganization**: [`Organization`](Organization.md)

### updateUserTag?

> `optional` **updateUserTag**: [`Maybe`](Maybe.md)\<[`UserTag`](UserTag.md)\>

### updateVolunteerMembership

> **updateVolunteerMembership**: [`VolunteerMembership`](VolunteerMembership.md)

## Defined in

[src/types/generatedGraphQLTypes.ts:1225](https://github.com/Suyash878/talawa-api/blob/e4413cec641a837926071678fed3c7f67234e31e/src/types/generatedGraphQLTypes.ts#L1225)
