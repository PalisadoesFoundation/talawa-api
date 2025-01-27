[**talawa-api**](../../../README.md)

***

# Type Alias: QueryResolvers\<ContextType, ParentType\>

> **QueryResolvers**\<`ContextType`, `ParentType`\>: `object`

## Type Parameters

• **ContextType** = `any`

• **ParentType** *extends* [`ResolversParentTypes`](ResolversParentTypes.md)\[`"Query"`\] = [`ResolversParentTypes`](ResolversParentTypes.md)\[`"Query"`\]

## Type declaration

### actionItemCategoriesByOrganization?

> `optional` **actionItemCategoriesByOrganization**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"ActionItemCategory"`\]\>[]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`QueryActionItemCategoriesByOrganizationArgs`](QueryActionItemCategoriesByOrganizationArgs.md), `"organizationId"`\>\>

### actionItemsByEvent?

> `optional` **actionItemsByEvent**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"ActionItem"`\]\>[]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`QueryActionItemsByEventArgs`](QueryActionItemsByEventArgs.md), `"eventId"`\>\>

### actionItemsByOrganization?

> `optional` **actionItemsByOrganization**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"ActionItem"`\]\>[]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`QueryActionItemsByOrganizationArgs`](QueryActionItemsByOrganizationArgs.md), `"organizationId"`\>\>

### actionItemsByUser?

> `optional` **actionItemsByUser**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"ActionItem"`\]\>[]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`QueryActionItemsByUserArgs`](QueryActionItemsByUserArgs.md), `"userId"`\>\>

### adminPlugin?

> `optional` **adminPlugin**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Plugin"`\]\>[]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`QueryAdminPluginArgs`](QueryAdminPluginArgs.md), `"orgId"`\>\>

### advertisementsConnection?

> `optional` **advertisementsConnection**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"AdvertisementsConnection"`\]\>, `ParentType`, `ContextType`, `Partial`\<[`QueryAdvertisementsConnectionArgs`](QueryAdvertisementsConnectionArgs.md)\>\>

### agendaCategory?

> `optional` **agendaCategory**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"AgendaCategory"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`QueryAgendaCategoryArgs`](QueryAgendaCategoryArgs.md), `"id"`\>\>

### agendaItemByEvent?

> `optional` **agendaItemByEvent**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"AgendaItem"`\]\>[]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`QueryAgendaItemByEventArgs`](QueryAgendaItemByEventArgs.md), `"relatedEventId"`\>\>

### agendaItemByOrganization?

> `optional` **agendaItemByOrganization**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"AgendaItem"`\]\>[]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`QueryAgendaItemByOrganizationArgs`](QueryAgendaItemByOrganizationArgs.md), `"organizationId"`\>\>

### agendaItemCategoriesByOrganization?

> `optional` **agendaItemCategoriesByOrganization**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"AgendaCategory"`\]\>[]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`QueryAgendaItemCategoriesByOrganizationArgs`](QueryAgendaItemCategoriesByOrganizationArgs.md), `"organizationId"`\>\>

### chatById?

> `optional` **chatById**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Chat"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`QueryChatByIdArgs`](QueryChatByIdArgs.md), `"id"`\>\>

### chatsByUserId?

> `optional` **chatsByUserId**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Chat"`\]\>[]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`QueryChatsByUserIdArgs`](QueryChatsByUserIdArgs.md), `"id"`\>\>

### checkAuth?

> `optional` **checkAuth**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"User"`\], `ParentType`, `ContextType`\>

### customDataByOrganization?

> `optional` **customDataByOrganization**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"UserCustomData"`\][], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`QueryCustomDataByOrganizationArgs`](QueryCustomDataByOrganizationArgs.md), `"organizationId"`\>\>

### customFieldsByOrganization?

> `optional` **customFieldsByOrganization**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"OrganizationCustomField"`\]\>[]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`QueryCustomFieldsByOrganizationArgs`](QueryCustomFieldsByOrganizationArgs.md), `"id"`\>\>

### event?

> `optional` **event**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Event"`\]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`QueryEventArgs`](QueryEventArgs.md), `"id"`\>\>

### eventsAttendedByUser?

> `optional` **eventsAttendedByUser**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Event"`\]\>[]\>, `ParentType`, `ContextType`, `Partial`\<[`QueryEventsAttendedByUserArgs`](QueryEventsAttendedByUserArgs.md)\>\>

### eventsByOrganization?

> `optional` **eventsByOrganization**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Event"`\]\>[]\>, `ParentType`, `ContextType`, `Partial`\<[`QueryEventsByOrganizationArgs`](QueryEventsByOrganizationArgs.md)\>\>

### eventsByOrganizationConnection?

> `optional` **eventsByOrganizationConnection**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Event"`\][], `ParentType`, `ContextType`, `Partial`\<[`QueryEventsByOrganizationConnectionArgs`](QueryEventsByOrganizationConnectionArgs.md)\>\>

### fundsByOrganization?

