[**talawa-api**](../../../README.md)

***

# Type Alias: ResolversParentTypes

> **ResolversParentTypes**: `object`

Mapping between all available schema types and the resolvers parents

## Type declaration

### ActionItem

> **ActionItem**: [`InterfaceActionItem`](../../../models/ActionItem/interfaces/InterfaceActionItem.md)

### ActionItemCategory

> **ActionItemCategory**: [`InterfaceActionItemCategory`](../../../models/ActionItemCategory/interfaces/InterfaceActionItemCategory.md)

### ActionItemCategoryWhereInput

> **ActionItemCategoryWhereInput**: [`ActionItemCategoryWhereInput`](ActionItemCategoryWhereInput.md)

### ActionItemWhereInput

> **ActionItemWhereInput**: [`ActionItemWhereInput`](ActionItemWhereInput.md)

### AddPeopleToUserTagInput

> **AddPeopleToUserTagInput**: [`AddPeopleToUserTagInput`](AddPeopleToUserTagInput.md)

### Address

> **Address**: [`Address`](Address.md)

### AddressInput

> **AddressInput**: [`AddressInput`](AddressInput.md)

### Advertisement

> **Advertisement**: [`InterfaceAdvertisement`](../../../models/Advertisement/interfaces/InterfaceAdvertisement.md)

### AdvertisementEdge

> **AdvertisementEdge**: [`Omit`](Omit.md)\<[`AdvertisementEdge`](AdvertisementEdge.md), `"node"`\> & `object`

#### Type declaration

##### node?

> `optional` **node**: [`Maybe`](Maybe.md)\<[`ResolversParentTypes`](ResolversParentTypes.md)\[`"Advertisement"`\]\>

### AdvertisementsConnection

> **AdvertisementsConnection**: [`Omit`](Omit.md)\<[`AdvertisementsConnection`](AdvertisementsConnection.md), `"edges"`\> & `object`

#### Type declaration

##### edges?

> `optional` **edges**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`ResolversParentTypes`](ResolversParentTypes.md)\[`"AdvertisementEdge"`\]\>[]\>

### AgendaCategory

> **AgendaCategory**: [`InterfaceAgendaCategory`](../../../models/AgendaCategory/interfaces/InterfaceAgendaCategory.md)

### AgendaItem

> **AgendaItem**: [`InterfaceAgendaItem`](../../../models/AgendaItem/interfaces/InterfaceAgendaItem.md)

### AgendaItemCategoryWhereInput

> **AgendaItemCategoryWhereInput**: [`AgendaItemCategoryWhereInput`](AgendaItemCategoryWhereInput.md)

### AgendaSection

> **AgendaSection**: [`InterfaceAgendaSection`](../../../models/AgendaSection/interfaces/InterfaceAgendaSection.md)

### AggregatePost

> **AggregatePost**: [`AggregatePost`](AggregatePost.md)

### AggregateUser

> **AggregateUser**: [`AggregateUser`](AggregateUser.md)

### Any

> **Any**: [`Scalars`](Scalars.md)\[`"Any"`\]\[`"output"`\]

### AppUserProfile

> **AppUserProfile**: [`InterfaceAppUserProfile`](../../../models/AppUserProfile/interfaces/InterfaceAppUserProfile.md)

### AuthData

> **AuthData**: [`Omit`](Omit.md)\<[`AuthData`](AuthData.md), `"appUserProfile"` \| `"user"`\> & `object`

#### Type declaration

##### appUserProfile

> **appUserProfile**: [`ResolversParentTypes`](ResolversParentTypes.md)\[`"AppUserProfile"`\]

##### user

> **user**: [`ResolversParentTypes`](ResolversParentTypes.md)\[`"User"`\]

### Boolean

> **Boolean**: [`Scalars`](Scalars.md)\[`"Boolean"`\]\[`"output"`\]

### CampaignWhereInput

> **CampaignWhereInput**: [`CampaignWhereInput`](CampaignWhereInput.md)

### Chat

> **Chat**: [`InterfaceChat`](../../../models/Chat/interfaces/InterfaceChat.md)

### chatInput

> **chatInput**: [`ChatInput`](ChatInput.md)

