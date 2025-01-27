[**talawa-api**](../../../README.md)

***

# Type Alias: Query

> **Query**: `object`

## Type declaration

### \_\_typename?

> `optional` **\_\_typename**: `"Query"`

### actionItemCategoriesByOrganization?

> `optional` **actionItemCategoriesByOrganization**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`ActionItemCategory`](ActionItemCategory.md)\>[]\>

### actionItemsByEvent?

> `optional` **actionItemsByEvent**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`ActionItem`](ActionItem.md)\>[]\>

### actionItemsByOrganization?

> `optional` **actionItemsByOrganization**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`ActionItem`](ActionItem.md)\>[]\>

### actionItemsByUser?

> `optional` **actionItemsByUser**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`ActionItem`](ActionItem.md)\>[]\>

### adminPlugin?

> `optional` **adminPlugin**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`Plugin`](Plugin.md)\>[]\>

### advertisementsConnection?

> `optional` **advertisementsConnection**: [`Maybe`](Maybe.md)\<[`AdvertisementsConnection`](AdvertisementsConnection.md)\>

### agendaCategory

> **agendaCategory**: [`AgendaCategory`](AgendaCategory.md)

### agendaItemByEvent?

> `optional` **agendaItemByEvent**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`AgendaItem`](AgendaItem.md)\>[]\>

### agendaItemByOrganization?

> `optional` **agendaItemByOrganization**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`AgendaItem`](AgendaItem.md)\>[]\>

### agendaItemCategoriesByOrganization?

> `optional` **agendaItemCategoriesByOrganization**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`AgendaCategory`](AgendaCategory.md)\>[]\>

### chatById

> **chatById**: [`Chat`](Chat.md)

### chatsByUserId?

> `optional` **chatsByUserId**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`Chat`](Chat.md)\>[]\>

### checkAuth

> **checkAuth**: [`User`](User.md)

### customDataByOrganization

> **customDataByOrganization**: [`UserCustomData`](UserCustomData.md)[]

### customFieldsByOrganization?

> `optional` **customFieldsByOrganization**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`OrganizationCustomField`](OrganizationCustomField.md)\>[]\>

### event?

> `optional` **event**: [`Maybe`](Maybe.md)\<[`Event`](Event.md)\>

### eventsAttendedByUser?

> `optional` **eventsAttendedByUser**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`Event`](Event.md)\>[]\>

### eventsByOrganization?

> `optional` **eventsByOrganization**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`Event`](Event.md)\>[]\>

### eventsByOrganizationConnection

> **eventsByOrganizationConnection**: [`Event`](Event.md)[]

### fundsByOrganization?

> `optional` **fundsByOrganization**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`Fund`](Fund.md)\>[]\>

### getAgendaItem?

> `optional` **getAgendaItem**: [`Maybe`](Maybe.md)\<[`AgendaItem`](AgendaItem.md)\>

### getAgendaSection?

> `optional` **getAgendaSection**: [`Maybe`](Maybe.md)\<[`AgendaSection`](AgendaSection.md)\>

### getAllAgendaItems?

> `optional` **getAllAgendaItems**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`AgendaItem`](AgendaItem.md)\>[]\>

### getAllNotesForAgendaItem?

> `optional` **getAllNotesForAgendaItem**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`Note`](Note.md)\>[]\>

### getCommunityData?

> `optional` **getCommunityData**: [`Maybe`](Maybe.md)\<[`Community`](Community.md)\>

### getDonationById

> **getDonationById**: [`Donation`](Donation.md)

### getDonationByOrgId?

> `optional` **getDonationByOrgId**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`Donation`](Donation.md)\>[]\>

### getDonationByOrgIdConnection

> **getDonationByOrgIdConnection**: [`Donation`](Donation.md)[]

### getEventAttendee?

> `optional` **getEventAttendee**: [`Maybe`](Maybe.md)\<[`EventAttendee`](EventAttendee.md)\>

### getEventAttendeesByEventId?

> `optional` **getEventAttendeesByEventId**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`EventAttendee`](EventAttendee.md)\>[]\>

### getEventInvitesByUserId

> **getEventInvitesByUserId**: [`EventAttendee`](EventAttendee.md)[]

### getEventVolunteerGroups

> **getEventVolunteerGroups**: [`Maybe`](Maybe.md)\<[`EventVolunteerGroup`](EventVolunteerGroup.md)\>[]

