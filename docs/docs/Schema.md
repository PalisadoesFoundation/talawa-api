# GraphQL Schema Documentation

## Table of Contents

- [ActionItem](#actionitem)
- [ActionItemCategory](#actionitemcategory)
- [ActionItemCategoryWhereInput](#actionitemcategorywhereinput)
- [ActionItemWhereInput](#actionitemwhereinput)
- [ActionItemsOrderByInput](#actionitemsorderbyinput)
- [AddPeopleToUserTagInput](#addpeopletousertaginput)
- [Address](#address)
- [AddressInput](#addressinput)
- [Advertisement](#advertisement)
- [AdvertisementEdge](#advertisementedge)
- [AdvertisementType](#advertisementtype)
- [AdvertisementsConnection](#advertisementsconnection)
- [AgendaCategory](#agendacategory)
- [AgendaItem](#agendaitem)
- [AgendaItemCategoryWhereInput](#agendaitemcategorywhereinput)
- [AgendaSection](#agendasection)
- [AggregatePost](#aggregatepost)
- [AggregateUser](#aggregateuser)
- [Any](#any)
- [AppUserProfile](#appuserprofile)
- [AuthData](#authdata)
- [Boolean](#boolean)
- [CampaignOrderByInput](#campaignorderbyinput)
- [CampaignWhereInput](#campaignwhereinput)
- [Chat](#chat)
- [ChatMessage](#chatmessage)
- [ChatWhereInput](#chatwhereinput)
- [CheckIn](#checkin)
- [CheckInCheckOutInput](#checkincheckoutinput)
- [CheckInStatus](#checkinstatus)
- [CheckOut](#checkout)
- [Comment](#comment)
- [CommentInput](#commentinput)
- [Community](#community)
- [ConnectionError](#connectionerror)
- [ConnectionPageInfo](#connectionpageinfo)
- [CountryCode](#countrycode)
- [CreateActionItemInput](#createactioniteminput)
- [CreateAdminError](#createadminerror)
- [CreateAdminPayload](#createadminpayload)
- [CreateAdvertisementInput](#createadvertisementinput)
- [CreateAdvertisementPayload](#createadvertisementpayload)
- [CreateAgendaCategoryInput](#createagendacategoryinput)
- [CreateAgendaItemInput](#createagendaiteminput)
- [CreateAgendaSectionInput](#createagendasectioninput)
- [CreateCommentError](#createcommenterror)
- [CreateCommentPayload](#createcommentpayload)
- [CreateMemberError](#createmembererror)
- [CreateMemberPayload](#creatememberpayload)
- [CreateUserTagInput](#createusertaginput)
- [Currency](#currency)
- [CursorPaginationInput](#cursorpaginationinput)
- [Date](#date)
- [DateTime](#datetime)
- [DefaultConnectionPageInfo](#defaultconnectionpageinfo)
- [DeleteAdvertisementPayload](#deleteadvertisementpayload)
- [DeletePayload](#deletepayload)
- [Donation](#donation)
- [DonationWhereInput](#donationwhereinput)
- [EditVenueInput](#editvenueinput)
- [EducationGrade](#educationgrade)
- [EmailAddress](#emailaddress)
- [EmploymentStatus](#employmentstatus)
- [Error](#error)
- [Event](#event)
- [EventAttendee](#eventattendee)
- [EventAttendeeInput](#eventattendeeinput)
- [EventInput](#eventinput)
- [EventOrderByInput](#eventorderbyinput)
- [EventVolunteer](#eventvolunteer)
- [EventVolunteerGroup](#eventvolunteergroup)
- [EventVolunteerGroupInput](#eventvolunteergroupinput)
- [EventVolunteerGroupOrderByInput](#eventvolunteergrouporderbyinput)
- [EventVolunteerGroupWhereInput](#eventvolunteergroupwhereinput)
- [EventVolunteerInput](#eventvolunteerinput)
- [EventVolunteerResponse](#eventvolunteerresponse)
- [EventVolunteerWhereInput](#eventvolunteerwhereinput)
- [EventVolunteersOrderByInput](#eventvolunteersorderbyinput)
- [EventWhereInput](#eventwhereinput)
- [ExtendSession](#extendsession)
- [Feedback](#feedback)
- [FeedbackInput](#feedbackinput)
- [FieldError](#fielderror)
- [File](#file)
- [FileMetadata](#filemetadata)
- [FileVisibility](#filevisibility)
- [Float](#float)
- [ForgotPasswordData](#forgotpassworddata)
- [Frequency](#frequency)
- [Fund](#fund)
- [FundCampaignInput](#fundcampaigninput)
- [FundCampaignPledgeInput](#fundcampaignpledgeinput)
- [FundInput](#fundinput)
- [FundOrderByInput](#fundorderbyinput)
- [FundWhereInput](#fundwhereinput)
- [FundraisingCampaign](#fundraisingcampaign)
- [FundraisingCampaignPledge](#fundraisingcampaignpledge)
- [Gender](#gender)
- [Group](#group)
- [Hash](#hash)
- [HoursHistory](#hourshistory)
- [ID](#id)
- [Int](#int)
- [InvalidCursor](#invalidcursor)
- [ItemType](#itemtype)
- [JSON](#json)
- [Language](#language)
- [LanguageInput](#languageinput)
- [LanguageModel](#languagemodel)
- [Latitude](#latitude)
- [LoginInput](#logininput)
- [Longitude](#longitude)
- [MaritalStatus](#maritalstatus)
- [MaximumLengthError](#maximumlengtherror)
- [MaximumValueError](#maximumvalueerror)
- [MemberNotFoundError](#membernotfounderror)
- [MembershipRequest](#membershiprequest)
- [MembershipRequestsWhereInput](#membershiprequestswhereinput)
- [Message](#message)
- [MinimumLengthError](#minimumlengtherror)
- [MinimumValueError](#minimumvalueerror)
- [Mutation](#mutation)
- [Note](#note)
- [NoteInput](#noteinput)
- [OTPInput](#otpinput)
- [Organization](#organization)
- [OrganizationCustomField](#organizationcustomfield)
- [OrganizationInfoNode](#organizationinfonode)
- [OrganizationInput](#organizationinput)
- [OrganizationMemberNotFoundError](#organizationmembernotfounderror)
- [OrganizationNotFoundError](#organizationnotfounderror)
- [OrganizationOrderByInput](#organizationorderbyinput)
- [OrganizationWhereInput](#organizationwhereinput)
- [OtpData](#otpdata)
- [PageInfo](#pageinfo)
- [PaginationDirection](#paginationdirection)
- [PhoneNumber](#phonenumber)
- [PledgeOrderByInput](#pledgeorderbyinput)
- [PledgeWhereInput](#pledgewhereinput)
- [Plugin](#plugin)
- [PluginField](#pluginfield)
- [PluginFieldInput](#pluginfieldinput)
- [PluginInput](#plugininput)
- [PositiveInt](#positiveint)
- [Post](#post)
- [PostEdge](#postedge)
- [PostInput](#postinput)
- [PostNotFoundError](#postnotfounderror)
- [PostOrderByInput](#postorderbyinput)
- [PostUpdateInput](#postupdateinput)
- [PostWhereInput](#postwhereinput)
- [PostsConnection](#postsconnection)
- [Query](#query)
- [RecaptchaVerification](#recaptchaverification)
- [RecurrenceRule](#recurrencerule)
- [RecurrenceRuleInput](#recurrenceruleinput)
- [RecurringEventMutationType](#recurringeventmutationtype)
- [SocialMediaUrls](#socialmediaurls)
- [SocialMediaUrlsInput](#socialmediaurlsinput)
- [SortedByOrder](#sortedbyorder)
- [Status](#status)
- [String](#string)
- [Subscription](#subscription)
- [TagActionsInput](#tagactionsinput)
- [Time](#time)
- [ToggleUserTagAssignInput](#toggleusertagassigninput)
- [Translation](#translation)
- [Type](#type)
- [URL](#url)
- [UnauthenticatedError](#unauthenticatederror)
- [UnauthorizedError](#unauthorizederror)
- [UpdateActionItemCategoryInput](#updateactionitemcategoryinput)
- [UpdateActionItemInput](#updateactioniteminput)
- [UpdateAdvertisementInput](#updateadvertisementinput)
- [UpdateAdvertisementPayload](#updateadvertisementpayload)
- [UpdateAgendaCategoryInput](#updateagendacategoryinput)
- [UpdateAgendaItemInput](#updateagendaiteminput)
- [UpdateAgendaSectionInput](#updateagendasectioninput)
- [UpdateChatInput](#updatechatinput)
- [UpdateChatMessageInput](#updatechatmessageinput)
- [UpdateCommunityInput](#updatecommunityinput)
- [UpdateEventInput](#updateeventinput)
- [UpdateEventVolunteerGroupInput](#updateeventvolunteergroupinput)
- [UpdateEventVolunteerInput](#updateeventvolunteerinput)
- [UpdateFundCampaignInput](#updatefundcampaigninput)
- [UpdateFundCampaignPledgeInput](#updatefundcampaignpledgeinput)
- [UpdateFundInput](#updatefundinput)
- [UpdateNoteInput](#updatenoteinput)
- [UpdateOrganizationInput](#updateorganizationinput)
- [UpdateUserInput](#updateuserinput)
- [UpdateUserPasswordInput](#updateuserpasswordinput)
- [UpdateUserTagInput](#updateusertaginput)
- [Upload](#upload)
- [User](#user)
- [UserAndOrganizationInput](#userandorganizationinput)
- [UserConnection](#userconnection)
- [UserCustomData](#usercustomdata)
- [UserData](#userdata)
- [UserFamily](#userfamily)
- [UserInput](#userinput)
- [UserNameWhereInput](#usernamewhereinput)
- [UserNotAuthorizedAdminError](#usernotauthorizedadminerror)
- [UserNotAuthorizedError](#usernotauthorizederror)
- [UserNotFoundError](#usernotfounderror)
- [UserOrderByInput](#userorderbyinput)
- [UserPhone](#userphone)
- [UserPhoneInput](#userphoneinput)
- [UserTag](#usertag)
- [UserTagNameWhereInput](#usertagnamewhereinput)
- [UserTagSortedByInput](#usertagsortedbyinput)
- [UserTagUsersAssignedToSortedByInput](#usertagusersassignedtosortedbyinput)
- [UserTagUsersAssignedToWhereInput](#usertagusersassignedtowhereinput)
- [UserTagUsersToAssignToWhereInput](#usertaguserstoassigntowhereinput)
- [UserTagWhereInput](#usertagwhereinput)
- [UserTagsConnection](#usertagsconnection)
- [UserTagsConnectionEdge](#usertagsconnectionedge)
- [UserType](#usertype)
- [UserWhereInput](#userwhereinput)
- [UsersConnection](#usersconnection)
- [UsersConnectionEdge](#usersconnectionedge)
- [Venue](#venue)
- [VenueInput](#venueinput)
- [VenueOrderByInput](#venueorderbyinput)
- [VenueWhereInput](#venuewhereinput)
- [VolunteerMembership](#volunteermembership)
- [VolunteerMembershipInput](#volunteermembershipinput)
- [VolunteerMembershipOrderByInput](#volunteermembershiporderbyinput)
- [VolunteerMembershipWhereInput](#volunteermembershipwhereinput)
- [VolunteerRank](#volunteerrank)
- [VolunteerRankWhereInput](#volunteerrankwhereinput)
- [WeekDays](#weekdays)
- [chatInput](#chatinput)
- [createGroupChatInput](#creategroupchatinput)
- [createUserFamilyInput](#createuserfamilyinput)

## Types

### ActionItem

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| _id | ID! |  |
| actionItemCategory | ActionItemCategory |  |
| allottedHours | Float |  |
| assignee | EventVolunteer |  |
| assigneeGroup | EventVolunteerGroup |  |
| assigneeType | String! |  |
| assigneeUser | User |  |
| assigner | User |  |
| assignmentDate | Date! |  |
| completionDate | Date! |  |
| createdAt | Date! |  |
| creator | User |  |
| dueDate | Date! |  |
| event | Event |  |
| isCompleted | Boolean! |  |
| postCompletionNotes | String |  |
| preCompletionNotes | String |  |
| updatedAt | Date! |  |

### ActionItemCategory

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| _id | ID! |  |
| createdAt | Date! |  |
| creator | User |  |
| isDisabled | Boolean! |  |
| name | String! |  |
| organization | Organization |  |
| updatedAt | Date! |  |

### ActionItemCategoryWhereInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| is_disabled | Boolean |  |
| name_contains | String |  |

### ActionItemWhereInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| actionItemCategory_id | ID |  |
| assigneeName | String |  |
| categoryName | String |  |
| event_id | ID |  |
| is_completed | Boolean |  |
| orgId | ID |  |

### ActionItemsOrderByInput

### AddPeopleToUserTagInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| tagId | ID! |  |
| userIds | [ID!]! |  |

### Address

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| city | String |  |
| countryCode | String |  |
| dependentLocality | String |  |
| line1 | String |  |
| line2 | String |  |
| postalCode | String |  |
| sortingCode | String |  |
| state | String |  |

### AddressInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| city | String |  |
| countryCode | String |  |
| dependentLocality | String |  |
| line1 | String |  |
| line2 | String |  |
| postalCode | String |  |
| sortingCode | String |  |
| state | String |  |

### Advertisement

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| _id | ID! |  |
| createdAt | DateTime! |  |
| creator | User |  |
| endDate | Date! |  |
| mediaUrl | URL! |  |
| name | String! |  |
| organization | Organization |  |
| startDate | Date! |  |
| type | AdvertisementType! |  |
| updatedAt | DateTime! |  |

### AdvertisementEdge

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| cursor | String |  |
| node | Advertisement |  |

### AdvertisementType

### AdvertisementsConnection

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| edges | [AdvertisementEdge] |  |
| pageInfo | DefaultConnectionPageInfo! |  |
| totalCount | Int |  |

### AgendaCategory

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| _id | ID! |  |
| createdAt | Date! |  |
| createdBy | User! |  |
| description | String |  |
| name | String! |  |
| organization | Organization! |  |
| updatedAt | Date |  |
| updatedBy | User |  |

### AgendaItem

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| _id | ID! |  |
| attachments | [String] |  |
| categories | [AgendaCategory] |  |
| createdAt | Date! |  |
| createdBy | User! |  |
| description | String |  |
| duration | String! |  |
| organization | Organization! |  |
| relatedEvent | Event |  |
| sequence | Int! |  |
| title | String! |  |
| updatedAt | Date! |  |
| updatedBy | User! |  |
| urls | [String] |  |
| users | [User] |  |

### AgendaItemCategoryWhereInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| name_contains | String |  |

### AgendaSection

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| _id | ID! |  |
| createdAt | Date! |  |
| createdBy | User |  |
| description | String! |  |
| items | [AgendaItem] |  |
| relatedEvent | Event |  |
| sequence | Int! |  |
| updatedAt | Date |  |
| updatedBy | User |  |

### AggregatePost

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| count | Int! |  |

### AggregateUser

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| count | Int! |  |

### Any

### AppUserProfile

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| _id | ID! |  |
| adminFor | [Organization] |  |
| appLanguageCode | String! |  |
| campaigns | [FundraisingCampaign] |  |
| createdEvents | [Event] |  |
| createdOrganizations | [Organization] |  |
| eventAdmin | [Event] |  |
| isSuperAdmin | Boolean! |  |
| pledges | [FundraisingCampaignPledge] |  |
| pluginCreationAllowed | Boolean! |  |
| userId | User! |  |

### AuthData

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| accessToken | String! |  |
| appUserProfile | AppUserProfile! |  |
| refreshToken | String! |  |
| user | User! |  |

### Boolean

The `Boolean` scalar type represents `true` or `false`.

### CampaignOrderByInput

### CampaignWhereInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| fundId | ID |  |
| id | ID |  |
| name_contains | String |  |
| organizationId | ID |  |

### Chat

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| _id | ID! |  |
| admins | [User] |  |
| createdAt | DateTime! |  |
| creator | User |  |
| image | String |  |
| isGroup | Boolean! |  |
| lastMessageId | String |  |
| messages | [ChatMessage] |  |
| name | String |  |
| organization | Organization |  |
| unseenMessagesByUsers | JSON |  |
| updatedAt | DateTime! |  |
| users | [User!]! |  |

### ChatMessage

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| _id | ID! |  |
| chatMessageBelongsTo | Chat! |  |
| createdAt | DateTime! |  |
| deletedBy | [User] |  |
| media | String |  |
| messageContent | String! |  |
| replyTo | ChatMessage |  |
| sender | User! |  |
| updatedAt | DateTime! |  |

### ChatWhereInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| name_contains | String |  |
| user | UserWhereInput |  |

### CheckIn

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| _id | ID! |  |
| createdAt | DateTime! |  |
| event | Event! |  |
| feedbackSubmitted | Boolean! |  |
| time | DateTime! |  |
| updatedAt | DateTime! |  |
| user | User! |  |

### CheckInCheckOutInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| eventId | ID! |  |
| userId | ID! |  |

### CheckInStatus

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| _id | ID! |  |
| checkIn | CheckIn |  |
| user | User! |  |

### CheckOut

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| _id | ID! |  |
| createdAt | DateTime! |  |
| eventAttendeeId | ID! |  |
| time | DateTime! |  |
| updatedAt | DateTime! |  |

### Comment

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| _id | ID! |  |
| createdAt | DateTime! |  |
| creator | User |  |
| likeCount | Int |  |
| likedBy | [User] |  |
| post | Post! |  |
| text | String! |  |
| updatedAt | DateTime! |  |

### CommentInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| text | String! |  |

### Community

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| _id | ID! |  |
| logoUrl | String |  |
| name | String! |  |
| socialMediaUrls | SocialMediaUrls |  |
| timeout | Int |  |
| websiteLink | String |  |

### ConnectionError

### ConnectionPageInfo

The standard graphQL connection page info that contains metadata about a
particular instance of a connection. ALl other custom connection page info
types must implement this interface.

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| endCursor | String | A field to tell the value of cursor for the last edge of a particular instance of a
connection. |
| hasNextPage | Boolean! | A field to tell whether the connection has additional edges after the
edge with endCursor as its cursor. |
| hasPreviousPage | Boolean! | A field to tell whether the connection has additional edges
before the edge with startCursor as its cursor. |
| startCursor | String | A field to tell the value of cursor for the first edge of a particular instance of a
connection. |

### CountryCode

### CreateActionItemInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| allottedHours | Float |  |
| assigneeId | ID! |  |
| assigneeType | String! |  |
| dueDate | Date |  |
| eventId | ID |  |
| preCompletionNotes | String |  |

### CreateAdminError

### CreateAdminPayload

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| user | AppUserProfile |  |
| userErrors | [CreateAdminError!]! |  |

### CreateAdvertisementInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| endDate | Date! |  |
| mediaFile | String! |  |
| name | String! |  |
| organizationId | ID! |  |
| startDate | Date! |  |
| type | AdvertisementType! |  |

### CreateAdvertisementPayload

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| advertisement | Advertisement |  |

### CreateAgendaCategoryInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| description | String |  |
| name | String! |  |
| organizationId | ID! |  |

### CreateAgendaItemInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| attachments | [String] |  |
| categories | [ID] |  |
| description | String |  |
| duration | String! |  |
| organizationId | ID! |  |
| relatedEventId | ID |  |
| sequence | Int! |  |
| title | String |  |
| urls | [String] |  |
| users | [ID] |  |

### CreateAgendaSectionInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| description | String! |  |
| items | [CreateAgendaItemInput] |  |
| relatedEvent | ID |  |
| sequence | Int! |  |

### CreateCommentError

### CreateCommentPayload

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| comment | Comment |  |
| userErrors | [CreateCommentError!]! |  |

### CreateMemberError

### CreateMemberPayload

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| organization | Organization |  |
| userErrors | [CreateMemberError!]! |  |

### CreateUserTagInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| name | String! |  |
| organizationId | ID! |  |
| parentTagId | ID |  |
| tagColor | String |  |

### Currency

### CursorPaginationInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| cursor | String |  |
| direction | PaginationDirection! |  |
| limit | PositiveInt! |  |

### Date

### DateTime

### DefaultConnectionPageInfo

Default connection page info for containing the metadata for a connection
instance.

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| endCursor | String |  |
| hasNextPage | Boolean! |  |
| hasPreviousPage | Boolean! |  |
| startCursor | String |  |

### DeleteAdvertisementPayload

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| advertisement | Advertisement |  |

### DeletePayload

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| success | Boolean! |  |

### Donation

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| _id | ID! |  |
| amount | Float! |  |
| createdAt | DateTime! |  |
| nameOfOrg | String! |  |
| nameOfUser | String! |  |
| orgId | ID! |  |
| payPalId | String! |  |
| updatedAt | DateTime! |  |
| userId | ID! |  |

### DonationWhereInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| id | ID |  |
| id_contains | ID |  |
| id_in | [ID!] |  |
| id_not | ID |  |
| id_not_in | [ID!] |  |
| id_starts_with | ID |  |
| name_of_user | String |  |
| name_of_user_contains | String |  |
| name_of_user_in | [String!] |  |
| name_of_user_not | String |  |
| name_of_user_not_in | [String!] |  |
| name_of_user_starts_with | String |  |

### EditVenueInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| capacity | Int |  |
| description | String |  |
| file | String |  |
| id | ID! |  |
| name | String |  |

### EducationGrade

### EmailAddress

### EmploymentStatus

### Error

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| message | String! |  |

### Event

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| _id | ID! |  |
| actionItems | [ActionItem] |  |
| admins | [User!] |  |
| agendaItems | [AgendaItem] |  |
| allDay | Boolean! |  |
| attendees | [User] |  |
| attendeesCheckInStatus | [CheckInStatus!]! |  |
| averageFeedbackScore | Float |  |
| baseRecurringEvent | Event |  |
| createdAt | DateTime! |  |
| creator | User |  |
| description | String! |  |
| endDate | Date |  |
| endTime | Time |  |
| feedback | [Feedback!]! |  |
| images | [String] |  |
| isPublic | Boolean! |  |
| isRecurringEventException | Boolean! |  |
| isRegisterable | Boolean! |  |
| latitude | Latitude |  |
| location | String |  |
| longitude | Longitude |  |
| organization | Organization |  |
| recurrenceRule | RecurrenceRule |  |
| recurring | Boolean! |  |
| startDate | Date! |  |
| startTime | Time |  |
| title | String! |  |
| updatedAt | DateTime! |  |
| volunteerGroups | [EventVolunteerGroup] |  |
| volunteers | [EventVolunteer] |  |

### EventAttendee

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| _id | ID! |  |
| checkInId | ID |  |
| checkOutId | ID |  |
| createdAt | DateTime! |  |
| eventId | ID! |  |
| isCheckedIn | Boolean! |  |
| isCheckedOut | Boolean! |  |
| isInvited | Boolean! |  |
| isRegistered | Boolean! |  |
| updatedAt | DateTime! |  |
| userId | ID! |  |

### EventAttendeeInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| eventId | ID! |  |
| userId | ID! |  |

### EventInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| allDay | Boolean! |  |
| createChat | Boolean! |  |
| description | String! |  |
| endDate | Date! |  |
| endTime | Time |  |
| images | [String] |  |
| isPublic | Boolean! |  |
| isRegisterable | Boolean! |  |
| latitude | Latitude |  |
| location | String |  |
| longitude | Longitude |  |
| organizationId | ID! |  |
| recurring | Boolean! |  |
| startDate | Date! |  |
| startTime | Time |  |
| title | String! |  |

### EventOrderByInput

### EventVolunteer

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| _id | ID! |  |
| assignments | [ActionItem] |  |
| createdAt | DateTime! |  |
| creator | User |  |
| event | Event |  |
| groups | [EventVolunteerGroup] |  |
| hasAccepted | Boolean! |  |
| hoursHistory | [HoursHistory] |  |
| hoursVolunteered | Float! |  |
| isPublic | Boolean! |  |
| updatedAt | DateTime! |  |
| user | User! |  |

### EventVolunteerGroup

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| _id | ID! |  |
| assignments | [ActionItem] |  |
| createdAt | DateTime! |  |
| creator | User |  |
| description | String |  |
| event | Event |  |
| leader | User! |  |
| name | String |  |
| updatedAt | DateTime! |  |
| volunteers | [EventVolunteer] |  |
| volunteersRequired | Int |  |

### EventVolunteerGroupInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| description | String |  |
| eventId | ID! |  |
| leaderId | ID! |  |
| name | String! |  |
| volunteerUserIds | [ID!]! |  |
| volunteersRequired | Int |  |

### EventVolunteerGroupOrderByInput

### EventVolunteerGroupWhereInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| eventId | ID |  |
| leaderName | String |  |
| name_contains | String |  |
| orgId | ID |  |
| userId | ID |  |

### EventVolunteerInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| eventId | ID! |  |
| groupId | ID |  |
| userId | ID! |  |

### EventVolunteerResponse

### EventVolunteerWhereInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| eventId | ID |  |
| groupId | ID |  |
| hasAccepted | Boolean |  |
| id | ID |  |
| name_contains | String |  |

### EventVolunteersOrderByInput

### EventWhereInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| description | String |  |
| description_contains | String |  |
| description_in | [String!] |  |
| description_not | String |  |
| description_not_in | [String!] |  |
| description_starts_with | String |  |
| id | ID |  |
| id_contains | ID |  |
| id_in | [ID!] |  |
| id_not | ID |  |
| id_not_in | [ID!] |  |
| id_starts_with | ID |  |
| location | String |  |
| location_contains | String |  |
| location_in | [String!] |  |
| location_not | String |  |
| location_not_in | [String!] |  |
| location_starts_with | String |  |
| organization_id | ID |  |
| title | String |  |
| title_contains | String |  |
| title_in | [String!] |  |
| title_not | String |  |
| title_not_in | [String!] |  |
| title_starts_with | String |  |

### ExtendSession

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| accessToken | String! |  |
| refreshToken | String! |  |

### Feedback

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| _id | ID! |  |
| createdAt | DateTime! |  |
| event | Event! |  |
| rating | Int! |  |
| review | String |  |
| updatedAt | DateTime! |  |

### FeedbackInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| eventId | ID! |  |
| rating | Int! |  |
| review | String |  |

### FieldError

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| message | String! |  |
| path | [String!]! |  |

### File

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| _id | ID! |  |
| archived | Boolean! |  |
| archivedAt | DateTime |  |
| backupStatus | String! |  |
| createdAt | DateTime! |  |
| encryption | Boolean! |  |
| fileName | String! |  |
| hash | Hash! |  |
| metadata | FileMetadata! |  |
| mimeType | String! |  |
| referenceCount | Int! |  |
| size | Int! |  |
| status | Status! |  |
| updatedAt | DateTime! |  |
| uri | String! |  |
| visibility | FileVisibility! |  |

### FileMetadata

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| bucketName | String! |  |
| objectKey | String! |  |

### FileVisibility

### Float

The `Float` scalar type represents signed double-precision fractional values as specified by [IEEE 754](https://en.wikipedia.org/wiki/IEEE_floating_point).

### ForgotPasswordData

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| newPassword | String! |  |
| otpToken | String! |  |
| userOtp | String! |  |

### Frequency

### Fund

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| _id | ID! |  |
| campaigns | [FundraisingCampaign] |  |
| createdAt | DateTime! |  |
| creator | User |  |
| isArchived | Boolean! |  |
| isDefault | Boolean! |  |
| name | String! |  |
| organizationId | ID! |  |
| refrenceNumber | String |  |
| taxDeductible | Boolean! |  |
| updatedAt | DateTime! |  |

### FundCampaignInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| currency | Currency! |  |
| endDate | Date! |  |
| fundId | ID! |  |
| fundingGoal | Float! |  |
| name | String! |  |
| organizationId | ID! |  |
| startDate | Date! |  |

### FundCampaignPledgeInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| amount | Float! |  |
| campaignId | ID! |  |
| currency | Currency! |  |
| endDate | Date |  |
| startDate | Date |  |
| userIds | [ID!]! |  |

### FundInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| isArchived | Boolean! |  |
| isDefault | Boolean! |  |
| name | String! |  |
| organizationId | ID! |  |
| refrenceNumber | String |  |
| taxDeductible | Boolean! |  |

### FundOrderByInput

### FundWhereInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| name_contains | String |  |

### FundraisingCampaign

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| _id | ID! |  |
| createdAt | DateTime! |  |
| currency | Currency! |  |
| endDate | Date! |  |
| fundId | Fund! |  |
| fundingGoal | Float! |  |
| name | String! |  |
| organizationId | Organization! |  |
| pledges | [FundraisingCampaignPledge] |  |
| startDate | Date! |  |
| updatedAt | DateTime! |  |

### FundraisingCampaignPledge

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| _id | ID! |  |
| amount | Float! |  |
| campaign | FundraisingCampaign! |  |
| currency | Currency! |  |
| endDate | Date |  |
| startDate | Date |  |
| users | [User]! |  |

### Gender

### Group

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| _id | ID! |  |
| admins | [User!]! |  |
| createdAt | DateTime! |  |
| description | String |  |
| organization | Organization! |  |
| title | String! |  |
| updatedAt | DateTime! |  |

### Hash

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| algorithm | String! |  |
| value | String! |  |

### HoursHistory

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| date | Date! |  |
| hours | Float! |  |

### ID

The `ID` scalar type represents a unique identifier, often used to refetch an object or as key for a cache. The ID type appears in a JSON response as a String; however, it is not intended to be human-readable. When expected as an input type, any string (such as `"4"`) or integer (such as `4`) input value will be accepted as an ID.

### Int

The `Int` scalar type represents non-fractional signed whole numeric values. Int can represent values between -(2^31) and 2^31 - 1.

### InvalidCursor

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| message | String! |  |
| path | [String!]! |  |

### ItemType

### JSON

### Language

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| _id | ID! |  |
| createdAt | String! |  |
| en | String! |  |
| translation | [LanguageModel] |  |

### LanguageInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| en_value | String! |  |
| translation_lang_code | String! |  |
| translation_value | String! |  |

### LanguageModel

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| _id | ID! |  |
| createdAt | DateTime! |  |
| lang_code | String! |  |
| value | String! |  |
| verified | Boolean! |  |

### Latitude

### LoginInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| email | EmailAddress! |  |
| password | String! |  |

### Longitude

### MaritalStatus

### MaximumLengthError

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| message | String! |  |
| path | [String!]! |  |

### MaximumValueError

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| limit | Int! |  |
| message | String! |  |
| path | [String!]! |  |

### MemberNotFoundError

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| message | String! |  |

### MembershipRequest

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| _id | ID! |  |
| organization | Organization! |  |
| user | User! |  |

### MembershipRequestsWhereInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| creatorId | ID |  |
| creatorId_in | [ID!] |  |
| creatorId_not | ID |  |
| creatorId_not_in | [ID!] |  |
| id | ID |  |
| id_contains | ID |  |
| id_in | [ID!] |  |
| id_not | ID |  |
| id_not_in | [ID!] |  |
| id_starts_with | ID |  |
| user | UserWhereInput |  |

### Message

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| _id | ID! |  |
| createdAt | DateTime! |  |
| creator | User |  |
| imageUrl | URL |  |
| text | String! |  |
| updatedAt | DateTime! |  |
| videoUrl | URL |  |

### MinimumLengthError

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| limit | Int! |  |
| message | String! |  |
| path | [String!]! |  |

### MinimumValueError

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| message | String! |  |
| path | [String!]! |  |

### Mutation

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| acceptMembershipRequest | MembershipRequest! |  |
| addEventAttendee | User! |  |
| addFeedback | Feedback! |  |
| addLanguageTranslation | Language! |  |
| addOrganizationCustomField | OrganizationCustomField! |  |
| addOrganizationImage | Organization! |  |
| addPeopleToUserTag | UserTag |  |
| addPledgeToFundraisingCampaign | FundraisingCampaignPledge! |  |
| addUserCustomData | UserCustomData! |  |
| addUserImage | User! |  |
| addUserToGroupChat | Chat |  |
| addUserToUserFamily | UserFamily! |  |
| assignToUserTags | UserTag |  |
| assignUserTag | User |  |
| blockPluginCreationBySuperadmin | AppUserProfile! |  |
| blockUser | User! |  |
| cancelMembershipRequest | MembershipRequest! |  |
| checkIn | CheckIn! |  |
| checkOut | CheckOut! |  |
| createActionItem | ActionItem! |  |
| createActionItemCategory | ActionItemCategory! |  |
| createAdmin | CreateAdminPayload! |  |
| createAdvertisement | CreateAdvertisementPayload |  |
| createAgendaCategory | AgendaCategory! |  |
| createAgendaItem | AgendaItem! |  |
| createAgendaSection | AgendaSection! |  |
| createChat | Chat |  |
| createComment | Comment |  |
| createDonation | Donation! |  |
| createEvent | Event! |  |
| createEventVolunteer | EventVolunteer! |  |
| createEventVolunteerGroup | EventVolunteerGroup! |  |
| createFund | Fund! |  |
| createFundraisingCampaign | FundraisingCampaign! |  |
| createFundraisingCampaignPledge | FundraisingCampaignPledge! |  |
| createMember | CreateMemberPayload! |  |
| createNote | Note! |  |
| createOrganization | Organization! |  |
| createPlugin | Plugin! |  |
| createPost | Post |  |
| createSampleOrganization | Boolean! |  |
| createUserFamily | UserFamily! |  |
| createUserTag | UserTag |  |
| createVenue | Venue |  |
| createVolunteerMembership | VolunteerMembership! |  |
| deleteAdvertisement | DeleteAdvertisementPayload |  |
| deleteAgendaCategory | ID! |  |
| deleteDonationById | DeletePayload! |  |
| deleteNote | ID! |  |
| deleteVenue | Venue |  |
| editVenue | Venue |  |
| forgotPassword | Boolean! |  |
| inviteEventAttendee | EventAttendee! |  |
| joinPublicOrganization | User! |  |
| leaveOrganization | User! |  |
| likeComment | Comment |  |
| likePost | Post |  |
| login | AuthData! |  |
| logout | Boolean! |  |
| markChatMessagesAsRead | Chat! |  |
| otp | OtpData! |  |
| recaptcha | Boolean! |  |
| refreshToken | ExtendSession! |  |
| registerEventAttendee | EventAttendee! |  |
| registerForEvent | EventAttendee! |  |
| rejectMembershipRequest | MembershipRequest! |  |
| removeActionItem | ActionItem! |  |
| removeAdmin | AppUserProfile! |  |
| removeAdvertisement | Advertisement |  |
| removeAgendaItem | AgendaItem! |  |
| removeAgendaSection | ID! |  |
| removeComment | Comment |  |
| removeEvent | Event! |  |
| removeEventAttendee | User! |  |
| removeEventVolunteer | EventVolunteer! |  |
| removeEventVolunteerGroup | EventVolunteerGroup! |  |
| removeFromUserTags | UserTag |  |
| removeFundraisingCampaignPledge | FundraisingCampaignPledge! |  |
| removeMember | Organization! |  |
| removeOrganization | UserData! |  |
| removeOrganizationCustomField | OrganizationCustomField! |  |
| removeOrganizationImage | Organization! |  |
| removePost | Post |  |
| removeSampleOrganization | Boolean! |  |
| removeUserCustomData | UserCustomData! |  |
| removeUserFamily | UserFamily! |  |
| removeUserFromUserFamily | UserFamily! |  |
| removeUserImage | User! |  |
| removeUserTag | UserTag |  |
| resetCommunity | Boolean! |  |
| revokeRefreshTokenForUser | Boolean! |  |
| saveFcmToken | Boolean! |  |
| sendMembershipRequest | MembershipRequest! |  |
| sendMessageToChat | ChatMessage! |  |
| signUp | AuthData! |  |
| togglePostPin | Post! |  |
| unassignUserTag | User |  |
| unblockUser | User! |  |
| unlikeComment | Comment |  |
| unlikePost | Post |  |
| unregisterForEventByUser | Event! |  |
| updateActionItem | ActionItem |  |
| updateActionItemCategory | ActionItemCategory |  |
| updateAdvertisement | UpdateAdvertisementPayload |  |
| updateAgendaCategory | AgendaCategory |  |
| updateAgendaItem | AgendaItem |  |
| updateAgendaSection | AgendaSection |  |
| updateChat | Chat! |  |
| updateChatMessage | ChatMessage! |  |
| updateCommunity | Boolean! |  |
| updateEvent | Event! |  |
| updateEventVolunteer | EventVolunteer! |  |
| updateEventVolunteerGroup | EventVolunteerGroup! |  |
| updateFund | Fund! |  |
| updateFundraisingCampaign | FundraisingCampaign! |  |
| updateFundraisingCampaignPledge | FundraisingCampaignPledge! |  |
| updateLanguage | User! |  |
| updateNote | Note! |  |
| updateOrganization | Organization! |  |
| updatePluginStatus | Plugin! |  |
| updatePost | Post! |  |
| updateSessionTimeout | Boolean! |  |
| updateUserPassword | UserData! |  |
| updateUserProfile | User! |  |
| updateUserRoleInOrganization | Organization! |  |
| updateUserTag | UserTag |  |
| updateVolunteerMembership | VolunteerMembership! |  |

### Note

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| _id | ID! |  |
| agendaItemId | ID! |  |
| content | String! |  |
| createdAt | DateTime! |  |
| createdBy | User! |  |
| updatedAt | DateTime! |  |
| updatedBy | User! |  |

### NoteInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| agendaItemId | ID! |  |
| content | String! |  |

### OTPInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| email | EmailAddress! |  |

### Organization

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| _id | ID! |  |
| actionItemCategories | [ActionItemCategory] |  |
| address | Address |  |
| admins | [User!] |  |
| advertisements | AdvertisementsConnection |  |
| agendaCategories | [AgendaCategory] |  |
| apiUrl | URL! |  |
| blockedUsers | [User] |  |
| createdAt | DateTime! |  |
| creator | User |  |
| customFields | [OrganizationCustomField!]! |  |
| description | String! |  |
| funds | [Fund] |  |
| image | String |  |
| members | [User] |  |
| membershipRequests | [MembershipRequest] |  |
| name | String! |  |
| pinnedPosts | [Post] |  |
| posts | PostsConnection |  |
| updatedAt | DateTime! |  |
| userRegistrationRequired | Boolean! |  |
| userTags | UserTagsConnection |  |
| venues | [Venue] |  |
| visibleInSearch | Boolean! |  |

### OrganizationCustomField

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| _id | ID! |  |
| name | String! |  |
| organizationId | String! |  |
| type | String! |  |

### OrganizationInfoNode

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| _id | ID! |  |
| apiUrl | URL! |  |
| creator | User |  |
| description | String! |  |
| image | String |  |
| name | String! |  |
| userRegistrationRequired | Boolean! |  |
| visibleInSearch | Boolean! |  |

### OrganizationInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| address | AddressInput! |  |
| apiUrl | URL |  |
| attendees | String |  |
| description | String! |  |
| image | String |  |
| name | String! |  |
| userRegistrationRequired | Boolean |  |
| visibleInSearch | Boolean |  |

### OrganizationMemberNotFoundError

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| message | String! |  |

### OrganizationNotFoundError

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| message | String! |  |

### OrganizationOrderByInput

### OrganizationWhereInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| apiUrl | URL |  |
| apiUrl_contains | URL |  |
| apiUrl_in | [URL!] |  |
| apiUrl_not | URL |  |
| apiUrl_not_in | [URL!] |  |
| apiUrl_starts_with | URL |  |
| description | String |  |
| description_contains | String |  |
| description_in | [String!] |  |
| description_not | String |  |
| description_not_in | [String!] |  |
| description_starts_with | String |  |
| id | ID |  |
| id_contains | ID |  |
| id_in | [ID!] |  |
| id_not | ID |  |
| id_not_in | [ID!] |  |
| id_starts_with | ID |  |
| name | String |  |
| name_contains | String |  |
| name_in | [String!] |  |
| name_not | String |  |
| name_not_in | [String!] |  |
| name_starts_with | String |  |
| userRegistrationRequired | Boolean |  |
| visibleInSearch | Boolean |  |

### OtpData

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| otpToken | String! |  |

### PageInfo

Information about pagination in a connection.

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| currPageNo | Int |  |
| hasNextPage | Boolean! | When paginating forwards, are there more items? |
| hasPreviousPage | Boolean! | When paginating backwards, are there more items? |
| nextPageNo | Int |  |
| prevPageNo | Int |  |
| totalPages | Int |  |

### PaginationDirection

### PhoneNumber

### PledgeOrderByInput

### PledgeWhereInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| campaignId | ID |  |
| firstName_contains | String |  |
| id | ID |  |
| name_contains | String |  |

### Plugin

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| _id | ID! |  |
| pluginCreatedBy | String! |  |
| pluginDesc | String! |  |
| pluginName | String! |  |
| uninstalledOrgs | [ID!] |  |

### PluginField

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| createdAt | DateTime! |  |
| key | String! |  |
| status | Status! |  |
| value | String! |  |

### PluginFieldInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| key | String! |  |
| value | String! |  |

### PluginInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| fields | [PluginFieldInput] |  |
| orgId | ID! |  |
| pluginKey | String |  |
| pluginName | String! |  |
| pluginType | Type |  |

### PositiveInt

### Post

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| _id | ID |  |
| commentCount | Int |  |
| comments | [Comment] |  |
| createdAt | DateTime! |  |
| creator | User |  |
| file | File |  |
| likeCount | Int |  |
| likedBy | [User] |  |
| organization | Organization! |  |
| pinned | Boolean |  |
| text | String! |  |
| title | String |  |
| updatedAt | DateTime! |  |

### PostEdge

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| cursor | String! |  |
| node | Post! |  |

### PostInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| _id | ID |  |
| imageUrl | URL |  |
| organizationId | ID! |  |
| pinned | Boolean |  |
| text | String! |  |
| title | String |  |
| videoUrl | URL |  |

### PostNotFoundError

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| message | String! |  |

### PostOrderByInput

### PostUpdateInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| imageUrl | String |  |
| text | String |  |
| title | String |  |
| videoUrl | String |  |

### PostWhereInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| id | ID |  |
| id_contains | ID |  |
| id_in | [ID!] |  |
| id_not | ID |  |
| id_not_in | [ID!] |  |
| id_starts_with | ID |  |
| text | String |  |
| text_contains | String |  |
| text_in | [String!] |  |
| text_not | String |  |
| text_not_in | [String!] |  |
| text_starts_with | String |  |
| title | String |  |
| title_contains | String |  |
| title_in | [String!] |  |
| title_not | String |  |
| title_not_in | [String!] |  |
| title_starts_with | String |  |

### PostsConnection

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| edges | [PostEdge!]! |  |
| pageInfo | DefaultConnectionPageInfo! |  |
| totalCount | Int |  |

### Query

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| actionItemCategoriesByOrganization | [ActionItemCategory] |  |
| actionItemsByEvent | [ActionItem] |  |
| actionItemsByOrganization | [ActionItem] |  |
| actionItemsByUser | [ActionItem] |  |
| adminPlugin | [Plugin] |  |
| advertisementsConnection | AdvertisementsConnection |  |
| agendaCategory | AgendaCategory! |  |
| agendaItemByEvent | [AgendaItem] |  |
| agendaItemByOrganization | [AgendaItem] |  |
| agendaItemCategoriesByOrganization | [AgendaCategory] |  |
| chatById | Chat! |  |
| chatsByUserId | [Chat] |  |
| checkAuth | User! |  |
| customDataByOrganization | [UserCustomData!]! |  |
| customFieldsByOrganization | [OrganizationCustomField] |  |
| event | Event |  |
| eventsAttendedByUser | [Event] |  |
| eventsByOrganization | [Event] |  |
| eventsByOrganizationConnection | [Event!]! |  |
| fundsByOrganization | [Fund] |  |
| getAgendaItem | AgendaItem |  |
| getAgendaSection | AgendaSection |  |
| getAllAgendaItems | [AgendaItem] |  |
| getAllNotesForAgendaItem | [Note] |  |
| getCommunityData | Community |  |
| getDonationById | Donation! |  |
| getDonationByOrgId | [Donation] |  |
| getDonationByOrgIdConnection | [Donation!]! |  |
| getEventAttendee | EventAttendee |  |
| getEventAttendeesByEventId | [EventAttendee] |  |
| getEventInvitesByUserId | [EventAttendee!]! |  |
| getEventVolunteerGroups | [EventVolunteerGroup]! |  |
| getEventVolunteers | [EventVolunteer]! |  |
| getFundById | Fund! |  |
| getFundraisingCampaignPledgeById | FundraisingCampaignPledge! |  |
| getFundraisingCampaigns | [FundraisingCampaign]! |  |
| getGroupChatsByUserId | [Chat] |  |
| getNoteById | Note! |  |
| getPledgesByUserId | [FundraisingCampaignPledge] |  |
| getPlugins | [Plugin] |  |
| getRecurringEvents | [Event] |  |
| getUnreadChatsByUserId | [Chat] |  |
| getUserTag | UserTag |  |
| getVenueByOrgId | [Venue] |  |
| getVolunteerMembership | [VolunteerMembership]! |  |
| getVolunteerRanks | [VolunteerRank]! |  |
| getlanguage | [Translation] |  |
| hasSubmittedFeedback | Boolean |  |
| isSampleOrganization | Boolean! |  |
| joinedOrganizations | [Organization] |  |
| me | UserData! |  |
| myLanguage | String |  |
| organizations | [Organization] |  |
| organizationsConnection | [Organization]! |  |
| organizationsMemberConnection | UserConnection! |  |
| plugin | [Plugin] |  |
| post | Post |  |
| registeredEventsByUser | [Event] |  |
| registrantsByEvent | [User] |  |
| user | UserData! |  |
| userLanguage | String |  |
| users | [UserData] |  |
| usersConnection | [UserData]! |  |
| venue | Venue |  |

### RecaptchaVerification

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| recaptchaToken | String! |  |

### RecurrenceRule

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| baseRecurringEvent | Event |  |
| count | PositiveInt |  |
| frequency | Frequency! |  |
| interval | PositiveInt! |  |
| latestInstanceDate | Date |  |
| organization | Organization |  |
| recurrenceEndDate | Date |  |
| recurrenceRuleString | String! |  |
| recurrenceStartDate | Date! |  |
| weekDayOccurenceInMonth | Int |  |
| weekDays | [WeekDays] |  |

### RecurrenceRuleInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| count | PositiveInt |  |
| frequency | Frequency |  |
| interval | PositiveInt |  |
| recurrenceEndDate | Date |  |
| recurrenceStartDate | Date |  |
| weekDayOccurenceInMonth | Int |  |
| weekDays | [WeekDays] |  |

### RecurringEventMutationType

### SocialMediaUrls

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| X | String |  |
| facebook | String |  |
| gitHub | String |  |
| instagram | String |  |
| linkedIn | String |  |
| reddit | String |  |
| slack | String |  |
| youTube | String |  |

### SocialMediaUrlsInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| X | String |  |
| facebook | String |  |
| gitHub | String |  |
| instagram | String |  |
| linkedIn | String |  |
| reddit | String |  |
| slack | String |  |
| youTube | String |  |

### SortedByOrder

Possible variants of ordering in which sorting on a field should be
applied for a connection or other list type data structures.

### Status

### String

The `String` scalar type represents textual data, represented as UTF-8 character sequences. The String type is most often used by GraphQL to represent free-form human-readable text.

### Subscription

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| messageSentToChat | ChatMessage |  |
| onPluginUpdate | Plugin |  |

### TagActionsInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| currentTagId | ID! |  |
| selectedTagIds | [ID!]! |  |

### Time

### ToggleUserTagAssignInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| tagId | ID! |  |
| userId | ID! |  |

### Translation

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| en_value | String |  |
| lang_code | String |  |
| translation | String |  |
| verified | Boolean |  |

### Type

### URL

### UnauthenticatedError

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| message | String! |  |

### UnauthorizedError

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| message | String! |  |

### UpdateActionItemCategoryInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| isDisabled | Boolean |  |
| name | String |  |

### UpdateActionItemInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| allottedHours | Float |  |
| assigneeId | ID |  |
| assigneeType | String |  |
| completionDate | Date |  |
| dueDate | Date |  |
| isCompleted | Boolean |  |
| postCompletionNotes | String |  |
| preCompletionNotes | String |  |

### UpdateAdvertisementInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| _id | ID! |  |
| endDate | Date |  |
| mediaFile | String |  |
| name | String |  |
| startDate | Date |  |
| type | AdvertisementType |  |

### UpdateAdvertisementPayload

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| advertisement | Advertisement |  |

### UpdateAgendaCategoryInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| description | String |  |
| name | String |  |

### UpdateAgendaItemInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| attachments | [String] |  |
| categories | [ID] |  |
| description | String |  |
| duration | String |  |
| relatedEvent | ID |  |
| sequence | Int |  |
| title | String |  |
| urls | [String] |  |
| users | [ID] |  |

### UpdateAgendaSectionInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| description | String |  |
| relatedEvent | ID |  |
| sequence | Int |  |

### UpdateChatInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| _id | ID! |  |
| image | String |  |
| name | String |  |

### UpdateChatMessageInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| chatId | ID! |  |
| messageContent | String! |  |
| messageId | ID! |  |

### UpdateCommunityInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| logo | String! |  |
| name | String! |  |
| socialMediaUrls | SocialMediaUrlsInput! |  |
| websiteLink | String! |  |

### UpdateEventInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| allDay | Boolean |  |
| description | String |  |
| endDate | Date |  |
| endTime | Time |  |
| images | [String] |  |
| isPublic | Boolean |  |
| isRecurringEventException | Boolean |  |
| isRegisterable | Boolean |  |
| latitude | Latitude |  |
| location | String |  |
| longitude | Longitude |  |
| recurring | Boolean |  |
| startDate | Date |  |
| startTime | Time |  |
| title | String |  |

### UpdateEventVolunteerGroupInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| description | String |  |
| eventId | ID! |  |
| name | String |  |
| volunteersRequired | Int |  |

### UpdateEventVolunteerInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| assignments | [ID] |  |
| hasAccepted | Boolean |  |
| isPublic | Boolean |  |

### UpdateFundCampaignInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| currency | Currency |  |
| endDate | Date |  |
| fundingGoal | Float |  |
| name | String |  |
| startDate | Date |  |

### UpdateFundCampaignPledgeInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| amount | Float |  |
| currency | Currency |  |
| endDate | Date |  |
| startDate | Date |  |
| users | [ID] |  |

### UpdateFundInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| isArchived | Boolean |  |
| isDefault | Boolean |  |
| name | String |  |
| refrenceNumber | String |  |
| taxDeductible | Boolean |  |

### UpdateNoteInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| content | String |  |
| updatedBy | ID! |  |

### UpdateOrganizationInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| address | AddressInput |  |
| description | String |  |
| name | String |  |
| userRegistrationRequired | Boolean |  |
| visibleInSearch | Boolean |  |

### UpdateUserInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| address | AddressInput |  |
| appLanguageCode | String |  |
| birthDate | Date |  |
| educationGrade | EducationGrade |  |
| email | EmailAddress |  |
| employmentStatus | EmploymentStatus |  |
| firstName | String |  |
| gender | Gender |  |
| lastName | String |  |
| maritalStatus | MaritalStatus |  |
| phone | UserPhoneInput |  |

### UpdateUserPasswordInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| confirmNewPassword | String! |  |
| newPassword | String! |  |
| previousPassword | String! |  |

### UpdateUserTagInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| name | String! |  |
| tagColor | String |  |
| tagId | ID! |  |

### Upload

### User

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| _id | ID! |  |
| address | Address |  |
| appUserProfileId | AppUserProfile |  |
| birthDate | Date |  |
| createdAt | DateTime! |  |
| educationGrade | EducationGrade |  |
| email | EmailAddress! |  |
| employmentStatus | EmploymentStatus |  |
| eventAdmin | [Event] |  |
| eventsAttended | [Event] |  |
| file | File |  |
| firstName | String! |  |
| gender | Gender |  |
| identifier | Int! |  |
| image | String |  |
| joinedOrganizations | [Organization] |  |
| lastName | String! |  |
| maritalStatus | MaritalStatus |  |
| membershipRequests | [MembershipRequest] |  |
| organizationsBlockedBy | [Organization] |  |
| phone | UserPhone |  |
| pluginCreationAllowed | Boolean! |  |
| posts | PostsConnection |  |
| registeredEvents | [Event] |  |
| tagsAssignedWith | UserTagsConnection |  |
| updatedAt | DateTime! |  |

### UserAndOrganizationInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| organizationId | ID! |  |
| userId | ID! |  |

### UserConnection

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| aggregate | AggregateUser! |  |
| edges | [User]! |  |
| pageInfo | PageInfo! |  |

### UserCustomData

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| _id | ID! |  |
| organizationId | ID! |  |
| userId | ID! |  |
| values | JSON! |  |

### UserData

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| appUserProfile | AppUserProfile |  |
| user | User! |  |

### UserFamily

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| _id | ID! |  |
| admins | [User!]! |  |
| creator | User! |  |
| title | String |  |
| users | [User!]! |  |

### UserInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| appLanguageCode | String |  |
| email | EmailAddress! |  |
| firstName | String! |  |
| lastName | String! |  |
| password | String! |  |
| selectedOrganization | ID! |  |

### UserNameWhereInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| starts_with | String! |  |

### UserNotAuthorizedAdminError

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| message | String! |  |

### UserNotAuthorizedError

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| message | String! |  |

### UserNotFoundError

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| message | String! |  |

### UserOrderByInput

### UserPhone

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| home | PhoneNumber |  |
| mobile | PhoneNumber |  |
| work | PhoneNumber |  |

### UserPhoneInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| home | PhoneNumber |  |
| mobile | PhoneNumber |  |
| work | PhoneNumber |  |

### UserTag

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| _id | ID! | A field to get the mongodb object id identifier for this UserTag. |
| ancestorTags | [UserTag] | A field to traverse the ancestor tags of this UserTag. |
| childTags | UserTagsConnection | A connection field to traverse a list of UserTag this UserTag is a
parent to. |
| name | String! | A field to get the name of this UserTag. |
| organization | Organization | A field to traverse the Organization that created this UserTag. |
| parentTag | UserTag | A field to traverse the parent UserTag of this UserTag. |
| usersAssignedTo | UsersConnection | A connection field to traverse a list of User this UserTag is assigned
to. |
| usersToAssignTo | UsersConnection | A connection field to traverse a list of Users this UserTag is not assigned
to, to see and select among them and assign this tag. |

### UserTagNameWhereInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| starts_with | String! |  |

### UserTagSortedByInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| id | SortedByOrder! |  |

### UserTagUsersAssignedToSortedByInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| id | SortedByOrder! |  |

### UserTagUsersAssignedToWhereInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| firstName | UserNameWhereInput |  |
| lastName | UserNameWhereInput |  |

### UserTagUsersToAssignToWhereInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| firstName | UserNameWhereInput |  |
| lastName | UserNameWhereInput |  |

### UserTagWhereInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| name | UserTagNameWhereInput |  |

### UserTagsConnection

A default connection on the UserTag type.

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| edges | [UserTagsConnectionEdge!]! |  |
| pageInfo | DefaultConnectionPageInfo! |  |
| totalCount | Int |  |

### UserTagsConnectionEdge

A default connection edge on the UserTag type for UserTagsConnection.

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| cursor | String! |  |
| node | UserTag! |  |

### UserType

### UserWhereInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| email | EmailAddress |  |
| email_contains | EmailAddress |  |
| email_in | [EmailAddress!] |  |
| email_not | EmailAddress |  |
| email_not_in | [EmailAddress!] |  |
| email_starts_with | EmailAddress |  |
| event_title_contains | String |  |
| firstName | String |  |
| firstName_contains | String |  |
| firstName_in | [String!] |  |
| firstName_not | String |  |
| firstName_not_in | [String!] |  |
| firstName_starts_with | String |  |
| id | ID |  |
| id_contains | ID |  |
| id_in | [ID!] |  |
| id_not | ID |  |
| id_not_in | [ID!] |  |
| id_starts_with | ID |  |
| lastName | String |  |
| lastName_contains | String |  |
| lastName_in | [String!] |  |
| lastName_not | String |  |
| lastName_not_in | [String!] |  |
| lastName_starts_with | String |  |

### UsersConnection

A default connection on the User type.

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| edges | [UsersConnectionEdge!]! |  |
| pageInfo | DefaultConnectionPageInfo! |  |
| totalCount | Int |  |

### UsersConnectionEdge

A default connection edge on the User type for UsersConnection.

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| cursor | String! |  |
| node | User! |  |

### Venue

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| _id | ID! |  |
| capacity | Int! |  |
| description | String |  |
| imageUrl | URL |  |
| name | String! |  |
| organization | Organization! |  |

### VenueInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| capacity | Int! |  |
| description | String |  |
| file | String |  |
| name | String! |  |
| organizationId | ID! |  |

### VenueOrderByInput

### VenueWhereInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| description_contains | String |  |
| description_starts_with | String |  |
| name_contains | String |  |
| name_starts_with | String |  |

### VolunteerMembership

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| _id | ID! |  |
| createdAt | DateTime! |  |
| createdBy | User |  |
| event | Event! |  |
| group | EventVolunteerGroup |  |
| status | String! |  |
| updatedAt | DateTime! |  |
| updatedBy | User |  |
| volunteer | EventVolunteer! |  |

### VolunteerMembershipInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| event | ID! |  |
| group | ID |  |
| status | String! |  |
| userId | ID! |  |

### VolunteerMembershipOrderByInput

### VolunteerMembershipWhereInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| eventId | ID |  |
| eventTitle | String |  |
| filter | String |  |
| groupId | ID |  |
| status | String |  |
| userId | ID |  |
| userName | String |  |

### VolunteerRank

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| hoursVolunteered | Float! |  |
| rank | Int! |  |
| user | User! |  |

### VolunteerRankWhereInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| limit | Int |  |
| nameContains | String |  |
| orderBy | String! |  |
| timeFrame | String! |  |

### WeekDays

### chatInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| image | String |  |
| isGroup | Boolean! |  |
| name | String |  |
| organizationId | ID |  |
| userIds | [ID!]! |  |

### createGroupChatInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| organizationId | ID! |  |
| title | String! |  |
| userIds | [ID!]! |  |

### createUserFamilyInput

#### Fields

| Field | Type | Description |
|-------|------|-------------|
| title | String! |  |
| userIds | [ID!]! |  |