### ChatMessage

> **ChatMessage**: [`InterfaceChatMessage`](../../../models/ChatMessage/interfaces/InterfaceChatMessage.md)

### ChatWhereInput

> **ChatWhereInput**: [`ChatWhereInput`](ChatWhereInput.md)

### CheckIn

> **CheckIn**: [`InterfaceCheckIn`](../../../models/CheckIn/interfaces/InterfaceCheckIn.md)

### CheckInCheckOutInput

> **CheckInCheckOutInput**: [`CheckInCheckOutInput`](CheckInCheckOutInput.md)

### CheckInStatus

> **CheckInStatus**: [`Omit`](Omit.md)\<[`CheckInStatus`](CheckInStatus.md), `"checkIn"` \| `"user"`\> & `object`

#### Type declaration

##### checkIn?

> `optional` **checkIn**: [`Maybe`](Maybe.md)\<[`ResolversParentTypes`](ResolversParentTypes.md)\[`"CheckIn"`\]\>

##### user

> **user**: [`ResolversParentTypes`](ResolversParentTypes.md)\[`"User"`\]

### CheckOut

> **CheckOut**: [`CheckOut`](CheckOut.md)

### Comment

> **Comment**: [`InterfaceComment`](../../../models/Comment/interfaces/InterfaceComment.md)

### CommentInput

> **CommentInput**: [`CommentInput`](CommentInput.md)

### Community

> **Community**: [`InterfaceCommunity`](../../../models/Community/interfaces/InterfaceCommunity.md)

### ConnectionError

> **ConnectionError**: [`ResolversUnionTypes`](ResolversUnionTypes.md)\<[`ResolversParentTypes`](ResolversParentTypes.md)\>\[`"ConnectionError"`\]

### ConnectionPageInfo

> **ConnectionPageInfo**: [`ResolversInterfaceTypes`](ResolversInterfaceTypes.md)\<[`ResolversParentTypes`](ResolversParentTypes.md)\>\[`"ConnectionPageInfo"`\]

### CountryCode

> **CountryCode**: [`Scalars`](Scalars.md)\[`"CountryCode"`\]\[`"output"`\]

### CreateActionItemInput

> **CreateActionItemInput**: [`CreateActionItemInput`](CreateActionItemInput.md)

### CreateAdminError

> **CreateAdminError**: [`ResolversUnionTypes`](ResolversUnionTypes.md)\<[`ResolversParentTypes`](ResolversParentTypes.md)\>\[`"CreateAdminError"`\]

### CreateAdminPayload

> **CreateAdminPayload**: [`Omit`](Omit.md)\<[`CreateAdminPayload`](CreateAdminPayload.md), `"user"` \| `"userErrors"`\> & `object`

#### Type declaration

##### user?

> `optional` **user**: [`Maybe`](Maybe.md)\<[`ResolversParentTypes`](ResolversParentTypes.md)\[`"AppUserProfile"`\]\>

##### userErrors

> **userErrors**: [`ResolversParentTypes`](ResolversParentTypes.md)\[`"CreateAdminError"`\][]

### CreateAdvertisementInput

> **CreateAdvertisementInput**: [`CreateAdvertisementInput`](CreateAdvertisementInput.md)

### CreateAdvertisementPayload

> **CreateAdvertisementPayload**: [`Omit`](Omit.md)\<[`CreateAdvertisementPayload`](CreateAdvertisementPayload.md), `"advertisement"`\> & `object`

#### Type declaration

##### advertisement?

> `optional` **advertisement**: [`Maybe`](Maybe.md)\<[`ResolversParentTypes`](ResolversParentTypes.md)\[`"Advertisement"`\]\>

### CreateAgendaCategoryInput

> **CreateAgendaCategoryInput**: [`CreateAgendaCategoryInput`](CreateAgendaCategoryInput.md)

### CreateAgendaItemInput

> **CreateAgendaItemInput**: [`CreateAgendaItemInput`](CreateAgendaItemInput.md)

### CreateAgendaSectionInput

> **CreateAgendaSectionInput**: [`CreateAgendaSectionInput`](CreateAgendaSectionInput.md)

### CreateCommentError