### getEventVolunteers

> **getEventVolunteers**: [`Maybe`](Maybe.md)\<[`EventVolunteer`](EventVolunteer.md)\>[]

### getFundById

> **getFundById**: [`Fund`](Fund.md)

### getFundraisingCampaignPledgeById

> **getFundraisingCampaignPledgeById**: [`FundraisingCampaignPledge`](FundraisingCampaignPledge.md)

### getFundraisingCampaigns

> **getFundraisingCampaigns**: [`Maybe`](Maybe.md)\<[`FundraisingCampaign`](FundraisingCampaign.md)\>[]

### getGroupChatsByUserId?

> `optional` **getGroupChatsByUserId**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`Chat`](Chat.md)\>[]\>

### getlanguage?

> `optional` **getlanguage**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`Translation`](Translation.md)\>[]\>

### getNoteById

> **getNoteById**: [`Note`](Note.md)

### getPledgesByUserId?

> `optional` **getPledgesByUserId**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`FundraisingCampaignPledge`](FundraisingCampaignPledge.md)\>[]\>

### getPlugins?

> `optional` **getPlugins**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`Plugin`](Plugin.md)\>[]\>

### getRecurringEvents?

> `optional` **getRecurringEvents**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`Event`](Event.md)\>[]\>

### getUnreadChatsByUserId?

> `optional` **getUnreadChatsByUserId**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`Chat`](Chat.md)\>[]\>

### getUserTag?

> `optional` **getUserTag**: [`Maybe`](Maybe.md)\<[`UserTag`](UserTag.md)\>

### getVenueByOrgId?

> `optional` **getVenueByOrgId**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`Venue`](Venue.md)\>[]\>

### getVolunteerMembership

> **getVolunteerMembership**: [`Maybe`](Maybe.md)\<[`VolunteerMembership`](VolunteerMembership.md)\>[]

### getVolunteerRanks

> **getVolunteerRanks**: [`Maybe`](Maybe.md)\<[`VolunteerRank`](VolunteerRank.md)\>[]

### hasSubmittedFeedback?

> `optional` **hasSubmittedFeedback**: [`Maybe`](Maybe.md)\<[`Scalars`](Scalars.md)\[`"Boolean"`\]\[`"output"`\]\>

### isSampleOrganization

> **isSampleOrganization**: [`Scalars`](Scalars.md)\[`"Boolean"`\]\[`"output"`\]

### joinedOrganizations?

> `optional` **joinedOrganizations**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`Organization`](Organization.md)\>[]\>

### me

> **me**: [`UserData`](UserData.md)

### myLanguage?

> `optional` **myLanguage**: [`Maybe`](Maybe.md)\<[`Scalars`](Scalars.md)\[`"String"`\]\[`"output"`\]\>

### organizations?

> `optional` **organizations**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`Organization`](Organization.md)\>[]\>

### organizationsConnection

> **organizationsConnection**: [`Maybe`](Maybe.md)\<[`Organization`](Organization.md)\>[]

### organizationsMemberConnection

> **organizationsMemberConnection**: [`UserConnection`](UserConnection.md)

### plugin?

> `optional` **plugin**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`Plugin`](Plugin.md)\>[]\>

### post?

> `optional` **post**: [`Maybe`](Maybe.md)\<[`Post`](Post.md)\>

### registeredEventsByUser?

> `optional` **registeredEventsByUser**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`Event`](Event.md)\>[]\>

### registrantsByEvent?

> `optional` **registrantsByEvent**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`User`](User.md)\>[]\>

### user

> **user**: [`UserData`](UserData.md)

### userLanguage?

> `optional` **userLanguage**: [`Maybe`](Maybe.md)\<[`Scalars`](Scalars.md)\[`"String"`\]\[`"output"`\]\>

### users?

> `optional` **users**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`UserData`](UserData.md)\>[]\>

### usersConnection

> **usersConnection**: [`Maybe`](Maybe.md)\<[`UserData`](UserData.md)\>[]

### venue?

> `optional` **venue**: [`Maybe`](Maybe.md)\<[`Venue`](Venue.md)\>

## Defined in

[src/types/generatedGraphQLTypes.ts:2344](https://github.com/Suyash878/talawa-api/blob/095e6964ce2a06c1c30d1acf81b6162203f1db91/src/types/generatedGraphQLTypes.ts#L2344)
