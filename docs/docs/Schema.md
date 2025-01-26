# Schema Types

<details>
  <summary><strong>Table of Contents</strong></summary>

  * [Query](#query)
  * [Mutation](#mutation)
  * [Objects](#objects)
    * [ActionItem](#objects-actionitem)
    * [ActionItemCategory](#objects-actionitemcategory)
    * [Address](#objects-address)
    * [Advertisement](#objects-advertisement)
    * [AdvertisementEdge](#objects-advertisementedge)
    * [AdvertisementsConnection](#objects-advertisementsconnection)
    * [AgendaCategory](#objects-agendacategory)
    * [AgendaItem](#objects-agendaitem)
    * [AgendaSection](#objects-agendasection)
    * [AggregatePost](#objects-aggregatepost)
    * [AggregateUser](#objects-aggregateuser)
    * [AppUserProfile](#objects-appuserprofile)
    * [AuthData](#objects-authdata)
    * [Chat](#objects-chat)
    * [ChatMessage](#objects-chatmessage)
    * [CheckIn](#objects-checkin)
    * [CheckInStatus](#objects-checkinstatus)
    * [CheckOut](#objects-checkout)
    * [Comment](#objects-comment)
    * [Community](#objects-community)
    * [CreateAdminPayload](#objects-createadminpayload)
    * [CreateAdvertisementPayload](#objects-createadvertisementpayload)
    * [CreateCommentPayload](#objects-createcommentpayload)
    * [CreateMemberPayload](#objects-creatememberpayload)
    * [DefaultConnectionPageInfo](#objects-defaultconnectionpageinfo)
    * [DeleteAdvertisementPayload](#objects-deleteadvertisementpayload)
    * [DeletePayload](#objects-deletepayload)
    * [Donation](#objects-donation)
    * [Event](#objects-event)
    * [EventAttendee](#objects-eventattendee)
    * [EventVolunteer](#objects-eventvolunteer)
    * [EventVolunteerGroup](#objects-eventvolunteergroup)
    * [ExtendSession](#objects-extendsession)
    * [Feedback](#objects-feedback)
    * [File](#objects-file)
    * [FileMetadata](#objects-filemetadata)
    * [Fund](#objects-fund)
    * [FundraisingCampaign](#objects-fundraisingcampaign)
    * [FundraisingCampaignPledge](#objects-fundraisingcampaignpledge)
    * [Group](#objects-group)
    * [Hash](#objects-hash)
    * [HoursHistory](#objects-hourshistory)
    * [InvalidCursor](#objects-invalidcursor)
    * [Language](#objects-language)
    * [LanguageModel](#objects-languagemodel)
    * [MaximumLengthError](#objects-maximumlengtherror)
    * [MaximumValueError](#objects-maximumvalueerror)
    * [MemberNotFoundError](#objects-membernotfounderror)
    * [MembershipRequest](#objects-membershiprequest)
    * [Message](#objects-message)
    * [MinimumLengthError](#objects-minimumlengtherror)
    * [MinimumValueError](#objects-minimumvalueerror)
    * [Note](#objects-note)
    * [Organization](#objects-organization)
    * [OrganizationCustomField](#objects-organizationcustomfield)
    * [OrganizationInfoNode](#objects-organizationinfonode)
    * [OrganizationMemberNotFoundError](#objects-organizationmembernotfounderror)
    * [OrganizationNotFoundError](#objects-organizationnotfounderror)
    * [OtpData](#objects-otpdata)
    * [PageInfo](#objects-pageinfo)
    * [Plugin](#objects-plugin)
    * [PluginField](#objects-pluginfield)
    * [Post](#objects-post)
    * [PostEdge](#objects-postedge)
    * [PostNotFoundError](#objects-postnotfounderror)
    * [PostsConnection](#objects-postsconnection)
    * [RecurrenceRule](#objects-recurrencerule)
    * [SocialMediaUrls](#objects-socialmediaurls)
    * [Subscription](#objects-subscription)
    * [Translation](#objects-translation)
    * [UnauthenticatedError](#objects-unauthenticatederror)
    * [UnauthorizedError](#objects-unauthorizederror)
    * [UpdateAdvertisementPayload](#objects-updateadvertisementpayload)
    * [User](#objects-user)
    * [UserConnection](#objects-userconnection)
    * [UserCustomData](#objects-usercustomdata)
    * [UserData](#objects-userdata)
    * [UserFamily](#objects-userfamily)
    * [UserNotAuthorizedAdminError](#objects-usernotauthorizedadminerror)
    * [UserNotAuthorizedError](#objects-usernotauthorizederror)
    * [UserNotFoundError](#objects-usernotfounderror)
    * [UserPhone](#objects-userphone)
    * [UserTag](#objects-usertag)
    * [UserTagsConnection](#objects-usertagsconnection)
    * [UserTagsConnectionEdge](#objects-usertagsconnectionedge)
    * [UsersConnection](#objects-usersconnection)
    * [UsersConnectionEdge](#objects-usersconnectionedge)
    * [Venue](#objects-venue)
    * [VolunteerMembership](#objects-volunteermembership)
    * [VolunteerRank](#objects-volunteerrank)
  * [Inputs](#inputs)
    * [ActionItemCategoryWhereInput](#inputs-actionitemcategorywhereinput)
    * [ActionItemWhereInput](#inputs-actionitemwhereinput)
    * [AddPeopleToUserTagInput](#inputs-addpeopletousertaginput)
    * [AddressInput](#inputs-addressinput)
    * [AgendaItemCategoryWhereInput](#inputs-agendaitemcategorywhereinput)
    * [CampaignWhereInput](#inputs-campaignwhereinput)
    * [ChatWhereInput](#inputs-chatwhereinput)
    * [CheckInCheckOutInput](#inputs-checkincheckoutinput)
    * [CommentInput](#inputs-commentinput)
    * [CreateActionItemInput](#inputs-createactioniteminput)
    * [CreateAdvertisementInput](#inputs-createadvertisementinput)
    * [CreateAgendaCategoryInput](#inputs-createagendacategoryinput)
    * [CreateAgendaItemInput](#inputs-createagendaiteminput)
    * [CreateAgendaSectionInput](#inputs-createagendasectioninput)
    * [CreateUserTagInput](#inputs-createusertaginput)
    * [CursorPaginationInput](#inputs-cursorpaginationinput)
    * [DonationWhereInput](#inputs-donationwhereinput)
    * [EditVenueInput](#inputs-editvenueinput)
    * [EventAttendeeInput](#inputs-eventattendeeinput)
    * [EventInput](#inputs-eventinput)
    * [EventVolunteerGroupInput](#inputs-eventvolunteergroupinput)
    * [EventVolunteerGroupWhereInput](#inputs-eventvolunteergroupwhereinput)
    * [EventVolunteerInput](#inputs-eventvolunteerinput)
    * [EventVolunteerWhereInput](#inputs-eventvolunteerwhereinput)
    * [EventWhereInput](#inputs-eventwhereinput)
    * [FeedbackInput](#inputs-feedbackinput)
    * [ForgotPasswordData](#inputs-forgotpassworddata)
    * [FundCampaignInput](#inputs-fundcampaigninput)
    * [FundCampaignPledgeInput](#inputs-fundcampaignpledgeinput)
    * [FundInput](#inputs-fundinput)
    * [FundWhereInput](#inputs-fundwhereinput)
    * [LanguageInput](#inputs-languageinput)
    * [LoginInput](#inputs-logininput)
    * [MembershipRequestsWhereInput](#inputs-membershiprequestswhereinput)
    * [NoteInput](#inputs-noteinput)
    * [OTPInput](#inputs-otpinput)
    * [OrganizationInput](#inputs-organizationinput)
    * [OrganizationWhereInput](#inputs-organizationwhereinput)
    * [PledgeWhereInput](#inputs-pledgewhereinput)
    * [PluginFieldInput](#inputs-pluginfieldinput)
    * [PluginInput](#inputs-plugininput)
    * [PostInput](#inputs-postinput)
    * [PostUpdateInput](#inputs-postupdateinput)
    * [PostWhereInput](#inputs-postwhereinput)
    * [RecaptchaVerification](#inputs-recaptchaverification)
    * [RecurrenceRuleInput](#inputs-recurrenceruleinput)
    * [SocialMediaUrlsInput](#inputs-socialmediaurlsinput)
    * [TagActionsInput](#inputs-tagactionsinput)
    * [ToggleUserTagAssignInput](#inputs-toggleusertagassigninput)
    * [UpdateActionItemCategoryInput](#inputs-updateactionitemcategoryinput)
    * [UpdateActionItemInput](#inputs-updateactioniteminput)
    * [UpdateAdvertisementInput](#inputs-updateadvertisementinput)
    * [UpdateAgendaCategoryInput](#inputs-updateagendacategoryinput)
    * [UpdateAgendaItemInput](#inputs-updateagendaiteminput)
    * [UpdateAgendaSectionInput](#inputs-updateagendasectioninput)
    * [UpdateChatInput](#inputs-updatechatinput)
    * [UpdateChatMessageInput](#inputs-updatechatmessageinput)
    * [UpdateCommunityInput](#inputs-updatecommunityinput)
    * [UpdateEventInput](#inputs-updateeventinput)
    * [UpdateEventVolunteerGroupInput](#inputs-updateeventvolunteergroupinput)
    * [UpdateEventVolunteerInput](#inputs-updateeventvolunteerinput)
    * [UpdateFundCampaignInput](#inputs-updatefundcampaigninput)
    * [UpdateFundCampaignPledgeInput](#inputs-updatefundcampaignpledgeinput)
    * [UpdateFundInput](#inputs-updatefundinput)
    * [UpdateNoteInput](#inputs-updatenoteinput)
    * [UpdateOrganizationInput](#inputs-updateorganizationinput)
    * [UpdateUserInput](#inputs-updateuserinput)
    * [UpdateUserPasswordInput](#inputs-updateuserpasswordinput)
    * [UpdateUserTagInput](#inputs-updateusertaginput)
    * [UserAndOrganizationInput](#inputs-userandorganizationinput)
    * [UserInput](#inputs-userinput)
    * [UserNameWhereInput](#inputs-usernamewhereinput)
    * [UserPhoneInput](#inputs-userphoneinput)
    * [UserTagNameWhereInput](#inputs-usertagnamewhereinput)
    * [UserTagSortedByInput](#inputs-usertagsortedbyinput)
    * [UserTagUsersAssignedToSortedByInput](#inputs-usertagusersassignedtosortedbyinput)
    * [UserTagUsersAssignedToWhereInput](#inputs-usertagusersassignedtowhereinput)
    * [UserTagUsersToAssignToWhereInput](#inputs-usertaguserstoassigntowhereinput)
    * [UserTagWhereInput](#inputs-usertagwhereinput)
    * [UserWhereInput](#inputs-userwhereinput)
    * [VenueInput](#inputs-venueinput)
    * [VenueWhereInput](#inputs-venuewhereinput)
    * [VolunteerMembershipInput](#inputs-volunteermembershipinput)
    * [VolunteerMembershipWhereInput](#inputs-volunteermembershipwhereinput)
    * [VolunteerRankWhereInput](#inputs-volunteerrankwhereinput)
    * [chatInput](#inputs-chatinput)
    * [createGroupChatInput](#inputs-creategroupchatinput)
    * [createUserFamilyInput](#inputs-createuserfamilyinput)
  * [Enums](#enums)
    * [ActionItemsOrderByInput](#enums-actionitemsorderbyinput)
    * [AdvertisementType](#enums-advertisementtype)
    * [CampaignOrderByInput](#enums-campaignorderbyinput)
    * [Currency](#enums-currency)
    * [EducationGrade](#enums-educationgrade)
    * [EmploymentStatus](#enums-employmentstatus)
    * [EventOrderByInput](#enums-eventorderbyinput)
    * [EventVolunteerGroupOrderByInput](#enums-eventvolunteergrouporderbyinput)
    * [EventVolunteerResponse](#enums-eventvolunteerresponse)
    * [EventVolunteersOrderByInput](#enums-eventvolunteersorderbyinput)
    * [FileVisibility](#enums-filevisibility)
    * [Frequency](#enums-frequency)
    * [FundOrderByInput](#enums-fundorderbyinput)
    * [Gender](#enums-gender)
    * [ItemType](#enums-itemtype)
    * [MaritalStatus](#enums-maritalstatus)
    * [OrganizationOrderByInput](#enums-organizationorderbyinput)
    * [PaginationDirection](#enums-paginationdirection)
    * [PledgeOrderByInput](#enums-pledgeorderbyinput)
    * [PostOrderByInput](#enums-postorderbyinput)
    * [RecurringEventMutationType](#enums-recurringeventmutationtype)
    * [SortedByOrder](#enums-sortedbyorder)
    * [Status](#enums-status)
    * [Type](#enums-type)
    * [UserOrderByInput](#enums-userorderbyinput)
    * [UserType](#enums-usertype)
    * [VenueOrderByInput](#enums-venueorderbyinput)
    * [VolunteerMembershipOrderByInput](#enums-volunteermembershiporderbyinput)
    * [WeekDays](#enums-weekdays)
  * [Scalars](#scalars)
    * [Any](#scalars-any)
    * [CountryCode](#scalars-countrycode)
    * [Date](#scalars-date)
    * [DateTime](#scalars-datetime)
    * [EmailAddress](#scalars-emailaddress)
    * [JSON](#scalars-json)
    * [Latitude](#scalars-latitude)
    * [Longitude](#scalars-longitude)
    * [PhoneNumber](#scalars-phonenumber)
    * [PositiveInt](#scalars-positiveint)
    * [Time](#scalars-time)
    * [URL](#scalars-url)
    * [Upload](#scalars-upload)
  * [Interfaces](#interfaces)
    * [ConnectionPageInfo](#interfaces-connectionpageinfo)
    * [Error](#interfaces-error)
    * [FieldError](#interfaces-fielderror)
  * [Unions](#unions)
    * [ConnectionError](#unions-connectionerror)
    * [CreateAdminError](#unions-createadminerror)
    * [CreateCommentError](#unions-createcommenterror)
    * [CreateMemberError](#unions-createmembererror)

</details>

## Query
<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>actionItemCategoriesByOrganization</strong></td>
<td valign="top">[ActionItemCategory]</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">orderBy</td>
<td valign="top">ActionItemsOrderByInput</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">organizationId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">where</td>
<td valign="top">ActionItemCategoryWhereInput</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>actionItemsByEvent</strong></td>
<td valign="top">[ActionItem]</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">eventId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>actionItemsByOrganization</strong></td>
<td valign="top">[ActionItem]</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">eventId</td>
<td valign="top">ID</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">orderBy</td>
<td valign="top">ActionItemsOrderByInput</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">organizationId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">where</td>
<td valign="top">ActionItemWhereInput</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>actionItemsByUser</strong></td>
<td valign="top">[ActionItem]</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">orderBy</td>
<td valign="top">ActionItemsOrderByInput</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">userId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">where</td>
<td valign="top">ActionItemWhereInput</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>adminPlugin</strong></td>
<td valign="top">[Plugin]</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">orgId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>advertisementsConnection</strong></td>
<td valign="top">AdvertisementsConnection</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">after</td>
<td valign="top">String</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">before</td>
<td valign="top">String</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">first</td>
<td valign="top">PositiveInt</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">last</td>
<td valign="top">PositiveInt</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>agendaCategory</strong></td>
<td valign="top">AgendaCategory!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>agendaItemByEvent</strong></td>
<td valign="top">[AgendaItem]</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">relatedEventId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>agendaItemByOrganization</strong></td>
<td valign="top">[AgendaItem]</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">organizationId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>agendaItemCategoriesByOrganization</strong></td>
<td valign="top">[AgendaCategory]</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">organizationId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">where</td>
<td valign="top">AgendaItemCategoryWhereInput</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>chatById</strong></td>
<td valign="top">Chat!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>chatsByUserId</strong></td>
<td valign="top">[Chat]</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">where</td>
<td valign="top">ChatWhereInput</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>checkAuth</strong></td>
<td valign="top">User!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>customDataByOrganization</strong></td>
<td valign="top">[UserCustomData!]!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">organizationId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>customFieldsByOrganization</strong></td>
<td valign="top">[OrganizationCustomField]</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>event</strong></td>
<td valign="top">Event</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>eventsAttendedByUser</strong></td>
<td valign="top">[Event]</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">orderBy</td>
<td valign="top">EventOrderByInput</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>eventsByOrganization</strong></td>
<td valign="top">[Event]</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">orderBy</td>
<td valign="top">EventOrderByInput</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>eventsByOrganizationConnection</strong></td>
<td valign="top">[Event!]!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">first</td>
<td valign="top">Int</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">orderBy</td>
<td valign="top">EventOrderByInput</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">skip</td>
<td valign="top">Int</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">upcomingOnly</td>
<td valign="top">Boolean</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">where</td>
<td valign="top">EventWhereInput</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>fundsByOrganization</strong></td>
<td valign="top">[Fund]</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">orderBy</td>
<td valign="top">FundOrderByInput</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">organizationId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">where</td>
<td valign="top">FundWhereInput</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>getAgendaItem</strong></td>
<td valign="top">AgendaItem</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>getAgendaSection</strong></td>
<td valign="top">AgendaSection</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>getAllAgendaItems</strong></td>
<td valign="top">[AgendaItem]</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>getAllNotesForAgendaItem</strong></td>
<td valign="top">[Note]</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">agendaItemId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>getCommunityData</strong></td>
<td valign="top">Community</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>getDonationById</strong></td>
<td valign="top">Donation!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>getDonationByOrgId</strong></td>
<td valign="top">[Donation]</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">orgId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>getDonationByOrgIdConnection</strong></td>
<td valign="top">[Donation!]!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">first</td>
<td valign="top">Int</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">orgId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">skip</td>
<td valign="top">Int</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">where</td>
<td valign="top">DonationWhereInput</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>getEventAttendee</strong></td>
<td valign="top">EventAttendee</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">eventId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">userId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>getEventAttendeesByEventId</strong></td>
<td valign="top">[EventAttendee]</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">eventId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>getEventInvitesByUserId</strong></td>
<td valign="top">[EventAttendee!]!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">userId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>getEventVolunteerGroups</strong></td>
<td valign="top">[EventVolunteerGroup]!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">orderBy</td>
<td valign="top">EventVolunteerGroupOrderByInput</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">where</td>
<td valign="top">EventVolunteerGroupWhereInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>getEventVolunteers</strong></td>
<td valign="top">[EventVolunteer]!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">orderBy</td>
<td valign="top">EventVolunteersOrderByInput</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">where</td>
<td valign="top">EventVolunteerWhereInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>getFundById</strong></td>
<td valign="top">Fund!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">orderBy</td>
<td valign="top">CampaignOrderByInput</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">where</td>
<td valign="top">CampaignWhereInput</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>getFundraisingCampaignPledgeById</strong></td>
<td valign="top">FundraisingCampaignPledge!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>getFundraisingCampaigns</strong></td>
<td valign="top">[FundraisingCampaign]!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">campaignOrderby</td>
<td valign="top">CampaignOrderByInput</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">pledgeOrderBy</td>
<td valign="top">PledgeOrderByInput</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">where</td>
<td valign="top">CampaignWhereInput</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>getGroupChatsByUserId</strong></td>
<td valign="top">[Chat]</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>getNoteById</strong></td>
<td valign="top">Note!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>getPledgesByUserId</strong></td>
<td valign="top">[FundraisingCampaignPledge]</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">orderBy</td>
<td valign="top">PledgeOrderByInput</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">userId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">where</td>
<td valign="top">PledgeWhereInput</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>getPlugins</strong></td>
<td valign="top">[Plugin]</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>getRecurringEvents</strong></td>
<td valign="top">[Event]</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">baseRecurringEventId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>getUnreadChatsByUserId</strong></td>
<td valign="top">[Chat]</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>getUserTag</strong></td>
<td valign="top">UserTag</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>getVenueByOrgId</strong></td>
<td valign="top">[Venue]</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">first</td>
<td valign="top">Int</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">orderBy</td>
<td valign="top">VenueOrderByInput</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">orgId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">skip</td>
<td valign="top">Int</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">where</td>
<td valign="top">VenueWhereInput</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>getVolunteerMembership</strong></td>
<td valign="top">[VolunteerMembership]!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">orderBy</td>
<td valign="top">VolunteerMembershipOrderByInput</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">where</td>
<td valign="top">VolunteerMembershipWhereInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>getVolunteerRanks</strong></td>
<td valign="top">[VolunteerRank]!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">orgId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">where</td>
<td valign="top">VolunteerRankWhereInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>getlanguage</strong></td>
<td valign="top">[Translation]</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">lang_code</td>
<td valign="top">String!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>hasSubmittedFeedback</strong></td>
<td valign="top">Boolean</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">eventId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">userId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>isSampleOrganization</strong></td>
<td valign="top">Boolean!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>joinedOrganizations</strong></td>
<td valign="top">[Organization]</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>me</strong></td>
<td valign="top">UserData!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>myLanguage</strong></td>
<td valign="top">String</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>organizations</strong></td>
<td valign="top">[Organization]</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">first</td>
<td valign="top">Int</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">orderBy</td>
<td valign="top">OrganizationOrderByInput</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">skip</td>
<td valign="top">Int</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">where</td>
<td valign="top">MembershipRequestsWhereInput</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>organizationsConnection</strong></td>
<td valign="top">[Organization]!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">first</td>
<td valign="top">Int</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">orderBy</td>
<td valign="top">OrganizationOrderByInput</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">skip</td>
<td valign="top">Int</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">where</td>
<td valign="top">OrganizationWhereInput</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>organizationsMemberConnection</strong></td>
<td valign="top">UserConnection!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">first</td>
<td valign="top">Int</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">orderBy</td>
<td valign="top">UserOrderByInput</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">orgId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">skip</td>
<td valign="top">Int</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">where</td>
<td valign="top">UserWhereInput</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>plugin</strong></td>
<td valign="top">[Plugin]</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">orgId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>post</strong></td>
<td valign="top">Post</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>registeredEventsByUser</strong></td>
<td valign="top">[Event]</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">orderBy</td>
<td valign="top">EventOrderByInput</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>registrantsByEvent</strong></td>
<td valign="top">[User]</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>user</strong></td>
<td valign="top">UserData!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>userLanguage</strong></td>
<td valign="top">String</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">userId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>users</strong></td>
<td valign="top">[UserData]</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">first</td>
<td valign="top">Int</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">orderBy</td>
<td valign="top">UserOrderByInput</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">skip</td>
<td valign="top">Int</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">where</td>
<td valign="top">UserWhereInput</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>usersConnection</strong></td>
<td valign="top">[UserData]!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">first</td>
<td valign="top">Int</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">orderBy</td>
<td valign="top">UserOrderByInput</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">skip</td>
<td valign="top">Int</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">where</td>
<td valign="top">UserWhereInput</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>venue</strong></td>
<td valign="top">Venue</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID!</td>
<td></td>
</tr>
</tbody>
</table>

## Mutation
<table>
<thead>
<tr>
<th align="left">Field</th>
<th align="right">Argument</th>
<th align="left">Type</th>
<th align="left">Description</th>
</tr>
</thead>
<tbody>
<tr>
<td colspan="2" valign="top"><strong>acceptMembershipRequest</strong></td>
<td valign="top">MembershipRequest!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">membershipRequestId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>addEventAttendee</strong></td>
<td valign="top">User!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">data</td>
<td valign="top">EventAttendeeInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>addFeedback</strong></td>
<td valign="top">Feedback!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">data</td>
<td valign="top">FeedbackInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>addLanguageTranslation</strong></td>
<td valign="top">Language!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">data</td>
<td valign="top">LanguageInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>addOrganizationCustomField</strong></td>
<td valign="top">OrganizationCustomField!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">name</td>
<td valign="top">String!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">organizationId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">type</td>
<td valign="top">String!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>addOrganizationImage</strong></td>
<td valign="top">Organization!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">file</td>
<td valign="top">String!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">organizationId</td>
<td valign="top">String!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>addPeopleToUserTag</strong></td>
<td valign="top">UserTag</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">input</td>
<td valign="top">AddPeopleToUserTagInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>addPledgeToFundraisingCampaign</strong></td>
<td valign="top">FundraisingCampaignPledge!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">campaignId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">pledgeId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>addUserCustomData</strong></td>
<td valign="top">UserCustomData!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">dataName</td>
<td valign="top">String!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">dataValue</td>
<td valign="top">Any!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">organizationId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>addUserImage</strong></td>
<td valign="top">User!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">file</td>
<td valign="top">String!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>addUserToGroupChat</strong></td>
<td valign="top">Chat</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">chatId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">userId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>addUserToUserFamily</strong></td>
<td valign="top">UserFamily!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">familyId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">userId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>assignToUserTags</strong></td>
<td valign="top">UserTag</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">input</td>
<td valign="top">TagActionsInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>assignUserTag</strong></td>
<td valign="top">User</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">input</td>
<td valign="top">ToggleUserTagAssignInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>blockPluginCreationBySuperadmin</strong></td>
<td valign="top">AppUserProfile!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">blockUser</td>
<td valign="top">Boolean!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">userId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>blockUser</strong></td>
<td valign="top">User!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">organizationId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">userId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>cancelMembershipRequest</strong></td>
<td valign="top">MembershipRequest!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">membershipRequestId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>checkIn</strong></td>
<td valign="top">CheckIn!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">data</td>
<td valign="top">CheckInCheckOutInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>checkOut</strong></td>
<td valign="top">CheckOut!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">data</td>
<td valign="top">CheckInCheckOutInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>createActionItem</strong></td>
<td valign="top">ActionItem!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">actionItemCategoryId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">data</td>
<td valign="top">CreateActionItemInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>createActionItemCategory</strong></td>
<td valign="top">ActionItemCategory!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">isDisabled</td>
<td valign="top">Boolean!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">name</td>
<td valign="top">String!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">organizationId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>createAdmin</strong></td>
<td valign="top">CreateAdminPayload!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">data</td>
<td valign="top">UserAndOrganizationInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>createAdvertisement</strong></td>
<td valign="top">CreateAdvertisementPayload</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">input</td>
<td valign="top">CreateAdvertisementInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>createAgendaCategory</strong></td>
<td valign="top">AgendaCategory!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">input</td>
<td valign="top">CreateAgendaCategoryInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>createAgendaItem</strong></td>
<td valign="top">AgendaItem!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">input</td>
<td valign="top">CreateAgendaItemInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>createAgendaSection</strong></td>
<td valign="top">AgendaSection!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">input</td>
<td valign="top">CreateAgendaSectionInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>createChat</strong></td>
<td valign="top">Chat</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">data</td>
<td valign="top">chatInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>createComment</strong></td>
<td valign="top">Comment</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">data</td>
<td valign="top">CommentInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">postId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>createDonation</strong></td>
<td valign="top">Donation!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">amount</td>
<td valign="top">Float!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">nameOfOrg</td>
<td valign="top">String!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">nameOfUser</td>
<td valign="top">String!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">orgId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">payPalId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">userId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>createEvent</strong></td>
<td valign="top">Event!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">data</td>
<td valign="top">EventInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">recurrenceRuleData</td>
<td valign="top">RecurrenceRuleInput</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>createEventVolunteer</strong></td>
<td valign="top">EventVolunteer!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">data</td>
<td valign="top">EventVolunteerInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>createEventVolunteerGroup</strong></td>
<td valign="top">EventVolunteerGroup!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">data</td>
<td valign="top">EventVolunteerGroupInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>createFund</strong></td>
<td valign="top">Fund!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">data</td>
<td valign="top">FundInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>createFundraisingCampaign</strong></td>
<td valign="top">FundraisingCampaign!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">data</td>
<td valign="top">FundCampaignInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>createFundraisingCampaignPledge</strong></td>
<td valign="top">FundraisingCampaignPledge!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">data</td>
<td valign="top">FundCampaignPledgeInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>createMember</strong></td>
<td valign="top">CreateMemberPayload!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">input</td>
<td valign="top">UserAndOrganizationInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>createNote</strong></td>
<td valign="top">Note!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">data</td>
<td valign="top">NoteInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>createOrganization</strong></td>
<td valign="top">Organization!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">data</td>
<td valign="top">OrganizationInput</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">file</td>
<td valign="top">String</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>createPlugin</strong></td>
<td valign="top">Plugin!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">pluginCreatedBy</td>
<td valign="top">String!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">pluginDesc</td>
<td valign="top">String!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">pluginName</td>
<td valign="top">String!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">uninstalledOrgs</td>
<td valign="top">[ID!]</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>createPost</strong></td>
<td valign="top">Post</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">data</td>
<td valign="top">PostInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">file</td>
<td valign="top">String</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>createSampleOrganization</strong></td>
<td valign="top">Boolean!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>createUserFamily</strong></td>
<td valign="top">UserFamily!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">data</td>
<td valign="top">createUserFamilyInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>createUserTag</strong></td>
<td valign="top">UserTag</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">input</td>
<td valign="top">CreateUserTagInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>createVenue</strong></td>
<td valign="top">Venue</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">data</td>
<td valign="top">VenueInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>createVolunteerMembership</strong></td>
<td valign="top">VolunteerMembership!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">data</td>
<td valign="top">VolunteerMembershipInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>deleteAdvertisement</strong></td>
<td valign="top">DeleteAdvertisementPayload</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>deleteAgendaCategory</strong></td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>deleteDonationById</strong></td>
<td valign="top">DeletePayload!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>deleteNote</strong></td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>deleteVenue</strong></td>
<td valign="top">Venue</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>editVenue</strong></td>
<td valign="top">Venue</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">data</td>
<td valign="top">EditVenueInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>forgotPassword</strong></td>
<td valign="top">Boolean!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">data</td>
<td valign="top">ForgotPasswordData!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>inviteEventAttendee</strong></td>
<td valign="top">EventAttendee!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">data</td>
<td valign="top">EventAttendeeInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>joinPublicOrganization</strong></td>
<td valign="top">User!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">organizationId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>leaveOrganization</strong></td>
<td valign="top">User!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">organizationId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>likeComment</strong></td>
<td valign="top">Comment</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>likePost</strong></td>
<td valign="top">Post</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>login</strong></td>
<td valign="top">AuthData!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">data</td>
<td valign="top">LoginInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>logout</strong></td>
<td valign="top">Boolean!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>markChatMessagesAsRead</strong></td>
<td valign="top">Chat!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">chatId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">userId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>otp</strong></td>
<td valign="top">OtpData!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">data</td>
<td valign="top">OTPInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>recaptcha</strong></td>
<td valign="top">Boolean!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">data</td>
<td valign="top">RecaptchaVerification!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>refreshToken</strong></td>
<td valign="top">ExtendSession!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">refreshToken</td>
<td valign="top">String!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>registerEventAttendee</strong></td>
<td valign="top">EventAttendee!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">data</td>
<td valign="top">EventAttendeeInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>registerForEvent</strong></td>
<td valign="top">EventAttendee!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>rejectMembershipRequest</strong></td>
<td valign="top">MembershipRequest!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">membershipRequestId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>removeActionItem</strong></td>
<td valign="top">ActionItem!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>removeAdmin</strong></td>
<td valign="top">AppUserProfile!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">data</td>
<td valign="top">UserAndOrganizationInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>removeAdvertisement</strong></td>
<td valign="top">Advertisement</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>removeAgendaItem</strong></td>
<td valign="top">AgendaItem!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>removeAgendaSection</strong></td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>removeComment</strong></td>
<td valign="top">Comment</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>removeEvent</strong></td>
<td valign="top">Event!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">recurringEventDeleteType</td>
<td valign="top">RecurringEventMutationType</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>removeEventAttendee</strong></td>
<td valign="top">User!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">data</td>
<td valign="top">EventAttendeeInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>removeEventVolunteer</strong></td>
<td valign="top">EventVolunteer!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>removeEventVolunteerGroup</strong></td>
<td valign="top">EventVolunteerGroup!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>removeFromUserTags</strong></td>
<td valign="top">UserTag</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">input</td>
<td valign="top">TagActionsInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>removeFundraisingCampaignPledge</strong></td>
<td valign="top">FundraisingCampaignPledge!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>removeMember</strong></td>
<td valign="top">Organization!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">data</td>
<td valign="top">UserAndOrganizationInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>removeOrganization</strong></td>
<td valign="top">UserData!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>removeOrganizationCustomField</strong></td>
<td valign="top">OrganizationCustomField!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">customFieldId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">organizationId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>removeOrganizationImage</strong></td>
<td valign="top">Organization!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">organizationId</td>
<td valign="top">String!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>removePost</strong></td>
<td valign="top">Post</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>removeSampleOrganization</strong></td>
<td valign="top">Boolean!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>removeUserCustomData</strong></td>
<td valign="top">UserCustomData!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">organizationId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>removeUserFamily</strong></td>
<td valign="top">UserFamily!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">familyId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>removeUserFromUserFamily</strong></td>
<td valign="top">UserFamily!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">familyId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">userId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>removeUserImage</strong></td>
<td valign="top">User!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>removeUserTag</strong></td>
<td valign="top">UserTag</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>resetCommunity</strong></td>
<td valign="top">Boolean!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>revokeRefreshTokenForUser</strong></td>
<td valign="top">Boolean!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>saveFcmToken</strong></td>
<td valign="top">Boolean!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">token</td>
<td valign="top">String</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>sendMembershipRequest</strong></td>
<td valign="top">MembershipRequest!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">organizationId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>sendMessageToChat</strong></td>
<td valign="top">ChatMessage!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">chatId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">media</td>
<td valign="top">String</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">messageContent</td>
<td valign="top">String</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">replyTo</td>
<td valign="top">ID</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>signUp</strong></td>
<td valign="top">AuthData!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">data</td>
<td valign="top">UserInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">file</td>
<td valign="top">String</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>togglePostPin</strong></td>
<td valign="top">Post!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">title</td>
<td valign="top">String</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>unassignUserTag</strong></td>
<td valign="top">User</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">input</td>
<td valign="top">ToggleUserTagAssignInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>unblockUser</strong></td>
<td valign="top">User!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">organizationId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">userId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>unlikeComment</strong></td>
<td valign="top">Comment</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>unlikePost</strong></td>
<td valign="top">Post</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>unregisterForEventByUser</strong></td>
<td valign="top">Event!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>updateActionItem</strong></td>
<td valign="top">ActionItem</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">data</td>
<td valign="top">UpdateActionItemInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>updateActionItemCategory</strong></td>
<td valign="top">ActionItemCategory</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">data</td>
<td valign="top">UpdateActionItemCategoryInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>updateAdvertisement</strong></td>
<td valign="top">UpdateAdvertisementPayload</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">input</td>
<td valign="top">UpdateAdvertisementInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>updateAgendaCategory</strong></td>
<td valign="top">AgendaCategory</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">input</td>
<td valign="top">UpdateAgendaCategoryInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>updateAgendaItem</strong></td>
<td valign="top">AgendaItem</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">input</td>
<td valign="top">UpdateAgendaItemInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>updateAgendaSection</strong></td>
<td valign="top">AgendaSection</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">input</td>
<td valign="top">UpdateAgendaSectionInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>updateChat</strong></td>
<td valign="top">Chat!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">input</td>
<td valign="top">UpdateChatInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>updateChatMessage</strong></td>
<td valign="top">ChatMessage!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">input</td>
<td valign="top">UpdateChatMessageInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>updateCommunity</strong></td>
<td valign="top">Boolean!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">data</td>
<td valign="top">UpdateCommunityInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>updateEvent</strong></td>
<td valign="top">Event!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">data</td>
<td valign="top">UpdateEventInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">recurrenceRuleData</td>
<td valign="top">RecurrenceRuleInput</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">recurringEventUpdateType</td>
<td valign="top">RecurringEventMutationType</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>updateEventVolunteer</strong></td>
<td valign="top">EventVolunteer!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">data</td>
<td valign="top">UpdateEventVolunteerInput</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>updateEventVolunteerGroup</strong></td>
<td valign="top">EventVolunteerGroup!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">data</td>
<td valign="top">UpdateEventVolunteerGroupInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>updateFund</strong></td>
<td valign="top">Fund!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">data</td>
<td valign="top">UpdateFundInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>updateFundraisingCampaign</strong></td>
<td valign="top">FundraisingCampaign!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">data</td>
<td valign="top">UpdateFundCampaignInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>updateFundraisingCampaignPledge</strong></td>
<td valign="top">FundraisingCampaignPledge!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">data</td>
<td valign="top">UpdateFundCampaignPledgeInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>updateLanguage</strong></td>
<td valign="top">User!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">languageCode</td>
<td valign="top">String!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>updateNote</strong></td>
<td valign="top">Note!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">data</td>
<td valign="top">UpdateNoteInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>updateOrganization</strong></td>
<td valign="top">Organization!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">data</td>
<td valign="top">UpdateOrganizationInput</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">file</td>
<td valign="top">String</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>updatePluginStatus</strong></td>
<td valign="top">Plugin!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">orgId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>updatePost</strong></td>
<td valign="top">Post!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">data</td>
<td valign="top">PostUpdateInput</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>updateSessionTimeout</strong></td>
<td valign="top">Boolean!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">timeout</td>
<td valign="top">Int!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>updateUserPassword</strong></td>
<td valign="top">UserData!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">data</td>
<td valign="top">UpdateUserPasswordInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>updateUserProfile</strong></td>
<td valign="top">User!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">data</td>
<td valign="top">UpdateUserInput</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">file</td>
<td valign="top">String</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>updateUserRoleInOrganization</strong></td>
<td valign="top">Organization!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">organizationId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">role</td>
<td valign="top">String!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">userId</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>updateUserTag</strong></td>
<td valign="top">UserTag</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">input</td>
<td valign="top">UpdateUserTagInput!</td>
<td></td>
</tr>
<tr>
<td colspan="2" valign="top"><strong>updateVolunteerMembership</strong></td>
<td valign="top">VolunteerMembership!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">id</td>
<td valign="top">ID!</td>
<td></td>
</tr>
<tr>
<td colspan="2" align="right" valign="top">status</td>
<td valign="top">String!</td>
<td></td>
</tr>
</tbody>
</table>

## Objects
<table>
<thead>
<tr>
<th align="left">Name</th>
<th align="left">Details</th>
</tr>
</thead>
<tbody>
<tr id="objects-actionitem">
<td valign="top"><strong>ActionItem</strong></td>
<td>_id: ID!<br>actionItemCategory: ActionItemCategory<br>allottedHours: Float<br>assignee: EventVolunteer<br>assigneeGroup: EventVolunteerGroup<br>assigneeType: String!<br>assigneeUser: User<br>assigner: User<br>assignmentDate: Date!<br>completionDate: Date!<br>createdAt: Date!<br>creator: User<br>dueDate: Date!<br>event: Event<br>isCompleted: Boolean!<br>postCompletionNotes: String<br>preCompletionNotes: String<br>updatedAt: Date!</td>
</tr>
<tr id="objects-actionitemcategory">
<td valign="top"><strong>ActionItemCategory</strong></td>
<td>_id: ID!<br>createdAt: Date!<br>creator: User<br>isDisabled: Boolean!<br>name: String!<br>organization: Organization<br>updatedAt: Date!</td>
</tr>
<tr id="objects-address">
<td valign="top"><strong>Address</strong></td>
<td>city: String<br>countryCode: String<br>dependentLocality: String<br>line1: String<br>line2: String<br>postalCode: String<br>sortingCode: String<br>state: String</td>
</tr>
<tr id="objects-advertisement">
<td valign="top"><strong>Advertisement</strong></td>
<td>_id: ID!<br>createdAt: DateTime!<br>creator: User<br>endDate: Date!<br>mediaUrl: URL!<br>name: String!<br>organization: Organization<br>startDate: Date!<br>type: AdvertisementType!<br>updatedAt: DateTime!</td>
</tr>
<tr id="objects-advertisementedge">
<td valign="top"><strong>AdvertisementEdge</strong></td>
<td>cursor: String<br>node: Advertisement</td>
</tr>
<tr id="objects-advertisementsconnection">
<td valign="top"><strong>AdvertisementsConnection</strong></td>
<td>edges: [AdvertisementEdge]<br>pageInfo: DefaultConnectionPageInfo!<br>totalCount: Int</td>
</tr>
<tr id="objects-agendacategory">
<td valign="top"><strong>AgendaCategory</strong></td>
<td>_id: ID!<br>createdAt: Date!<br>createdBy: User!<br>description: String<br>name: String!<br>organization: Organization!<br>updatedAt: Date<br>updatedBy: User</td>
</tr>
<tr id="objects-agendaitem">
<td valign="top"><strong>AgendaItem</strong></td>
<td>_id: ID!<br>attachments: [String]<br>categories: [AgendaCategory]<br>createdAt: Date!<br>createdBy: User!<br>description: String<br>duration: String!<br>organization: Organization!<br>relatedEvent: Event<br>sequence: Int!<br>title: String!<br>updatedAt: Date!<br>updatedBy: User!<br>urls: [String]<br>users: [User]</td>
</tr>
<tr id="objects-agendasection">
<td valign="top"><strong>AgendaSection</strong></td>
<td>_id: ID!<br>createdAt: Date!<br>createdBy: User<br>description: String!<br>items: [AgendaItem]<br>relatedEvent: Event<br>sequence: Int!<br>updatedAt: Date<br>updatedBy: User</td>
</tr>
<tr id="objects-aggregatepost">
<td valign="top"><strong>AggregatePost</strong></td>
<td>count: Int!</td>
</tr>
<tr id="objects-aggregateuser">
<td valign="top"><strong>AggregateUser</strong></td>
<td>count: Int!</td>
</tr>
<tr id="objects-appuserprofile">
<td valign="top"><strong>AppUserProfile</strong></td>
<td>_id: ID!<br>adminFor: [Organization]<br>appLanguageCode: String!<br>campaigns: [FundraisingCampaign]<br>createdEvents: [Event]<br>createdOrganizations: [Organization]<br>eventAdmin: [Event]<br>isSuperAdmin: Boolean!<br>pledges: [FundraisingCampaignPledge]<br>pluginCreationAllowed: Boolean!<br>userId: User!</td>
</tr>
<tr id="objects-authdata">
<td valign="top"><strong>AuthData</strong></td>
<td>accessToken: String!<br>appUserProfile: AppUserProfile!<br>refreshToken: String!<br>user: User!</td>
</tr>
<tr id="objects-chat">
<td valign="top"><strong>Chat</strong></td>
<td>_id: ID!<br>admins: [User]<br>createdAt: DateTime!<br>creator: User<br>image: String<br>isGroup: Boolean!<br>lastMessageId: String<br>messages: [ChatMessage]<br>name: String<br>organization: Organization<br>unseenMessagesByUsers: JSON<br>updatedAt: DateTime!<br>users: [User!]!</td>
</tr>
<tr id="objects-chatmessage">
<td valign="top"><strong>ChatMessage</strong></td>
<td>_id: ID!<br>chatMessageBelongsTo: Chat!<br>createdAt: DateTime!<br>deletedBy: [User]<br>media: String<br>messageContent: String!<br>replyTo: ChatMessage<br>sender: User!<br>updatedAt: DateTime!</td>
</tr>
<tr id="objects-checkin">
<td valign="top"><strong>CheckIn</strong></td>
<td>_id: ID!<br>createdAt: DateTime!<br>event: Event!<br>feedbackSubmitted: Boolean!<br>time: DateTime!<br>updatedAt: DateTime!<br>user: User!</td>
</tr>
<tr id="objects-checkinstatus">
<td valign="top"><strong>CheckInStatus</strong></td>
<td>_id: ID!<br>checkIn: CheckIn<br>user: User!</td>
</tr>
<tr id="objects-checkout">
<td valign="top"><strong>CheckOut</strong></td>
<td>_id: ID!<br>createdAt: DateTime!<br>eventAttendeeId: ID!<br>time: DateTime!<br>updatedAt: DateTime!</td>
</tr>
<tr id="objects-comment">
<td valign="top"><strong>Comment</strong></td>
<td>_id: ID!<br>createdAt: DateTime!<br>creator: User<br>likeCount: Int<br>likedBy: [User]<br>post: Post!<br>text: String!<br>updatedAt: DateTime!</td>
</tr>
<tr id="objects-community">
<td valign="top"><strong>Community</strong></td>
<td>_id: ID!<br>logoUrl: String<br>name: String!<br>socialMediaUrls: SocialMediaUrls<br>timeout: Int<br>websiteLink: String</td>
</tr>
<tr id="objects-createadminpayload">
<td valign="top"><strong>CreateAdminPayload</strong></td>
<td>user: AppUserProfile<br>userErrors: [CreateAdminError!]!</td>
</tr>
<tr id="objects-createadvertisementpayload">
<td valign="top"><strong>CreateAdvertisementPayload</strong></td>
<td>advertisement: Advertisement</td>
</tr>
<tr id="objects-createcommentpayload">
<td valign="top"><strong>CreateCommentPayload</strong></td>
<td>comment: Comment<br>userErrors: [CreateCommentError!]!</td>
</tr>
<tr id="objects-creatememberpayload">
<td valign="top"><strong>CreateMemberPayload</strong></td>
<td>organization: Organization<br>userErrors: [CreateMemberError!]!</td>
</tr>
<tr id="objects-defaultconnectionpageinfo">
<td valign="top"><strong>DefaultConnectionPageInfo</strong></td>
<td>endCursor: String<br>hasNextPage: Boolean!<br>hasPreviousPage: Boolean!<br>startCursor: String</td>
</tr>
<tr id="objects-deleteadvertisementpayload">
<td valign="top"><strong>DeleteAdvertisementPayload</strong></td>
<td>advertisement: Advertisement</td>
</tr>
<tr id="objects-deletepayload">
<td valign="top"><strong>DeletePayload</strong></td>
<td>success: Boolean!</td>
</tr>
<tr id="objects-donation">
<td valign="top"><strong>Donation</strong></td>
<td>_id: ID!<br>amount: Float!<br>createdAt: DateTime!<br>nameOfOrg: String!<br>nameOfUser: String!<br>orgId: ID!<br>payPalId: String!<br>updatedAt: DateTime!<br>userId: ID!</td>
</tr>
<tr id="objects-event">
<td valign="top"><strong>Event</strong></td>
<td>_id: ID!<br>actionItems: [ActionItem]<br>admins: [User!]<br>agendaItems: [AgendaItem]<br>allDay: Boolean!<br>attendees: [User]<br>attendeesCheckInStatus: [CheckInStatus!]!<br>averageFeedbackScore: Float<br>baseRecurringEvent: Event<br>createdAt: DateTime!<br>creator: User<br>description: String!<br>endDate: Date<br>endTime: Time<br>feedback: [Feedback!]!<br>images: [String]<br>isPublic: Boolean!<br>isRecurringEventException: Boolean!<br>isRegisterable: Boolean!<br>latitude: Latitude<br>location: String<br>longitude: Longitude<br>organization: Organization<br>recurrenceRule: RecurrenceRule<br>recurring: Boolean!<br>startDate: Date!<br>startTime: Time<br>title: String!<br>updatedAt: DateTime!<br>volunteerGroups: [EventVolunteerGroup]<br>volunteers: [EventVolunteer]</td>
</tr>
<tr id="objects-eventattendee">
<td valign="top"><strong>EventAttendee</strong></td>
<td>_id: ID!<br>checkInId: ID<br>checkOutId: ID<br>createdAt: DateTime!<br>eventId: ID!<br>isCheckedIn: Boolean!<br>isCheckedOut: Boolean!<br>isInvited: Boolean!<br>isRegistered: Boolean!<br>updatedAt: DateTime!<br>userId: ID!</td>
</tr>
<tr id="objects-eventvolunteer">
<td valign="top"><strong>EventVolunteer</strong></td>
<td>_id: ID!<br>assignments: [ActionItem]<br>createdAt: DateTime!<br>creator: User<br>event: Event<br>groups: [EventVolunteerGroup]<br>hasAccepted: Boolean!<br>hoursHistory: [HoursHistory]<br>hoursVolunteered: Float!<br>isPublic: Boolean!<br>updatedAt: DateTime!<br>user: User!</td>
</tr>
<tr id="objects-eventvolunteergroup">
<td valign="top"><strong>EventVolunteerGroup</strong></td>
<td>_id: ID!<br>assignments: [ActionItem]<br>createdAt: DateTime!<br>creator: User<br>description: String<br>event: Event<br>leader: User!<br>name: String<br>updatedAt: DateTime!<br>volunteers: [EventVolunteer]<br>volunteersRequired: Int</td>
</tr>
<tr id="objects-extendsession">
<td valign="top"><strong>ExtendSession</strong></td>
<td>accessToken: String!<br>refreshToken: String!</td>
</tr>
<tr id="objects-feedback">
<td valign="top"><strong>Feedback</strong></td>
<td>_id: ID!<br>createdAt: DateTime!<br>event: Event!<br>rating: Int!<br>review: String<br>updatedAt: DateTime!</td>
</tr>
<tr id="objects-file">
<td valign="top"><strong>File</strong></td>
<td>_id: ID!<br>archived: Boolean!<br>archivedAt: DateTime<br>backupStatus: String!<br>createdAt: DateTime!<br>encryption: Boolean!<br>fileName: String!<br>hash: Hash!<br>metadata: FileMetadata!<br>mimeType: String!<br>referenceCount: Int!<br>size: Int!<br>status: Status!<br>updatedAt: DateTime!<br>uri: String!<br>visibility: FileVisibility!</td>
</tr>
<tr id="objects-filemetadata">
<td valign="top"><strong>FileMetadata</strong></td>
<td>bucketName: String!<br>objectKey: String!</td>
</tr>
<tr id="objects-fund">
<td valign="top"><strong>Fund</strong></td>
<td>_id: ID!<br>campaigns: [FundraisingCampaign]<br>createdAt: DateTime!<br>creator: User<br>isArchived: Boolean!<br>isDefault: Boolean!<br>name: String!<br>organizationId: ID!<br>refrenceNumber: String<br>taxDeductible: Boolean!<br>updatedAt: DateTime!</td>
</tr>
<tr id="objects-fundraisingcampaign">
<td valign="top"><strong>FundraisingCampaign</strong></td>
<td>_id: ID!<br>createdAt: DateTime!<br>currency: Currency!<br>endDate: Date!<br>fundId: Fund!<br>fundingGoal: Float!<br>name: String!<br>organizationId: Organization!<br>pledges: [FundraisingCampaignPledge]<br>startDate: Date!<br>updatedAt: DateTime!</td>
</tr>
<tr id="objects-fundraisingcampaignpledge">
<td valign="top"><strong>FundraisingCampaignPledge</strong></td>
<td>_id: ID!<br>amount: Float!<br>campaign: FundraisingCampaign!<br>currency: Currency!<br>endDate: Date<br>startDate: Date<br>users: [User]!</td>
</tr>
<tr id="objects-group">
<td valign="top"><strong>Group</strong></td>
<td>_id: ID!<br>admins: [User!]!<br>createdAt: DateTime!<br>description: String<br>organization: Organization!<br>title: String!<br>updatedAt: DateTime!</td>
</tr>
<tr id="objects-hash">
<td valign="top"><strong>Hash</strong></td>
<td>algorithm: String!<br>value: String!</td>
</tr>
<tr id="objects-hourshistory">
<td valign="top"><strong>HoursHistory</strong></td>
<td>date: Date!<br>hours: Float!</td>
</tr>
<tr id="objects-invalidcursor">
<td valign="top"><strong>InvalidCursor</strong></td>
<td>message: String!<br>path: [String!]!</td>
</tr>
<tr id="objects-language">
<td valign="top"><strong>Language</strong></td>
<td>_id: ID!<br>createdAt: String!<br>en: String!<br>translation: [LanguageModel]</td>
</tr>
<tr id="objects-languagemodel">
<td valign="top"><strong>LanguageModel</strong></td>
<td>_id: ID!<br>createdAt: DateTime!<br>lang_code: String!<br>value: String!<br>verified: Boolean!</td>
</tr>
<tr id="objects-maximumlengtherror">
<td valign="top"><strong>MaximumLengthError</strong></td>
<td>message: String!<br>path: [String!]!</td>
</tr>
<tr id="objects-maximumvalueerror">
<td valign="top"><strong>MaximumValueError</strong></td>
<td>limit: Int!<br>message: String!<br>path: [String!]!</td>
</tr>
<tr id="objects-membernotfounderror">
<td valign="top"><strong>MemberNotFoundError</strong></td>
<td>message: String!</td>
</tr>
<tr id="objects-membershiprequest">
<td valign="top"><strong>MembershipRequest</strong></td>
<td>_id: ID!<br>organization: Organization!<br>user: User!</td>
</tr>
<tr id="objects-message">
<td valign="top"><strong>Message</strong></td>
<td>_id: ID!<br>createdAt: DateTime!<br>creator: User<br>imageUrl: URL<br>text: String!<br>updatedAt: DateTime!<br>videoUrl: URL</td>
</tr>
<tr id="objects-minimumlengtherror">
<td valign="top"><strong>MinimumLengthError</strong></td>
<td>limit: Int!<br>message: String!<br>path: [String!]!</td>
</tr>
<tr id="objects-minimumvalueerror">
<td valign="top"><strong>MinimumValueError</strong></td>
<td>message: String!<br>path: [String!]!</td>
</tr>
<tr id="objects-note">
<td valign="top"><strong>Note</strong></td>
<td>_id: ID!<br>agendaItemId: ID!<br>content: String!<br>createdAt: DateTime!<br>createdBy: User!<br>updatedAt: DateTime!<br>updatedBy: User!</td>
</tr>
<tr id="objects-organization">
<td valign="top"><strong>Organization</strong></td>
<td>_id: ID!<br>actionItemCategories: [ActionItemCategory]<br>address: Address<br>admins: [User!]<br>advertisements: AdvertisementsConnection<br>agendaCategories: [AgendaCategory]<br>apiUrl: URL!<br>blockedUsers: [User]<br>createdAt: DateTime!<br>creator: User<br>customFields: [OrganizationCustomField!]!<br>description: String!<br>funds: [Fund]<br>image: String<br>members: [User]<br>membershipRequests: [MembershipRequest]<br>name: String!<br>pinnedPosts: [Post]<br>posts: PostsConnection<br>updatedAt: DateTime!<br>userRegistrationRequired: Boolean!<br>userTags: UserTagsConnection<br>venues: [Venue]<br>visibleInSearch: Boolean!</td>
</tr>
<tr id="objects-organizationcustomfield">
<td valign="top"><strong>OrganizationCustomField</strong></td>
<td>_id: ID!<br>name: String!<br>organizationId: String!<br>type: String!</td>
</tr>
<tr id="objects-organizationinfonode">
<td valign="top"><strong>OrganizationInfoNode</strong></td>
<td>_id: ID!<br>apiUrl: URL!<br>creator: User<br>description: String!<br>image: String<br>name: String!<br>userRegistrationRequired: Boolean!<br>visibleInSearch: Boolean!</td>
</tr>
<tr id="objects-organizationmembernotfounderror">
<td valign="top"><strong>OrganizationMemberNotFoundError</strong></td>
<td>message: String!</td>
</tr>
<tr id="objects-organizationnotfounderror">
<td valign="top"><strong>OrganizationNotFoundError</strong></td>
<td>message: String!</td>
</tr>
<tr id="objects-otpdata">
<td valign="top"><strong>OtpData</strong></td>
<td>otpToken: String!</td>
</tr>
<tr id="objects-pageinfo">
<td valign="top"><strong>PageInfo</strong></td>
<td>currPageNo: Int<br>hasNextPage: Boolean!<br>hasPreviousPage: Boolean!<br>nextPageNo: Int<br>prevPageNo: Int<br>totalPages: Int</td>
</tr>
<tr id="objects-plugin">
<td valign="top"><strong>Plugin</strong></td>
<td>_id: ID!<br>pluginCreatedBy: String!<br>pluginDesc: String!<br>pluginName: String!<br>uninstalledOrgs: [ID!]</td>
</tr>
<tr id="objects-pluginfield">
<td valign="top"><strong>PluginField</strong></td>
<td>createdAt: DateTime!<br>key: String!<br>status: Status!<br>value: String!</td>
</tr>
<tr id="objects-post">
<td valign="top"><strong>Post</strong></td>
<td>_id: ID<br>commentCount: Int<br>comments: [Comment]<br>createdAt: DateTime!<br>creator: User<br>file: File<br>likeCount: Int<br>likedBy: [User]<br>organization: Organization!<br>pinned: Boolean<br>text: String!<br>title: String<br>updatedAt: DateTime!</td>
</tr>
<tr id="objects-postedge">
<td valign="top"><strong>PostEdge</strong></td>
<td>cursor: String!<br>node: Post!</td>
</tr>
<tr id="objects-postnotfounderror">
<td valign="top"><strong>PostNotFoundError</strong></td>
<td>message: String!</td>
</tr>
<tr id="objects-postsconnection">
<td valign="top"><strong>PostsConnection</strong></td>
<td>edges: [PostEdge!]!<br>pageInfo: DefaultConnectionPageInfo!<br>totalCount: Int</td>
</tr>
<tr id="objects-recurrencerule">
<td valign="top"><strong>RecurrenceRule</strong></td>
<td>baseRecurringEvent: Event<br>count: PositiveInt<br>frequency: Frequency!<br>interval: PositiveInt!<br>latestInstanceDate: Date<br>organization: Organization<br>recurrenceEndDate: Date<br>recurrenceRuleString: String!<br>recurrenceStartDate: Date!<br>weekDayOccurenceInMonth: Int<br>weekDays: [WeekDays]</td>
</tr>
<tr id="objects-socialmediaurls">
<td valign="top"><strong>SocialMediaUrls</strong></td>
<td>X: String<br>facebook: String<br>gitHub: String<br>instagram: String<br>linkedIn: String<br>reddit: String<br>slack: String<br>youTube: String</td>
</tr>
<tr id="objects-subscription">
<td valign="top"><strong>Subscription</strong></td>
<td>messageSentToChat: ChatMessage<br>onPluginUpdate: Plugin</td>
</tr>
<tr id="objects-translation">
<td valign="top"><strong>Translation</strong></td>
<td>en_value: String<br>lang_code: String<br>translation: String<br>verified: Boolean</td>
</tr>
<tr id="objects-unauthenticatederror">
<td valign="top"><strong>UnauthenticatedError</strong></td>
<td>message: String!</td>
</tr>
<tr id="objects-unauthorizederror">
<td valign="top"><strong>UnauthorizedError</strong></td>
<td>message: String!</td>
</tr>
<tr id="objects-updateadvertisementpayload">
<td valign="top"><strong>UpdateAdvertisementPayload</strong></td>
<td>advertisement: Advertisement</td>
</tr>
<tr id="objects-user">
<td valign="top"><strong>User</strong></td>
<td>_id: ID!<br>address: Address<br>appUserProfileId: AppUserProfile<br>birthDate: Date<br>createdAt: DateTime!<br>educationGrade: EducationGrade<br>email: EmailAddress!<br>employmentStatus: EmploymentStatus<br>eventAdmin: [Event]<br>eventsAttended: [Event]<br>file: File<br>firstName: String!<br>gender: Gender<br>identifier: Int!<br>image: String<br>joinedOrganizations: [Organization]<br>lastName: String!<br>maritalStatus: MaritalStatus<br>membershipRequests: [MembershipRequest]<br>organizationsBlockedBy: [Organization]<br>phone: UserPhone<br>pluginCreationAllowed: Boolean!<br>posts: PostsConnection<br>registeredEvents: [Event]<br>tagsAssignedWith: UserTagsConnection<br>updatedAt: DateTime!</td>
</tr>
<tr id="objects-userconnection">
<td valign="top"><strong>UserConnection</strong></td>
<td>aggregate: AggregateUser!<br>edges: [User]!<br>pageInfo: PageInfo!</td>
</tr>
<tr id="objects-usercustomdata">
<td valign="top"><strong>UserCustomData</strong></td>
<td>_id: ID!<br>organizationId: ID!<br>userId: ID!<br>values: JSON!</td>
</tr>
<tr id="objects-userdata">
<td valign="top"><strong>UserData</strong></td>
<td>appUserProfile: AppUserProfile<br>user: User!</td>
</tr>
<tr id="objects-userfamily">
<td valign="top"><strong>UserFamily</strong></td>
<td>_id: ID!<br>admins: [User!]!<br>creator: User!<br>title: String<br>users: [User!]!</td>
</tr>
<tr id="objects-usernotauthorizedadminerror">
<td valign="top"><strong>UserNotAuthorizedAdminError</strong></td>
<td>message: String!</td>
</tr>
<tr id="objects-usernotauthorizederror">
<td valign="top"><strong>UserNotAuthorizedError</strong></td>
<td>message: String!</td>
</tr>
<tr id="objects-usernotfounderror">
<td valign="top"><strong>UserNotFoundError</strong></td>
<td>message: String!</td>
</tr>
<tr id="objects-userphone">
<td valign="top"><strong>UserPhone</strong></td>
<td>home: PhoneNumber<br>mobile: PhoneNumber<br>work: PhoneNumber</td>
</tr>
<tr id="objects-usertag">
<td valign="top"><strong>UserTag</strong></td>
<td>_id: ID!<br>ancestorTags: [UserTag]<br>childTags: UserTagsConnection<br>name: String!<br>organization: Organization<br>parentTag: UserTag<br>usersAssignedTo: UsersConnection<br>usersToAssignTo: UsersConnection</td>
</tr>
<tr id="objects-usertagsconnection">
<td valign="top"><strong>UserTagsConnection</strong></td>
<td>edges: [UserTagsConnectionEdge!]!<br>pageInfo: DefaultConnectionPageInfo!<br>totalCount: Int</td>
</tr>
<tr id="objects-usertagsconnectionedge">
<td valign="top"><strong>UserTagsConnectionEdge</strong></td>
<td>cursor: String!<br>node: UserTag!</td>
</tr>
<tr id="objects-usersconnection">
<td valign="top"><strong>UsersConnection</strong></td>
<td>edges: [UsersConnectionEdge!]!<br>pageInfo: DefaultConnectionPageInfo!<br>totalCount: Int</td>
</tr>
<tr id="objects-usersconnectionedge">
<td valign="top"><strong>UsersConnectionEdge</strong></td>
<td>cursor: String!<br>node: User!</td>
</tr>
<tr id="objects-venue">
<td valign="top"><strong>Venue</strong></td>
<td>_id: ID!<br>capacity: Int!<br>description: String<br>imageUrl: URL<br>name: String!<br>organization: Organization!</td>
</tr>
<tr id="objects-volunteermembership">
<td valign="top"><strong>VolunteerMembership</strong></td>
<td>_id: ID!<br>createdAt: DateTime!<br>createdBy: User<br>event: Event!<br>group: EventVolunteerGroup<br>status: String!<br>updatedAt: DateTime!<br>updatedBy: User<br>volunteer: EventVolunteer!</td>
</tr>
<tr id="objects-volunteerrank">
<td valign="top"><strong>VolunteerRank</strong></td>
<td>hoursVolunteered: Float!<br>rank: Int!<br>user: User!</td>
</tr>
</tbody>
</table>

## Inputs
<table>
<thead>
<tr>
<th align="left">Name</th>
<th align="left">Details</th>
</tr>
</thead>
<tbody>
<tr id="inputs-actionitemcategorywhereinput">
<td valign="top"><strong>ActionItemCategoryWhereInput</strong></td>
<td>is_disabled: Boolean<br>name_contains: String</td>
</tr>
<tr id="inputs-actionitemwhereinput">
<td valign="top"><strong>ActionItemWhereInput</strong></td>
<td>actionItemCategory_id: ID<br>assigneeName: String<br>categoryName: String<br>event_id: ID<br>is_completed: Boolean<br>orgId: ID</td>
</tr>
<tr id="inputs-addpeopletousertaginput">
<td valign="top"><strong>AddPeopleToUserTagInput</strong></td>
<td>tagId: ID!<br>userIds: [ID!]!</td>
</tr>
<tr id="inputs-addressinput">
<td valign="top"><strong>AddressInput</strong></td>
<td>city: String<br>countryCode: String<br>dependentLocality: String<br>line1: String<br>line2: String<br>postalCode: String<br>sortingCode: String<br>state: String</td>
</tr>
<tr id="inputs-agendaitemcategorywhereinput">
<td valign="top"><strong>AgendaItemCategoryWhereInput</strong></td>
<td>name_contains: String</td>
</tr>
<tr id="inputs-campaignwhereinput">
<td valign="top"><strong>CampaignWhereInput</strong></td>
<td>fundId: ID<br>id: ID<br>name_contains: String<br>organizationId: ID</td>
</tr>
<tr id="inputs-chatwhereinput">
<td valign="top"><strong>ChatWhereInput</strong></td>
<td>name_contains: String<br>user: UserWhereInput</td>
</tr>
<tr id="inputs-checkincheckoutinput">
<td valign="top"><strong>CheckInCheckOutInput</strong></td>
<td>eventId: ID!<br>userId: ID!</td>
</tr>
<tr id="inputs-commentinput">
<td valign="top"><strong>CommentInput</strong></td>
<td>text: String!</td>
</tr>
<tr id="inputs-createactioniteminput">
<td valign="top"><strong>CreateActionItemInput</strong></td>
<td>allottedHours: Float<br>assigneeId: ID!<br>assigneeType: String!<br>dueDate: Date<br>eventId: ID<br>preCompletionNotes: String</td>
</tr>
<tr id="inputs-createadvertisementinput">
<td valign="top"><strong>CreateAdvertisementInput</strong></td>
<td>endDate: Date!<br>mediaFile: String!<br>name: String!<br>organizationId: ID!<br>startDate: Date!<br>type: AdvertisementType!</td>
</tr>
<tr id="inputs-createagendacategoryinput">
<td valign="top"><strong>CreateAgendaCategoryInput</strong></td>
<td>description: String<br>name: String!<br>organizationId: ID!</td>
</tr>
<tr id="inputs-createagendaiteminput">
<td valign="top"><strong>CreateAgendaItemInput</strong></td>
<td>attachments: [String]<br>categories: [ID]<br>description: String<br>duration: String!<br>organizationId: ID!<br>relatedEventId: ID<br>sequence: Int!<br>title: String<br>urls: [String]<br>users: [ID]</td>
</tr>
<tr id="inputs-createagendasectioninput">
<td valign="top"><strong>CreateAgendaSectionInput</strong></td>
<td>description: String!<br>items: [CreateAgendaItemInput]<br>relatedEvent: ID<br>sequence: Int!</td>
</tr>
<tr id="inputs-createusertaginput">
<td valign="top"><strong>CreateUserTagInput</strong></td>
<td>name: String!<br>organizationId: ID!<br>parentTagId: ID<br>tagColor: String</td>
</tr>
<tr id="inputs-cursorpaginationinput">
<td valign="top"><strong>CursorPaginationInput</strong></td>
<td>cursor: String<br>direction: PaginationDirection!<br>limit: PositiveInt!</td>
</tr>
<tr id="inputs-donationwhereinput">
<td valign="top"><strong>DonationWhereInput</strong></td>
<td>id: ID<br>id_contains: ID<br>id_in: [ID!]<br>id_not: ID<br>id_not_in: [ID!]<br>id_starts_with: ID<br>name_of_user: String<br>name_of_user_contains: String<br>name_of_user_in: [String!]<br>name_of_user_not: String<br>name_of_user_not_in: [String!]<br>name_of_user_starts_with: String</td>
</tr>
<tr id="inputs-editvenueinput">
<td valign="top"><strong>EditVenueInput</strong></td>
<td>capacity: Int<br>description: String<br>file: String<br>id: ID!<br>name: String</td>
</tr>
<tr id="inputs-eventattendeeinput">
<td valign="top"><strong>EventAttendeeInput</strong></td>
<td>eventId: ID!<br>userId: ID!</td>
</tr>
<tr id="inputs-eventinput">
<td valign="top"><strong>EventInput</strong></td>
<td>allDay: Boolean!<br>createChat: Boolean!<br>description: String!<br>endDate: Date!<br>endTime: Time<br>images: [String]<br>isPublic: Boolean!<br>isRegisterable: Boolean!<br>latitude: Latitude<br>location: String<br>longitude: Longitude<br>organizationId: ID!<br>recurring: Boolean!<br>startDate: Date!<br>startTime: Time<br>title: String!</td>
</tr>
<tr id="inputs-eventvolunteergroupinput">
<td valign="top"><strong>EventVolunteerGroupInput</strong></td>
<td>description: String<br>eventId: ID!<br>leaderId: ID!<br>name: String!<br>volunteerUserIds: [ID!]!<br>volunteersRequired: Int</td>
</tr>
<tr id="inputs-eventvolunteergroupwhereinput">
<td valign="top"><strong>EventVolunteerGroupWhereInput</strong></td>
<td>eventId: ID<br>leaderName: String<br>name_contains: String<br>orgId: ID<br>userId: ID</td>
</tr>
<tr id="inputs-eventvolunteerinput">
<td valign="top"><strong>EventVolunteerInput</strong></td>
<td>eventId: ID!<br>groupId: ID<br>userId: ID!</td>
</tr>
<tr id="inputs-eventvolunteerwhereinput">
<td valign="top"><strong>EventVolunteerWhereInput</strong></td>
<td>eventId: ID<br>groupId: ID<br>hasAccepted: Boolean<br>id: ID<br>name_contains: String</td>
</tr>
<tr id="inputs-eventwhereinput">
<td valign="top"><strong>EventWhereInput</strong></td>
<td>description: String<br>description_contains: String<br>description_in: [String!]<br>description_not: String<br>description_not_in: [String!]<br>description_starts_with: String<br>id: ID<br>id_contains: ID<br>id_in: [ID!]<br>id_not: ID<br>id_not_in: [ID!]<br>id_starts_with: ID<br>location: String<br>location_contains: String<br>location_in: [String!]<br>location_not: String<br>location_not_in: [String!]<br>location_starts_with: String<br>organization_id: ID<br>title: String<br>title_contains: String<br>title_in: [String!]<br>title_not: String<br>title_not_in: [String!]<br>title_starts_with: String</td>
</tr>
<tr id="inputs-feedbackinput">
<td valign="top"><strong>FeedbackInput</strong></td>
<td>eventId: ID!<br>rating: Int!<br>review: String</td>
</tr>
<tr id="inputs-forgotpassworddata">
<td valign="top"><strong>ForgotPasswordData</strong></td>
<td>newPassword: String!<br>otpToken: String!<br>userOtp: String!</td>
</tr>
<tr id="inputs-fundcampaigninput">
<td valign="top"><strong>FundCampaignInput</strong></td>
<td>currency: Currency!<br>endDate: Date!<br>fundId: ID!<br>fundingGoal: Float!<br>name: String!<br>organizationId: ID!<br>startDate: Date!</td>
</tr>
<tr id="inputs-fundcampaignpledgeinput">
<td valign="top"><strong>FundCampaignPledgeInput</strong></td>
<td>amount: Float!<br>campaignId: ID!<br>currency: Currency!<br>endDate: Date<br>startDate: Date<br>userIds: [ID!]!</td>
</tr>
<tr id="inputs-fundinput">
<td valign="top"><strong>FundInput</strong></td>
<td>isArchived: Boolean!<br>isDefault: Boolean!<br>name: String!<br>organizationId: ID!<br>refrenceNumber: String<br>taxDeductible: Boolean!</td>
</tr>
<tr id="inputs-fundwhereinput">
<td valign="top"><strong>FundWhereInput</strong></td>
<td>name_contains: String</td>
</tr>
<tr id="inputs-languageinput">
<td valign="top"><strong>LanguageInput</strong></td>
<td>en_value: String!<br>translation_lang_code: String!<br>translation_value: String!</td>
</tr>
<tr id="inputs-logininput">
<td valign="top"><strong>LoginInput</strong></td>
<td>email: EmailAddress!<br>password: String!</td>
</tr>
<tr id="inputs-membershiprequestswhereinput">
<td valign="top"><strong>MembershipRequestsWhereInput</strong></td>
<td>creatorId: ID<br>creatorId_in: [ID!]<br>creatorId_not: ID<br>creatorId_not_in: [ID!]<br>id: ID<br>id_contains: ID<br>id_in: [ID!]<br>id_not: ID<br>id_not_in: [ID!]<br>id_starts_with: ID<br>user: UserWhereInput</td>
</tr>
<tr id="inputs-noteinput">
<td valign="top"><strong>NoteInput</strong></td>
<td>agendaItemId: ID!<br>content: String!</td>
</tr>
<tr id="inputs-otpinput">
<td valign="top"><strong>OTPInput</strong></td>
<td>email: EmailAddress!</td>
</tr>
<tr id="inputs-organizationinput">
<td valign="top"><strong>OrganizationInput</strong></td>
<td>address: AddressInput!<br>apiUrl: URL<br>attendees: String<br>description: String!<br>image: String<br>name: String!<br>userRegistrationRequired: Boolean<br>visibleInSearch: Boolean</td>
</tr>
<tr id="inputs-organizationwhereinput">
<td valign="top"><strong>OrganizationWhereInput</strong></td>
<td>apiUrl: URL<br>apiUrl_contains: URL<br>apiUrl_in: [URL!]<br>apiUrl_not: URL<br>apiUrl_not_in: [URL!]<br>apiUrl_starts_with: URL<br>description: String<br>description_contains: String<br>description_in: [String!]<br>description_not: String<br>description_not_in: [String!]<br>description_starts_with: String<br>id: ID<br>id_contains: ID<br>id_in: [ID!]<br>id_not: ID<br>id_not_in: [ID!]<br>id_starts_with: ID<br>name: String<br>name_contains: String<br>name_in: [String!]<br>name_not: String<br>name_not_in: [String!]<br>name_starts_with: String<br>userRegistrationRequired: Boolean<br>visibleInSearch: Boolean</td>
</tr>
<tr id="inputs-pledgewhereinput">
<td valign="top"><strong>PledgeWhereInput</strong></td>
<td>campaignId: ID<br>firstName_contains: String<br>id: ID<br>name_contains: String</td>
</tr>
<tr id="inputs-pluginfieldinput">
<td valign="top"><strong>PluginFieldInput</strong></td>
<td>key: String!<br>value: String!</td>
</tr>
<tr id="inputs-plugininput">
<td valign="top"><strong>PluginInput</strong></td>
<td>fields: [PluginFieldInput]<br>orgId: ID!<br>pluginKey: String<br>pluginName: String!<br>pluginType: Type</td>
</tr>
<tr id="inputs-postinput">
<td valign="top"><strong>PostInput</strong></td>
<td>_id: ID<br>imageUrl: URL<br>organizationId: ID!<br>pinned: Boolean<br>text: String!<br>title: String<br>videoUrl: URL</td>
</tr>
<tr id="inputs-postupdateinput">
<td valign="top"><strong>PostUpdateInput</strong></td>
<td>imageUrl: String<br>text: String<br>title: String<br>videoUrl: String</td>
</tr>
<tr id="inputs-postwhereinput">
<td valign="top"><strong>PostWhereInput</strong></td>
<td>id: ID<br>id_contains: ID<br>id_in: [ID!]<br>id_not: ID<br>id_not_in: [ID!]<br>id_starts_with: ID<br>text: String<br>text_contains: String<br>text_in: [String!]<br>text_not: String<br>text_not_in: [String!]<br>text_starts_with: String<br>title: String<br>title_contains: String<br>title_in: [String!]<br>title_not: String<br>title_not_in: [String!]<br>title_starts_with: String</td>
</tr>
<tr id="inputs-recaptchaverification">
<td valign="top"><strong>RecaptchaVerification</strong></td>
<td>recaptchaToken: String!</td>
</tr>
<tr id="inputs-recurrenceruleinput">
<td valign="top"><strong>RecurrenceRuleInput</strong></td>
<td>count: PositiveInt<br>frequency: Frequency<br>interval: PositiveInt<br>recurrenceEndDate: Date<br>recurrenceStartDate: Date<br>weekDayOccurenceInMonth: Int<br>weekDays: [WeekDays]</td>
</tr>
<tr id="inputs-socialmediaurlsinput">
<td valign="top"><strong>SocialMediaUrlsInput</strong></td>
<td>X: String<br>facebook: String<br>gitHub: String<br>instagram: String<br>linkedIn: String<br>reddit: String<br>slack: String<br>youTube: String</td>
</tr>
<tr id="inputs-tagactionsinput">
<td valign="top"><strong>TagActionsInput</strong></td>
<td>currentTagId: ID!<br>selectedTagIds: [ID!]!</td>
</tr>
<tr id="inputs-toggleusertagassigninput">
<td valign="top"><strong>ToggleUserTagAssignInput</strong></td>
<td>tagId: ID!<br>userId: ID!</td>
</tr>
<tr id="inputs-updateactionitemcategoryinput">
<td valign="top"><strong>UpdateActionItemCategoryInput</strong></td>
<td>isDisabled: Boolean<br>name: String</td>
</tr>
<tr id="inputs-updateactioniteminput">
<td valign="top"><strong>UpdateActionItemInput</strong></td>
<td>allottedHours: Float<br>assigneeId: ID<br>assigneeType: String<br>completionDate: Date<br>dueDate: Date<br>isCompleted: Boolean<br>postCompletionNotes: String<br>preCompletionNotes: String</td>
</tr>
<tr id="inputs-updateadvertisementinput">
<td valign="top"><strong>UpdateAdvertisementInput</strong></td>
<td>_id: ID!<br>endDate: Date<br>mediaFile: String<br>name: String<br>startDate: Date<br>type: AdvertisementType</td>
</tr>
<tr id="inputs-updateagendacategoryinput">
<td valign="top"><strong>UpdateAgendaCategoryInput</strong></td>
<td>description: String<br>name: String</td>
</tr>
<tr id="inputs-updateagendaiteminput">
<td valign="top"><strong>UpdateAgendaItemInput</strong></td>
<td>attachments: [String]<br>categories: [ID]<br>description: String<br>duration: String<br>relatedEvent: ID<br>sequence: Int<br>title: String<br>urls: [String]<br>users: [ID]</td>
</tr>
<tr id="inputs-updateagendasectioninput">
<td valign="top"><strong>UpdateAgendaSectionInput</strong></td>
<td>description: String<br>relatedEvent: ID<br>sequence: Int</td>
</tr>
<tr id="inputs-updatechatinput">
<td valign="top"><strong>UpdateChatInput</strong></td>
<td>_id: ID!<br>image: String<br>name: String</td>
</tr>
<tr id="inputs-updatechatmessageinput">
<td valign="top"><strong>UpdateChatMessageInput</strong></td>
<td>chatId: ID!<br>messageContent: String!<br>messageId: ID!</td>
</tr>
<tr id="inputs-updatecommunityinput">
<td valign="top"><strong>UpdateCommunityInput</strong></td>
<td>logo: String!<br>name: String!<br>socialMediaUrls: SocialMediaUrlsInput!<br>websiteLink: String!</td>
</tr>
<tr id="inputs-updateeventinput">
<td valign="top"><strong>UpdateEventInput</strong></td>
<td>allDay: Boolean<br>description: String<br>endDate: Date<br>endTime: Time<br>images: [String]<br>isPublic: Boolean<br>isRecurringEventException: Boolean<br>isRegisterable: Boolean<br>latitude: Latitude<br>location: String<br>longitude: Longitude<br>recurring: Boolean<br>startDate: Date<br>startTime: Time<br>title: String</td>
</tr>
<tr id="inputs-updateeventvolunteergroupinput">
<td valign="top"><strong>UpdateEventVolunteerGroupInput</strong></td>
<td>description: String<br>eventId: ID!<br>name: String<br>volunteersRequired: Int</td>
</tr>
<tr id="inputs-updateeventvolunteerinput">
<td valign="top"><strong>UpdateEventVolunteerInput</strong></td>
<td>assignments: [ID]<br>hasAccepted: Boolean<br>isPublic: Boolean</td>
</tr>
<tr id="inputs-updatefundcampaigninput">
<td valign="top"><strong>UpdateFundCampaignInput</strong></td>
<td>currency: Currency<br>endDate: Date<br>fundingGoal: Float<br>name: String<br>startDate: Date</td>
</tr>
<tr id="inputs-updatefundcampaignpledgeinput">
<td valign="top"><strong>UpdateFundCampaignPledgeInput</strong></td>
<td>amount: Float<br>currency: Currency<br>endDate: Date<br>startDate: Date<br>users: [ID]</td>
</tr>
<tr id="inputs-updatefundinput">
<td valign="top"><strong>UpdateFundInput</strong></td>
<td>isArchived: Boolean<br>isDefault: Boolean<br>name: String<br>refrenceNumber: String<br>taxDeductible: Boolean</td>
</tr>
<tr id="inputs-updatenoteinput">
<td valign="top"><strong>UpdateNoteInput</strong></td>
<td>content: String<br>updatedBy: ID!</td>
</tr>
<tr id="inputs-updateorganizationinput">
<td valign="top"><strong>UpdateOrganizationInput</strong></td>
<td>address: AddressInput<br>description: String<br>name: String<br>userRegistrationRequired: Boolean<br>visibleInSearch: Boolean</td>
</tr>
<tr id="inputs-updateuserinput">
<td valign="top"><strong>UpdateUserInput</strong></td>
<td>address: AddressInput<br>appLanguageCode: String<br>birthDate: Date<br>educationGrade: EducationGrade<br>email: EmailAddress<br>employmentStatus: EmploymentStatus<br>firstName: String<br>gender: Gender<br>lastName: String<br>maritalStatus: MaritalStatus<br>phone: UserPhoneInput</td>
</tr>
<tr id="inputs-updateuserpasswordinput">
<td valign="top"><strong>UpdateUserPasswordInput</strong></td>
<td>confirmNewPassword: String!<br>newPassword: String!<br>previousPassword: String!</td>
</tr>
<tr id="inputs-updateusertaginput">
<td valign="top"><strong>UpdateUserTagInput</strong></td>
<td>name: String!<br>tagColor: String<br>tagId: ID!</td>
</tr>
<tr id="inputs-userandorganizationinput">
<td valign="top"><strong>UserAndOrganizationInput</strong></td>
<td>organizationId: ID!<br>userId: ID!</td>
</tr>
<tr id="inputs-userinput">
<td valign="top"><strong>UserInput</strong></td>
<td>appLanguageCode: String<br>email: EmailAddress!<br>firstName: String!<br>lastName: String!<br>password: String!<br>selectedOrganization: ID!</td>
</tr>
<tr id="inputs-usernamewhereinput">
<td valign="top"><strong>UserNameWhereInput</strong></td>
<td>starts_with: String!</td>
</tr>
<tr id="inputs-userphoneinput">
<td valign="top"><strong>UserPhoneInput</strong></td>
<td>home: PhoneNumber<br>mobile: PhoneNumber<br>work: PhoneNumber</td>
</tr>
<tr id="inputs-usertagnamewhereinput">
<td valign="top"><strong>UserTagNameWhereInput</strong></td>
<td>starts_with: String!</td>
</tr>
<tr id="inputs-usertagsortedbyinput">
<td valign="top"><strong>UserTagSortedByInput</strong></td>
<td>id: SortedByOrder!</td>
</tr>
<tr id="inputs-usertagusersassignedtosortedbyinput">
<td valign="top"><strong>UserTagUsersAssignedToSortedByInput</strong></td>
<td>id: SortedByOrder!</td>
</tr>
<tr id="inputs-usertagusersassignedtowhereinput">
<td valign="top"><strong>UserTagUsersAssignedToWhereInput</strong></td>
<td>firstName: UserNameWhereInput<br>lastName: UserNameWhereInput</td>
</tr>
<tr id="inputs-usertaguserstoassigntowhereinput">
<td valign="top"><strong>UserTagUsersToAssignToWhereInput</strong></td>
<td>firstName: UserNameWhereInput<br>lastName: UserNameWhereInput</td>
</tr>
<tr id="inputs-usertagwhereinput">
<td valign="top"><strong>UserTagWhereInput</strong></td>
<td>name: UserTagNameWhereInput</td>
</tr>
<tr id="inputs-userwhereinput">
<td valign="top"><strong>UserWhereInput</strong></td>
<td>email: EmailAddress<br>email_contains: EmailAddress<br>email_in: [EmailAddress!]<br>email_not: EmailAddress<br>email_not_in: [EmailAddress!]<br>email_starts_with: EmailAddress<br>event_title_contains: String<br>firstName: String<br>firstName_contains: String<br>firstName_in: [String!]<br>firstName_not: String<br>firstName_not_in: [String!]<br>firstName_starts_with: String<br>id: ID<br>id_contains: ID<br>id_in: [ID!]<br>id_not: ID<br>id_not_in: [ID!]<br>id_starts_with: ID<br>lastName: String<br>lastName_contains: String<br>lastName_in: [String!]<br>lastName_not: String<br>lastName_not_in: [String!]<br>lastName_starts_with: String</td>
</tr>
<tr id="inputs-venueinput">
<td valign="top"><strong>VenueInput</strong></td>
<td>capacity: Int!<br>description: String<br>file: String<br>name: String!<br>organizationId: ID!</td>
</tr>
<tr id="inputs-venuewhereinput">
<td valign="top"><strong>VenueWhereInput</strong></td>
<td>description_contains: String<br>description_starts_with: String<br>name_contains: String<br>name_starts_with: String</td>
</tr>
<tr id="inputs-volunteermembershipinput">
<td valign="top"><strong>VolunteerMembershipInput</strong></td>
<td>event: ID!<br>group: ID<br>status: String!<br>userId: ID!</td>
</tr>
<tr id="inputs-volunteermembershipwhereinput">
<td valign="top"><strong>VolunteerMembershipWhereInput</strong></td>
<td>eventId: ID<br>eventTitle: String<br>filter: String<br>groupId: ID<br>status: String<br>userId: ID<br>userName: String</td>
</tr>
<tr id="inputs-volunteerrankwhereinput">
<td valign="top"><strong>VolunteerRankWhereInput</strong></td>
<td>limit: Int<br>nameContains: String<br>orderBy: String!<br>timeFrame: String!</td>
</tr>
<tr id="inputs-chatinput">
<td valign="top"><strong>chatInput</strong></td>
<td>image: String<br>isGroup: Boolean!<br>name: String<br>organizationId: ID<br>userIds: [ID!]!</td>
</tr>
<tr id="inputs-creategroupchatinput">
<td valign="top"><strong>createGroupChatInput</strong></td>
<td>organizationId: ID!<br>title: String!<br>userIds: [ID!]!</td>
</tr>
<tr id="inputs-createuserfamilyinput">
<td valign="top"><strong>createUserFamilyInput</strong></td>
<td>title: String!<br>userIds: [ID!]!</td>
</tr>
</tbody>
</table>

## Enums
<table>
<thead>
<tr>
<th align="left">Name</th>
<th align="left">Details</th>
</tr>
</thead>
<tbody>
<tr id="enums-actionitemsorderbyinput">
<td valign="top"><strong>ActionItemsOrderByInput</strong></td>
<td>createdAt_ASC, createdAt_DESC, dueDate_ASC, dueDate_DESC</td>
</tr>
<tr id="enums-advertisementtype">
<td valign="top"><strong>AdvertisementType</strong></td>
<td>BANNER, MENU, POPUP</td>
</tr>
<tr id="enums-campaignorderbyinput">
<td valign="top"><strong>CampaignOrderByInput</strong></td>
<td>endDate_ASC, endDate_DESC, fundingGoal_ASC, fundingGoal_DESC, startDate_ASC, startDate_DESC</td>
</tr>
<tr id="enums-currency">
<td valign="top"><strong>Currency</strong></td>
<td>AED, AFN, ALL, AMD, ANG, AOA, ARS, AUD, AWG, AZN, BAM, BBD, BDT, BGN, BHD, BIF, BMD, BND, BOB, BRL, BSD, BTN, BWP, BYN, BZD, CAD, CDF, CHF, CLP, CNY, COP, CRC, CUP, CVE, CZK, DJF, DKK, DOP, DZD, EGP, ERN, ETB, EUR, FJD, FKP, FOK, FRO, GBP, GEL, GGP, GHS, GIP, GMD, GNF, GTQ, GYD, HKD, HNL, HRK, HTG, HUF, IDR, ILS, IMP, INR, IQD, IRR, ISK, JEP, JMD, JOD, JPY, KES, KGS, KHR, KID, KMF, KRW, KWD, KYD, KZT, LAK, LBP, LKR, LRD, LSL, LYD, MAD, MDL, MGA, MKD, MMK, MNT, MOP, MRU, MUR, MVR, MWK, MXN, MYR, MZN, NAD, NGN, NIO, NOK, NPR, NZD, OMR, PAB, PEN, PGK, PHP, PKR, PLN, PYG, QAR, RON, RSD, RUB, RWF, SAR, SBD, SCR, SDG, SEK, SGD, SHP, SLL, SOS, SPL, SRD, STN, SVC, SYP, SZL, THB, TJS, TMT, TND, TOP, TRY, TTD, TVD, TWD, TZS, UAH, UGX, USD, UYU, UZS, VEF, VND, VUV, WST, XAF, XCD, XDR, XOF, XPF, YER, ZAR, ZMW, ZWD</td>
</tr>
<tr id="enums-educationgrade">
<td valign="top"><strong>EducationGrade</strong></td>
<td>GRADE_1, GRADE_2, GRADE_3, GRADE_4, GRADE_5, GRADE_6, GRADE_7, GRADE_8, GRADE_9, GRADE_10, GRADE_11, GRADE_12, GRADUATE, KG, NO_GRADE, PRE_KG</td>
</tr>
<tr id="enums-employmentstatus">
<td valign="top"><strong>EmploymentStatus</strong></td>
<td>FULL_TIME, PART_TIME, UNEMPLOYED</td>
</tr>
<tr id="enums-eventorderbyinput">
<td valign="top"><strong>EventOrderByInput</strong></td>
<td>allDay_ASC, allDay_DESC, description_ASC, description_DESC, endDate_ASC, endDate_DESC, endTime_ASC, endTime_DESC, id_ASC, id_DESC, location_ASC, location_DESC, recurrance_ASC, recurrance_DESC, startDate_ASC, startDate_DESC, startTime_ASC, startTime_DESC, title_ASC, title_DESC</td>
</tr>
<tr id="enums-eventvolunteergrouporderbyinput">
<td valign="top"><strong>EventVolunteerGroupOrderByInput</strong></td>
<td>assignments_ASC, assignments_DESC, volunteers_ASC, volunteers_DESC</td>
</tr>
<tr id="enums-eventvolunteerresponse">
<td valign="top"><strong>EventVolunteerResponse</strong></td>
<td>NO, YES</td>
</tr>
<tr id="enums-eventvolunteersorderbyinput">
<td valign="top"><strong>EventVolunteersOrderByInput</strong></td>
<td>hoursVolunteered_ASC, hoursVolunteered_DESC</td>
</tr>
<tr id="enums-filevisibility">
<td valign="top"><strong>FileVisibility</strong></td>
<td>PRIVATE, PUBLIC</td>
</tr>
<tr id="enums-frequency">
<td valign="top"><strong>Frequency</strong></td>
<td>DAILY, MONTHLY, WEEKLY, YEARLY</td>
</tr>
<tr id="enums-fundorderbyinput">
<td valign="top"><strong>FundOrderByInput</strong></td>
<td>createdAt_ASC, createdAt_DESC</td>
</tr>
<tr id="enums-gender">
<td valign="top"><strong>Gender</strong></td>
<td>FEMALE, MALE, OTHER</td>
</tr>
<tr id="enums-itemtype">
<td valign="top"><strong>ItemType</strong></td>
<td>Note, Regular</td>
</tr>
<tr id="enums-maritalstatus">
<td valign="top"><strong>MaritalStatus</strong></td>
<td>DIVORCED, ENGAGED, MARRIED, SEPERATED, SINGLE, WIDOWED</td>
</tr>
<tr id="enums-organizationorderbyinput">
<td valign="top"><strong>OrganizationOrderByInput</strong></td>
<td>apiUrl_ASC, apiUrl_DESC, createdAt_ASC, createdAt_DESC, description_ASC, description_DESC, id_ASC, id_DESC, name_ASC, name_DESC</td>
</tr>
<tr id="enums-paginationdirection">
<td valign="top"><strong>PaginationDirection</strong></td>
<td>BACKWARD, FORWARD</td>
</tr>
<tr id="enums-pledgeorderbyinput">
<td valign="top"><strong>PledgeOrderByInput</strong></td>
<td>amount_ASC, amount_DESC, endDate_ASC, endDate_DESC, startDate_ASC, startDate_DESC</td>
</tr>
<tr id="enums-postorderbyinput">
<td valign="top"><strong>PostOrderByInput</strong></td>
<td>commentCount_ASC, commentCount_DESC, createdAt_ASC, createdAt_DESC, id_ASC, id_DESC, imageUrl_ASC, imageUrl_DESC, likeCount_ASC, likeCount_DESC, text_ASC, text_DESC, title_ASC, title_DESC, videoUrl_ASC, videoUrl_DESC</td>
</tr>
<tr id="enums-recurringeventmutationtype">
<td valign="top"><strong>RecurringEventMutationType</strong></td>
<td>allInstances, thisAndFollowingInstances, thisInstance</td>
</tr>
<tr id="enums-sortedbyorder">
<td valign="top"><strong>SortedByOrder</strong></td>
<td>ASCENDING, DESCENDING</td>
</tr>
<tr id="enums-status">
<td valign="top"><strong>Status</strong></td>
<td>ACTIVE, BLOCKED, DELETED</td>
</tr>
<tr id="enums-type">
<td valign="top"><strong>Type</strong></td>
<td>PRIVATE, UNIVERSAL</td>
</tr>
<tr id="enums-userorderbyinput">
<td valign="top"><strong>UserOrderByInput</strong></td>
<td>createdAt_ASC, createdAt_DESC, email_ASC, email_DESC, firstName_ASC, firstName_DESC, id_ASC, id_DESC, lastName_ASC, lastName_DESC</td>
</tr>
<tr id="enums-usertype">
<td valign="top"><strong>UserType</strong></td>
<td>ADMIN, NON_USER, SUPERADMIN, USER</td>
</tr>
<tr id="enums-venueorderbyinput">
<td valign="top"><strong>VenueOrderByInput</strong></td>
<td>capacity_ASC, capacity_DESC</td>
</tr>
<tr id="enums-volunteermembershiporderbyinput">
<td valign="top"><strong>VolunteerMembershipOrderByInput</strong></td>
<td>createdAt_ASC, createdAt_DESC</td>
</tr>
<tr id="enums-weekdays">
<td valign="top"><strong>WeekDays</strong></td>
<td>FRIDAY, MONDAY, SATURDAY, SUNDAY, THURSDAY, TUESDAY, WEDNESDAY</td>
</tr>
</tbody>
</table>

## Scalars
<table>
<thead>
<tr>
<th align="left">Name</th>
<th align="left">Details</th>
</tr>
</thead>
<tbody>
<tr id="scalars-any">
<td valign="top"><strong>Any</strong></td>
<td>Scalar Type</td>
</tr>
<tr id="scalars-countrycode">
<td valign="top"><strong>CountryCode</strong></td>
<td>Scalar Type</td>
</tr>
<tr id="scalars-date">
<td valign="top"><strong>Date</strong></td>
<td>Scalar Type</td>
</tr>
<tr id="scalars-datetime">
<td valign="top"><strong>DateTime</strong></td>
<td>Scalar Type</td>
</tr>
<tr id="scalars-emailaddress">
<td valign="top"><strong>EmailAddress</strong></td>
<td>Scalar Type</td>
</tr>
<tr id="scalars-json">
<td valign="top"><strong>JSON</strong></td>
<td>Scalar Type</td>
</tr>
<tr id="scalars-latitude">
<td valign="top"><strong>Latitude</strong></td>
<td>Scalar Type</td>
</tr>
<tr id="scalars-longitude">
<td valign="top"><strong>Longitude</strong></td>
<td>Scalar Type</td>
</tr>
<tr id="scalars-phonenumber">
<td valign="top"><strong>PhoneNumber</strong></td>
<td>Scalar Type</td>
</tr>
<tr id="scalars-positiveint">
<td valign="top"><strong>PositiveInt</strong></td>
<td>Scalar Type</td>
</tr>
<tr id="scalars-time">
<td valign="top"><strong>Time</strong></td>
<td>Scalar Type</td>
</tr>
<tr id="scalars-url">
<td valign="top"><strong>URL</strong></td>
<td>Scalar Type</td>
</tr>
<tr id="scalars-upload">
<td valign="top"><strong>Upload</strong></td>
<td>Scalar Type</td>
</tr>
</tbody>
</table>

## Interfaces
<table>
<thead>
<tr>
<th align="left">Name</th>
<th align="left">Details</th>
</tr>
</thead>
<tbody>
<tr id="interfaces-connectionpageinfo">
<td valign="top"><strong>ConnectionPageInfo</strong></td>
<td>The standard graphQL connection page info that contains metadata about a
particular instance of a connection. ALl other custom connection page info
types must implement this interface.</td>
</tr>
<tr id="interfaces-error">
<td valign="top"><strong>Error</strong></td>
<td></td>
</tr>
<tr id="interfaces-fielderror">
<td valign="top"><strong>FieldError</strong></td>
<td></td>
</tr>
</tbody>
</table>

## Unions
<table>
<thead>
<tr>
<th align="left">Name</th>
<th align="left">Details</th>
</tr>
</thead>
<tbody>
<tr id="unions-connectionerror">
<td valign="top"><strong>ConnectionError</strong></td>
<td></td>
</tr>
<tr id="unions-createadminerror">
<td valign="top"><strong>CreateAdminError</strong></td>
<td></td>
</tr>
<tr id="unions-createcommenterror">
<td valign="top"><strong>CreateCommentError</strong></td>
<td></td>
</tr>
<tr id="unions-createmembererror">
<td valign="top"><strong>CreateMemberError</strong></td>
<td></td>
</tr>
</tbody>
</table>