> **CreateCommentError**: [`ResolversUnionTypes`](ResolversUnionTypes.md)\<[`ResolversParentTypes`](ResolversParentTypes.md)\>\[`"CreateCommentError"`\]

### CreateCommentPayload

> **CreateCommentPayload**: [`Omit`](Omit.md)\<[`CreateCommentPayload`](CreateCommentPayload.md), `"comment"` \| `"userErrors"`\> & `object`

#### Type declaration

##### comment?

> `optional` **comment**: [`Maybe`](Maybe.md)\<[`ResolversParentTypes`](ResolversParentTypes.md)\[`"Comment"`\]\>

##### userErrors

> **userErrors**: [`ResolversParentTypes`](ResolversParentTypes.md)\[`"CreateCommentError"`\][]

### createGroupChatInput

> **createGroupChatInput**: [`CreateGroupChatInput`](CreateGroupChatInput.md)

### CreateMemberError

> **CreateMemberError**: [`ResolversUnionTypes`](ResolversUnionTypes.md)\<[`ResolversParentTypes`](ResolversParentTypes.md)\>\[`"CreateMemberError"`\]

### CreateMemberPayload

> **CreateMemberPayload**: [`Omit`](Omit.md)\<[`CreateMemberPayload`](CreateMemberPayload.md), `"organization"` \| `"userErrors"`\> & `object`

#### Type declaration

##### organization?

> `optional` **organization**: [`Maybe`](Maybe.md)\<[`ResolversParentTypes`](ResolversParentTypes.md)\[`"Organization"`\]\>

##### userErrors

> **userErrors**: [`ResolversParentTypes`](ResolversParentTypes.md)\[`"CreateMemberError"`\][]

### createUserFamilyInput

> **createUserFamilyInput**: [`CreateUserFamilyInput`](CreateUserFamilyInput.md)

### CreateUserTagInput

> **CreateUserTagInput**: [`CreateUserTagInput`](CreateUserTagInput.md)

### CursorPaginationInput

> **CursorPaginationInput**: [`CursorPaginationInput`](CursorPaginationInput.md)

### Date

> **Date**: [`Scalars`](Scalars.md)\[`"Date"`\]\[`"output"`\]

### DateTime

> **DateTime**: [`Scalars`](Scalars.md)\[`"DateTime"`\]\[`"output"`\]

### DefaultConnectionPageInfo

> **DefaultConnectionPageInfo**: [`DefaultConnectionPageInfo`](DefaultConnectionPageInfo.md)

### DeleteAdvertisementPayload

> **DeleteAdvertisementPayload**: [`Omit`](Omit.md)\<[`DeleteAdvertisementPayload`](DeleteAdvertisementPayload.md), `"advertisement"`\> & `object`

#### Type declaration

##### advertisement?

> `optional` **advertisement**: [`Maybe`](Maybe.md)\<[`ResolversParentTypes`](ResolversParentTypes.md)\[`"Advertisement"`\]\>

### DeletePayload

> **DeletePayload**: [`DeletePayload`](DeletePayload.md)

### Donation

> **Donation**: [`InterfaceDonation`](../../../models/Donation/interfaces/InterfaceDonation.md)

### DonationWhereInput

> **DonationWhereInput**: [`DonationWhereInput`](DonationWhereInput.md)

### EditVenueInput

> **EditVenueInput**: [`EditVenueInput`](EditVenueInput.md)

### EmailAddress

> **EmailAddress**: [`Scalars`](Scalars.md)\[`"EmailAddress"`\]\[`"output"`\]

### Error

> **Error**: [`ResolversInterfaceTypes`](ResolversInterfaceTypes.md)\<[`ResolversParentTypes`](ResolversParentTypes.md)\>\[`"Error"`\]

### Event

> **Event**: [`InterfaceEvent`](../../../models/Event/interfaces/InterfaceEvent.md)

### EventAttendee

> **EventAttendee**: [`InterfaceEventAttendee`](../../../models/EventAttendee/interfaces/InterfaceEventAttendee.md)

### EventAttendeeInput

> **EventAttendeeInput**: [`EventAttendeeInput`](EventAttendeeInput.md)

### EventInput

> **EventInput**: [`EventInput`](EventInput.md)