> `optional` **fundsByOrganization**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Fund"`\]\>[]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`QueryFundsByOrganizationArgs`](QueryFundsByOrganizationArgs.md), `"organizationId"`\>\>

### getAgendaItem?

> `optional` **getAgendaItem**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"AgendaItem"`\]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`QueryGetAgendaItemArgs`](QueryGetAgendaItemArgs.md), `"id"`\>\>

### getAgendaSection?

> `optional` **getAgendaSection**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"AgendaSection"`\]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`QueryGetAgendaSectionArgs`](QueryGetAgendaSectionArgs.md), `"id"`\>\>

### getAllAgendaItems?

> `optional` **getAllAgendaItems**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"AgendaItem"`\]\>[]\>, `ParentType`, `ContextType`\>

### getAllNotesForAgendaItem?

> `optional` **getAllNotesForAgendaItem**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Note"`\]\>[]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`QueryGetAllNotesForAgendaItemArgs`](QueryGetAllNotesForAgendaItemArgs.md), `"agendaItemId"`\>\>

### getCommunityData?

> `optional` **getCommunityData**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Community"`\]\>, `ParentType`, `ContextType`\>

### getDonationById?

> `optional` **getDonationById**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Donation"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`QueryGetDonationByIdArgs`](QueryGetDonationByIdArgs.md), `"id"`\>\>

### getDonationByOrgId?

> `optional` **getDonationByOrgId**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Donation"`\]\>[]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`QueryGetDonationByOrgIdArgs`](QueryGetDonationByOrgIdArgs.md), `"orgId"`\>\>

### getDonationByOrgIdConnection?

> `optional` **getDonationByOrgIdConnection**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Donation"`\][], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`QueryGetDonationByOrgIdConnectionArgs`](QueryGetDonationByOrgIdConnectionArgs.md), `"orgId"`\>\>

### getEventAttendee?

> `optional` **getEventAttendee**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"EventAttendee"`\]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`QueryGetEventAttendeeArgs`](QueryGetEventAttendeeArgs.md), `"eventId"` \| `"userId"`\>\>

### getEventAttendeesByEventId?

> `optional` **getEventAttendeesByEventId**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"EventAttendee"`\]\>[]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`QueryGetEventAttendeesByEventIdArgs`](QueryGetEventAttendeesByEventIdArgs.md), `"eventId"`\>\>

### getEventInvitesByUserId?

> `optional` **getEventInvitesByUserId**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"EventAttendee"`\][], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`QueryGetEventInvitesByUserIdArgs`](QueryGetEventInvitesByUserIdArgs.md), `"userId"`\>\>

### getEventVolunteerGroups?

> `optional` **getEventVolunteerGroups**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"EventVolunteerGroup"`\]\>[], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`QueryGetEventVolunteerGroupsArgs`](QueryGetEventVolunteerGroupsArgs.md), `"where"`\>\>

### getEventVolunteers?

> `optional` **getEventVolunteers**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"EventVolunteer"`\]\>[], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`QueryGetEventVolunteersArgs`](QueryGetEventVolunteersArgs.md), `"where"`\>\>

### getFundById?

> `optional` **getFundById**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Fund"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`QueryGetFundByIdArgs`](QueryGetFundByIdArgs.md), `"id"`\>\>

### getFundraisingCampaignPledgeById?

> `optional` **getFundraisingCampaignPledgeById**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"FundraisingCampaignPledge"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`QueryGetFundraisingCampaignPledgeByIdArgs`](QueryGetFundraisingCampaignPledgeByIdArgs.md), `"id"`\>\>

### getFundraisingCampaigns?

> `optional` **getFundraisingCampaigns**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"FundraisingCampaign"`\]\>[], `ParentType`, `ContextType`, `Partial`\<[`QueryGetFundraisingCampaignsArgs`](QueryGetFundraisingCampaignsArgs.md)\>\>

### getGroupChatsByUserId?

> `optional` **getGroupChatsByUserId**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Chat"`\]\>[]\>, `ParentType`, `ContextType`\>

### getlanguage?

> `optional` **getlanguage**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Translation"`\]\>[]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`QueryGetlanguageArgs`](QueryGetlanguageArgs.md), `"lang_code"`\>\>

### getNoteById?

> `optional` **getNoteById**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Note"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`QueryGetNoteByIdArgs`](QueryGetNoteByIdArgs.md), `"id"`\>\>

### getPledgesByUserId?

> `optional` **getPledgesByUserId**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"FundraisingCampaignPledge"`\]\>[]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`QueryGetPledgesByUserIdArgs`](QueryGetPledgesByUserIdArgs.md), `"userId"`\>\>

### getPlugins?

> `optional` **getPlugins**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Plugin"`\]\>[]\>, `ParentType`, `ContextType`\>

### getRecurringEvents?

> `optional` **getRecurringEvents**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Event"`\]\>[]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`QueryGetRecurringEventsArgs`](QueryGetRecurringEventsArgs.md), `"baseRecurringEventId"`\>\>

