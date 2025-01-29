[Admin Docs](/)

***

# Type Alias: Event

> **Event**: `object`

## Type declaration

### \_\_typename?

> `optional` **\_\_typename**: `"Event"`

### \_id

> **\_id**: [`Scalars`](Scalars.md)\[`"ID"`\]\[`"output"`\]

### actionItems?

> `optional` **actionItems**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`ActionItem`](ActionItem.md)\>[]\>

### admins?

> `optional` **admins**: [`Maybe`](Maybe.md)\<[`User`](User.md)[]\>

### agendaItems?

> `optional` **agendaItems**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`AgendaItem`](AgendaItem.md)\>[]\>

### allDay

> **allDay**: [`Scalars`](Scalars.md)\[`"Boolean"`\]\[`"output"`\]

### attendees?

> `optional` **attendees**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`User`](User.md)\>[]\>

### attendeesCheckInStatus

> **attendeesCheckInStatus**: [`CheckInStatus`](CheckInStatus.md)[]

### averageFeedbackScore?

> `optional` **averageFeedbackScore**: [`Maybe`](Maybe.md)\<[`Scalars`](Scalars.md)\[`"Float"`\]\[`"output"`\]\>

### baseRecurringEvent?

> `optional` **baseRecurringEvent**: [`Maybe`](Maybe.md)\<[`Event`](Event.md)\>

### createdAt

> **createdAt**: [`Scalars`](Scalars.md)\[`"DateTime"`\]\[`"output"`\]

### creator?

> `optional` **creator**: [`Maybe`](Maybe.md)\<[`User`](User.md)\>

### description

> **description**: [`Scalars`](Scalars.md)\[`"String"`\]\[`"output"`\]

### endDate?

> `optional` **endDate**: [`Maybe`](Maybe.md)\<[`Scalars`](Scalars.md)\[`"Date"`\]\[`"output"`\]\>

### endTime?

> `optional` **endTime**: [`Maybe`](Maybe.md)\<[`Scalars`](Scalars.md)\[`"Time"`\]\[`"output"`\]\>

### feedback

> **feedback**: [`Feedback`](Feedback.md)[]

### images?

> `optional` **images**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`Scalars`](Scalars.md)\[`"String"`\]\[`"output"`\]\>[]\>

### isPublic

> **isPublic**: [`Scalars`](Scalars.md)\[`"Boolean"`\]\[`"output"`\]

### isRecurringEventException

> **isRecurringEventException**: [`Scalars`](Scalars.md)\[`"Boolean"`\]\[`"output"`\]

### isRegisterable

> **isRegisterable**: [`Scalars`](Scalars.md)\[`"Boolean"`\]\[`"output"`\]

### latitude?

> `optional` **latitude**: [`Maybe`](Maybe.md)\<[`Scalars`](Scalars.md)\[`"Latitude"`\]\[`"output"`\]\>

### location?

> `optional` **location**: [`Maybe`](Maybe.md)\<[`Scalars`](Scalars.md)\[`"String"`\]\[`"output"`\]\>

### longitude?

> `optional` **longitude**: [`Maybe`](Maybe.md)\<[`Scalars`](Scalars.md)\[`"Longitude"`\]\[`"output"`\]\>

### organization?

> `optional` **organization**: [`Maybe`](Maybe.md)\<[`Organization`](Organization.md)\>

### recurrenceRule?

> `optional` **recurrenceRule**: [`Maybe`](Maybe.md)\<[`RecurrenceRule`](RecurrenceRule.md)\>

### recurring

> **recurring**: [`Scalars`](Scalars.md)\[`"Boolean"`\]\[`"output"`\]

### startDate

> **startDate**: [`Scalars`](Scalars.md)\[`"Date"`\]\[`"output"`\]

### startTime?

> `optional` **startTime**: [`Maybe`](Maybe.md)\<[`Scalars`](Scalars.md)\[`"Time"`\]\[`"output"`\]\>

### title

> **title**: [`Scalars`](Scalars.md)\[`"String"`\]\[`"output"`\]

### updatedAt

> **updatedAt**: [`Scalars`](Scalars.md)\[`"DateTime"`\]\[`"output"`\]

### volunteerGroups?

> `optional` **volunteerGroups**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`EventVolunteerGroup`](EventVolunteerGroup.md)\>[]\>

### volunteers?

> `optional` **volunteers**: [`Maybe`](Maybe.md)\<[`Maybe`](Maybe.md)\<[`EventVolunteer`](EventVolunteer.md)\>[]\>

## Defined in

[src/types/generatedGraphQLTypes.ts:737](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/types/generatedGraphQLTypes.ts#L737)