### EventVolunteer

> **EventVolunteer**: [`InterfaceEventVolunteer`](../../../models/EventVolunteer/interfaces/InterfaceEventVolunteer.md)

### EventVolunteerGroup

> **EventVolunteerGroup**: [`InterfaceEventVolunteerGroup`](../../../models/EventVolunteerGroup/interfaces/InterfaceEventVolunteerGroup.md)

### EventVolunteerGroupInput

> **EventVolunteerGroupInput**: [`EventVolunteerGroupInput`](EventVolunteerGroupInput.md)

### EventVolunteerGroupWhereInput

> **EventVolunteerGroupWhereInput**: [`EventVolunteerGroupWhereInput`](EventVolunteerGroupWhereInput.md)

### EventVolunteerInput

> **EventVolunteerInput**: [`EventVolunteerInput`](EventVolunteerInput.md)

### EventVolunteerWhereInput

> **EventVolunteerWhereInput**: [`EventVolunteerWhereInput`](EventVolunteerWhereInput.md)

### EventWhereInput

> **EventWhereInput**: [`EventWhereInput`](EventWhereInput.md)

### ExtendSession

> **ExtendSession**: [`ExtendSession`](ExtendSession.md)

### Feedback

> **Feedback**: [`InterfaceFeedback`](../../../models/Feedback/interfaces/InterfaceFeedback.md)

### FeedbackInput

> **FeedbackInput**: [`FeedbackInput`](FeedbackInput.md)

### FieldError

> **FieldError**: [`ResolversInterfaceTypes`](ResolversInterfaceTypes.md)\<[`ResolversParentTypes`](ResolversParentTypes.md)\>\[`"FieldError"`\]

### File

> **File**: [`File`](File.md)

### FileMetadata

> **FileMetadata**: [`FileMetadata`](FileMetadata.md)

### Float

> **Float**: [`Scalars`](Scalars.md)\[`"Float"`\]\[`"output"`\]

### ForgotPasswordData

> **ForgotPasswordData**: [`ForgotPasswordData`](ForgotPasswordData.md)

### Fund

> **Fund**: [`InterfaceFund`](../../../models/Fund/interfaces/InterfaceFund.md)

### FundCampaignInput

> **FundCampaignInput**: [`FundCampaignInput`](FundCampaignInput.md)

### FundCampaignPledgeInput

> **FundCampaignPledgeInput**: [`FundCampaignPledgeInput`](FundCampaignPledgeInput.md)

### FundInput

> **FundInput**: [`FundInput`](FundInput.md)

### FundraisingCampaign

> **FundraisingCampaign**: [`InterfaceFundraisingCampaign`](../../../models/FundraisingCampaign/interfaces/InterfaceFundraisingCampaign.md)

### FundraisingCampaignPledge

> **FundraisingCampaignPledge**: [`InterfaceFundraisingCampaignPledges`](../../../models/FundraisingCampaignPledge/interfaces/InterfaceFundraisingCampaignPledges.md)

### FundWhereInput

> **FundWhereInput**: [`FundWhereInput`](FundWhereInput.md)

### Group

> **Group**: [`InterfaceGroup`](../../../models/Group/interfaces/InterfaceGroup.md)

### Hash

> **Hash**: [`Hash`](Hash.md)

### HoursHistory

> **HoursHistory**: [`HoursHistory`](HoursHistory.md)

### ID

> **ID**: [`Scalars`](Scalars.md)\[`"ID"`\]\[`"output"`\]

### Int

> **Int**: [`Scalars`](Scalars.md)\[`"Int"`\]\[`"output"`\]

### InvalidCursor

> **InvalidCursor**: [`InvalidCursor`](InvalidCursor.md)

### JSON

> **JSON**: [`Scalars`](Scalars.md)\[`"JSON"`\]\[`"output"`\]

### Language

> **Language**: [`InterfaceLanguage`](../../../models/Language/interfaces/InterfaceLanguage.md)

### LanguageInput

> **LanguageInput**: [`LanguageInput`](LanguageInput.md)

### LanguageModel

> **LanguageModel**: [`LanguageModel`](LanguageModel.md)

### Latitude