### getUnreadChatsByUserId?

> `optional` **getUnreadChatsByUserId**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Chat"`\]\>[]\>, `ParentType`, `ContextType`\>

### getUserTag?

> `optional` **getUserTag**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"UserTag"`\]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`QueryGetUserTagArgs`](QueryGetUserTagArgs.md), `"id"`\>\>

### getVenueByOrgId?

> `optional` **getVenueByOrgId**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Venue"`\]\>[]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`QueryGetVenueByOrgIdArgs`](QueryGetVenueByOrgIdArgs.md), `"orgId"`\>\>

### getVolunteerMembership?

> `optional` **getVolunteerMembership**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"VolunteerMembership"`\]\>[], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`QueryGetVolunteerMembershipArgs`](QueryGetVolunteerMembershipArgs.md), `"where"`\>\>

### getVolunteerRanks?

> `optional` **getVolunteerRanks**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"VolunteerRank"`\]\>[], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`QueryGetVolunteerRanksArgs`](QueryGetVolunteerRanksArgs.md), `"orgId"` \| `"where"`\>\>

### hasSubmittedFeedback?

> `optional` **hasSubmittedFeedback**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Boolean"`\]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`QueryHasSubmittedFeedbackArgs`](QueryHasSubmittedFeedbackArgs.md), `"eventId"` \| `"userId"`\>\>

### isSampleOrganization?

> `optional` **isSampleOrganization**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Boolean"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`QueryIsSampleOrganizationArgs`](QueryIsSampleOrganizationArgs.md), `"id"`\>\>

### joinedOrganizations?

> `optional` **joinedOrganizations**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Organization"`\]\>[]\>, `ParentType`, `ContextType`, `Partial`\<[`QueryJoinedOrganizationsArgs`](QueryJoinedOrganizationsArgs.md)\>\>

### me?

> `optional` **me**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"UserData"`\], `ParentType`, `ContextType`\>

### myLanguage?

> `optional` **myLanguage**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"String"`\]\>, `ParentType`, `ContextType`\>

### organizations?

> `optional` **organizations**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Organization"`\]\>[]\>, `ParentType`, `ContextType`, `Partial`\<[`QueryOrganizationsArgs`](QueryOrganizationsArgs.md)\>\>

### organizationsConnection?

> `optional` **organizationsConnection**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Organization"`\]\>[], `ParentType`, `ContextType`, `Partial`\<[`QueryOrganizationsConnectionArgs`](QueryOrganizationsConnectionArgs.md)\>\>

### organizationsMemberConnection?

> `optional` **organizationsMemberConnection**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"UserConnection"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`QueryOrganizationsMemberConnectionArgs`](QueryOrganizationsMemberConnectionArgs.md), `"orgId"`\>\>

### plugin?

> `optional` **plugin**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Plugin"`\]\>[]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`QueryPluginArgs`](QueryPluginArgs.md), `"orgId"`\>\>

### post?

> `optional` **post**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Post"`\]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`QueryPostArgs`](QueryPostArgs.md), `"id"`\>\>

### registeredEventsByUser?

> `optional` **registeredEventsByUser**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Event"`\]\>[]\>, `ParentType`, `ContextType`, `Partial`\<[`QueryRegisteredEventsByUserArgs`](QueryRegisteredEventsByUserArgs.md)\>\>

### registrantsByEvent?

> `optional` **registrantsByEvent**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"User"`\]\>[]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`QueryRegistrantsByEventArgs`](QueryRegistrantsByEventArgs.md), `"id"`\>\>

### user?

> `optional` **user**: [`Resolver`](Resolver.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"UserData"`\], `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`QueryUserArgs`](QueryUserArgs.md), `"id"`\>\>

### userLanguage?

> `optional` **userLanguage**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"String"`\]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`QueryUserLanguageArgs`](QueryUserLanguageArgs.md), `"userId"`\>\>

### users?

> `optional` **users**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"UserData"`\]\>[]\>, `ParentType`, `ContextType`, `Partial`\<[`QueryUsersArgs`](QueryUsersArgs.md)\>\>

### usersConnection?

> `optional` **usersConnection**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"UserData"`\]\>[], `ParentType`, `ContextType`, `Partial`\<[`QueryUsersConnectionArgs`](QueryUsersConnectionArgs.md)\>\>

### venue?

> `optional` **venue**: [`Resolver`](Resolver.md)\<[`Maybe`](Maybe.md)\<[`ResolversTypes`](ResolversTypes.md)\[`"Venue"`\]\>, `ParentType`, `ContextType`, [`RequireFields`](RequireFields.md)\<[`QueryVenueArgs`](QueryVenueArgs.md), `"id"`\>\>

## Defined in

[src/types/generatedGraphQLTypes.ts:4841](https://github.com/Suyash878/talawa-api/blob/095e6964ce2a06c1c30d1acf81b6162203f1db91/src/types/generatedGraphQLTypes.ts#L4841)