> **Latitude**: [`Scalars`](Scalars.md)\[`"Latitude"`\]\[`"output"`\]

### LoginInput

> **LoginInput**: [`LoginInput`](LoginInput.md)

### Longitude

> **Longitude**: [`Scalars`](Scalars.md)\[`"Longitude"`\]\[`"output"`\]

### MaximumLengthError

> **MaximumLengthError**: [`MaximumLengthError`](MaximumLengthError.md)

### MaximumValueError

> **MaximumValueError**: [`MaximumValueError`](MaximumValueError.md)

### MemberNotFoundError

> **MemberNotFoundError**: [`MemberNotFoundError`](MemberNotFoundError.md)

### MembershipRequest

> **MembershipRequest**: [`InterfaceMembershipRequest`](../../../models/MembershipRequest/interfaces/InterfaceMembershipRequest.md)

### MembershipRequestsWhereInput

> **MembershipRequestsWhereInput**: [`MembershipRequestsWhereInput`](MembershipRequestsWhereInput.md)

### Message

> **Message**: [`InterfaceMessage`](../../../models/Message/interfaces/InterfaceMessage.md)

### MinimumLengthError

> **MinimumLengthError**: [`MinimumLengthError`](MinimumLengthError.md)

### MinimumValueError

> **MinimumValueError**: [`MinimumValueError`](MinimumValueError.md)

### Mutation

> **Mutation**: `object`

### Note

> **Note**: [`InterfaceNote`](../../../models/Note/interfaces/InterfaceNote.md)

### NoteInput

> **NoteInput**: [`NoteInput`](NoteInput.md)

### Organization

> **Organization**: [`InterfaceOrganization`](../../../models/Organization/interfaces/InterfaceOrganization.md)

### OrganizationCustomField

> **OrganizationCustomField**: [`OrganizationCustomField`](OrganizationCustomField.md)

### OrganizationInfoNode

> **OrganizationInfoNode**: [`Omit`](Omit.md)\<[`OrganizationInfoNode`](OrganizationInfoNode.md), `"creator"`\> & `object`

#### Type declaration

##### creator?

> `optional` **creator**: [`Maybe`](Maybe.md)\<[`ResolversParentTypes`](ResolversParentTypes.md)\[`"User"`\]\>

### OrganizationInput

> **OrganizationInput**: [`OrganizationInput`](OrganizationInput.md)

### OrganizationMemberNotFoundError

> **OrganizationMemberNotFoundError**: [`OrganizationMemberNotFoundError`](OrganizationMemberNotFoundError.md)

### OrganizationNotFoundError

> **OrganizationNotFoundError**: [`OrganizationNotFoundError`](OrganizationNotFoundError.md)

### OrganizationWhereInput

> **OrganizationWhereInput**: [`OrganizationWhereInput`](OrganizationWhereInput.md)

### OtpData

> **OtpData**: [`OtpData`](OtpData.md)

### OTPInput

> **OTPInput**: [`OtpInput`](OtpInput.md)

### PageInfo

> **PageInfo**: [`PageInfo`](PageInfo.md)

### PhoneNumber

> **PhoneNumber**: [`Scalars`](Scalars.md)\[`"PhoneNumber"`\]\[`"output"`\]

### PledgeWhereInput

> **PledgeWhereInput**: [`PledgeWhereInput`](PledgeWhereInput.md)

### Plugin

> **Plugin**: [`InterfacePlugin`](../../../models/Plugin/interfaces/InterfacePlugin.md)

### PluginField

> **PluginField**: [`InterfacePluginField`](../../../models/PluginField/interfaces/InterfacePluginField.md)

### PluginFieldInput

> **PluginFieldInput**: [`PluginFieldInput`](PluginFieldInput.md)

### PluginInput

> **PluginInput**: [`PluginInput`](PluginInput.md)

### PositiveInt

> **PositiveInt**: [`Scalars`](Scalars.md)\[`"PositiveInt"`\]\[`"output"`\]

### Post

> **Post**: [`InterfacePost`](../../../models/Post/interfaces/InterfacePost.md)

### PostEdge

> **PostEdge**: [`Omit`](Omit.md)\<[`PostEdge`](PostEdge.md), `"node"`\> & `object`

#### Type declaration

##### node

> **node**: [`ResolversParentTypes`](ResolversParentTypes.md)\[`"Post"`\]

### PostInput

> **PostInput**: [`PostInput`](PostInput.md)

### PostNotFoundError

> **PostNotFoundError**: [`PostNotFoundError`](PostNotFoundError.md)

### PostsConnection

> **PostsConnection**: [`Omit`](Omit.md)\<[`PostsConnection`](PostsConnection.md), `"edges"`\> & `object`

#### Type declaration

##### edges

> **edges**: [`ResolversParentTypes`](ResolversParentTypes.md)\[`"PostEdge"`\][]

### PostUpdateInput

> **PostUpdateInput**: [`PostUpdateInput`](PostUpdateInput.md)

### PostWhereInput

> **PostWhereInput**: [`PostWhereInput`](PostWhereInput.md)

### Query

> **Query**: `object`

### RecaptchaVerification

> **RecaptchaVerification**: [`RecaptchaVerification`](RecaptchaVerification.md)

### RecurrenceRule

> **RecurrenceRule**: [`InterfaceRecurrenceRule`](../../../models/RecurrenceRule/interfaces/InterfaceRecurrenceRule.md)

### RecurrenceRuleInput

> **RecurrenceRuleInput**: [`RecurrenceRuleInput`](RecurrenceRuleInput.md)

### SocialMediaUrls

> **SocialMediaUrls**: [`SocialMediaUrls`](SocialMediaUrls.md)

### SocialMediaUrlsInput

> **SocialMediaUrlsInput**: [`SocialMediaUrlsInput`](SocialMediaUrlsInput.md)

### String

> **String**: [`Scalars`](Scalars.md)\[`"String"`\]\[`"output"`\]

### Subscription

> **Subscription**: `object`

### TagActionsInput

> **TagActionsInput**: [`TagActionsInput`](TagActionsInput.md)

### Time

> **Time**: [`Scalars`](Scalars.md)\[`"Time"`\]\[`"output"`\]

### ToggleUserTagAssignInput

> **ToggleUserTagAssignInput**: [`ToggleUserTagAssignInput`](ToggleUserTagAssignInput.md)

### Translation

> **Translation**: [`Translation`](Translation.md)

### UnauthenticatedError

> **UnauthenticatedError**: [`UnauthenticatedError`](UnauthenticatedError.md)

### UnauthorizedError

> **UnauthorizedError**: [`UnauthorizedError`](UnauthorizedError.md)

### UpdateActionItemCategoryInput

> **UpdateActionItemCategoryInput**: [`UpdateActionItemCategoryInput`](UpdateActionItemCategoryInput.md)

### UpdateActionItemInput

> **UpdateActionItemInput**: [`UpdateActionItemInput`](UpdateActionItemInput.md)

### UpdateAdvertisementInput

> **UpdateAdvertisementInput**: [`UpdateAdvertisementInput`](UpdateAdvertisementInput.md)

### UpdateAdvertisementPayload

> **UpdateAdvertisementPayload**: [`Omit`](Omit.md)\<[`UpdateAdvertisementPayload`](UpdateAdvertisementPayload.md), `"advertisement"`\> & `object`

#### Type declaration

##### advertisement?

> `optional` **advertisement**: [`Maybe`](Maybe.md)\<[`ResolversParentTypes`](ResolversParentTypes.md)\[`"Advertisement"`\]\>

### UpdateAgendaCategoryInput

> **UpdateAgendaCategoryInput**: [`UpdateAgendaCategoryInput`](UpdateAgendaCategoryInput.md)

### UpdateAgendaItemInput

> **UpdateAgendaItemInput**: [`UpdateAgendaItemInput`](UpdateAgendaItemInput.md)

### UpdateAgendaSectionInput

> **UpdateAgendaSectionInput**: [`UpdateAgendaSectionInput`](UpdateAgendaSectionInput.md)

### UpdateChatInput

> **UpdateChatInput**: [`UpdateChatInput`](UpdateChatInput.md)

### UpdateChatMessageInput

> **UpdateChatMessageInput**: [`UpdateChatMessageInput`](UpdateChatMessageInput.md)

### UpdateCommunityInput

> **UpdateCommunityInput**: [`UpdateCommunityInput`](UpdateCommunityInput.md)

### UpdateEventInput

> **UpdateEventInput**: [`UpdateEventInput`](UpdateEventInput.md)

### UpdateEventVolunteerGroupInput

> **UpdateEventVolunteerGroupInput**: [`UpdateEventVolunteerGroupInput`](UpdateEventVolunteerGroupInput.md)

### UpdateEventVolunteerInput

> **UpdateEventVolunteerInput**: [`UpdateEventVolunteerInput`](UpdateEventVolunteerInput.md)

### UpdateFundCampaignInput

> **UpdateFundCampaignInput**: [`UpdateFundCampaignInput`](UpdateFundCampaignInput.md)

### UpdateFundCampaignPledgeInput

> **UpdateFundCampaignPledgeInput**: [`UpdateFundCampaignPledgeInput`](UpdateFundCampaignPledgeInput.md)

### UpdateFundInput

> **UpdateFundInput**: [`UpdateFundInput`](UpdateFundInput.md)

### UpdateNoteInput

> **UpdateNoteInput**: [`UpdateNoteInput`](UpdateNoteInput.md)

### UpdateOrganizationInput

> **UpdateOrganizationInput**: [`UpdateOrganizationInput`](UpdateOrganizationInput.md)

### UpdateUserInput

> **UpdateUserInput**: [`UpdateUserInput`](UpdateUserInput.md)

### UpdateUserPasswordInput

> **UpdateUserPasswordInput**: [`UpdateUserPasswordInput`](UpdateUserPasswordInput.md)

### UpdateUserTagInput

> **UpdateUserTagInput**: [`UpdateUserTagInput`](UpdateUserTagInput.md)

### Upload

> **Upload**: [`Scalars`](Scalars.md)\[`"Upload"`\]\[`"output"`\]

### URL

> **URL**: [`Scalars`](Scalars.md)\[`"URL"`\]\[`"output"`\]

### User

> **User**: [`InterfaceUser`](../../../models/User/interfaces/InterfaceUser.md)

### UserAndOrganizationInput

> **UserAndOrganizationInput**: [`UserAndOrganizationInput`](UserAndOrganizationInput.md)

### UserConnection

> **UserConnection**: [`Omit`](Omit.md)\<[`UserConnection`](UserConnection.md), `"edges"`\> & `object`

#### Type declaration

##### edges

> **edges**: [`Maybe`](Maybe.md)\<[`ResolversParentTypes`](ResolversParentTypes.md)\[`"User"`\]\>[]

### UserCustomData

> **UserCustomData**: [`UserCustomData`](UserCustomData.md)

### UserData

> **UserData**: [`Omit`](Omit.md)\<[`UserData`](UserData.md), `"appUserProfile"` \| `"user"`\> & `object`

#### Type declaration

##### appUserProfile?

> `optional` **appUserProfile**: [`Maybe`](Maybe.md)\<[`ResolversParentTypes`](ResolversParentTypes.md)\[`"AppUserProfile"`\]\>

##### user

> **user**: [`ResolversParentTypes`](ResolversParentTypes.md)\[`"User"`\]

### UserFamily

> **UserFamily**: [`InterfaceUserFamily`](../../../models/userFamily/interfaces/InterfaceUserFamily.md)

### UserInput

> **UserInput**: [`UserInput`](UserInput.md)

### UserNameWhereInput

> **UserNameWhereInput**: [`UserNameWhereInput`](UserNameWhereInput.md)

### UserNotAuthorizedAdminError

> **UserNotAuthorizedAdminError**: [`UserNotAuthorizedAdminError`](UserNotAuthorizedAdminError.md)

### UserNotAuthorizedError

> **UserNotAuthorizedError**: [`UserNotAuthorizedError`](UserNotAuthorizedError.md)

### UserNotFoundError

> **UserNotFoundError**: [`UserNotFoundError`](UserNotFoundError.md)

### UserPhone

> **UserPhone**: [`UserPhone`](UserPhone.md)

### UserPhoneInput

> **UserPhoneInput**: [`UserPhoneInput`](UserPhoneInput.md)

### UsersConnection

> **UsersConnection**: [`Omit`](Omit.md)\<[`UsersConnection`](UsersConnection.md), `"edges"`\> & `object`

#### Type declaration

##### edges

> **edges**: [`ResolversParentTypes`](ResolversParentTypes.md)\[`"UsersConnectionEdge"`\][]

### UsersConnectionEdge

> **UsersConnectionEdge**: [`Omit`](Omit.md)\<[`UsersConnectionEdge`](UsersConnectionEdge.md), `"node"`\> & `object`

#### Type declaration

##### node

> **node**: [`ResolversParentTypes`](ResolversParentTypes.md)\[`"User"`\]

### UserTag

> **UserTag**: [`InterfaceOrganizationTagUser`](../../../models/OrganizationTagUser/interfaces/InterfaceOrganizationTagUser.md)

### UserTagNameWhereInput

> **UserTagNameWhereInput**: [`UserTagNameWhereInput`](UserTagNameWhereInput.md)

### UserTagsConnection

> **UserTagsConnection**: [`Omit`](Omit.md)\<[`UserTagsConnection`](UserTagsConnection.md), `"edges"`\> & `object`

#### Type declaration

##### edges

> **edges**: [`ResolversParentTypes`](ResolversParentTypes.md)\[`"UserTagsConnectionEdge"`\][]

### UserTagsConnectionEdge

> **UserTagsConnectionEdge**: [`Omit`](Omit.md)\<[`UserTagsConnectionEdge`](UserTagsConnectionEdge.md), `"node"`\> & `object`

#### Type declaration

##### node

> **node**: [`ResolversParentTypes`](ResolversParentTypes.md)\[`"UserTag"`\]

### UserTagSortedByInput

> **UserTagSortedByInput**: [`UserTagSortedByInput`](UserTagSortedByInput.md)

### UserTagUsersAssignedToSortedByInput

> **UserTagUsersAssignedToSortedByInput**: [`UserTagUsersAssignedToSortedByInput`](UserTagUsersAssignedToSortedByInput.md)

### UserTagUsersAssignedToWhereInput

> **UserTagUsersAssignedToWhereInput**: [`UserTagUsersAssignedToWhereInput`](UserTagUsersAssignedToWhereInput.md)

### UserTagUsersToAssignToWhereInput

> **UserTagUsersToAssignToWhereInput**: [`UserTagUsersToAssignToWhereInput`](UserTagUsersToAssignToWhereInput.md)

### UserTagWhereInput

> **UserTagWhereInput**: [`UserTagWhereInput`](UserTagWhereInput.md)

### UserWhereInput

> **UserWhereInput**: [`UserWhereInput`](UserWhereInput.md)

### Venue

> **Venue**: [`InterfaceVenue`](../../../models/Venue/interfaces/InterfaceVenue.md)

### VenueInput

> **VenueInput**: [`VenueInput`](VenueInput.md)

### VenueWhereInput

> **VenueWhereInput**: [`VenueWhereInput`](VenueWhereInput.md)

### VolunteerMembership

> **VolunteerMembership**: [`InterfaceVolunteerMembership`](../../../models/VolunteerMembership/interfaces/InterfaceVolunteerMembership.md)

### VolunteerMembershipInput

> **VolunteerMembershipInput**: [`VolunteerMembershipInput`](VolunteerMembershipInput.md)

### VolunteerMembershipWhereInput

> **VolunteerMembershipWhereInput**: [`VolunteerMembershipWhereInput`](VolunteerMembershipWhereInput.md)

### VolunteerRank

> **VolunteerRank**: [`Omit`](Omit.md)\<[`VolunteerRank`](VolunteerRank.md), `"user"`\> & `object`

#### Type declaration

##### user

> **user**: [`ResolversParentTypes`](ResolversParentTypes.md)\[`"User"`\]

### VolunteerRankWhereInput

> **VolunteerRankWhereInput**: [`VolunteerRankWhereInput`](VolunteerRankWhereInput.md)

## Defined in

[src/types/generatedGraphQLTypes.ts:3741](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/types/generatedGraphQLTypes.ts#L3741)
