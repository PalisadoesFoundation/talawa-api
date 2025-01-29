[Admin Docs](/)

***

# Type Alias: ActionItem

> **ActionItem**: `object`

## Type declaration

### \_\_typename?

> `optional` **\_\_typename**: `"ActionItem"`

### \_id

> **\_id**: [`Scalars`](Scalars.md)\[`"ID"`\]\[`"output"`\]

### actionItemCategory?

> `optional` **actionItemCategory**: [`Maybe`](Maybe.md)\<[`ActionItemCategory`](ActionItemCategory.md)\>

### allottedHours?

> `optional` **allottedHours**: [`Maybe`](Maybe.md)\<[`Scalars`](Scalars.md)\[`"Float"`\]\[`"output"`\]\>

### assignee?

> `optional` **assignee**: [`Maybe`](Maybe.md)\<[`EventVolunteer`](EventVolunteer.md)\>

### assigneeGroup?

> `optional` **assigneeGroup**: [`Maybe`](Maybe.md)\<[`EventVolunteerGroup`](EventVolunteerGroup.md)\>

### assigneeType

> **assigneeType**: [`Scalars`](Scalars.md)\[`"String"`\]\[`"output"`\]

### assigneeUser?

> `optional` **assigneeUser**: [`Maybe`](Maybe.md)\<[`User`](User.md)\>

### assigner?

> `optional` **assigner**: [`Maybe`](Maybe.md)\<[`User`](User.md)\>

### assignmentDate

> **assignmentDate**: [`Scalars`](Scalars.md)\[`"Date"`\]\[`"output"`\]

### completionDate

> **completionDate**: [`Scalars`](Scalars.md)\[`"Date"`\]\[`"output"`\]

### createdAt

> **createdAt**: [`Scalars`](Scalars.md)\[`"Date"`\]\[`"output"`\]

### creator?

> `optional` **creator**: [`Maybe`](Maybe.md)\<[`User`](User.md)\>

### dueDate

> **dueDate**: [`Scalars`](Scalars.md)\[`"Date"`\]\[`"output"`\]

### event?

> `optional` **event**: [`Maybe`](Maybe.md)\<[`Event`](Event.md)\>

### isCompleted

> **isCompleted**: [`Scalars`](Scalars.md)\[`"Boolean"`\]\[`"output"`\]

### postCompletionNotes?

> `optional` **postCompletionNotes**: [`Maybe`](Maybe.md)\<[`Scalars`](Scalars.md)\[`"String"`\]\[`"output"`\]\>

### preCompletionNotes?

> `optional` **preCompletionNotes**: [`Maybe`](Maybe.md)\<[`Scalars`](Scalars.md)\[`"String"`\]\[`"output"`\]\>

### updatedAt

> **updatedAt**: [`Scalars`](Scalars.md)\[`"Date"`\]\[`"output"`\]

## Defined in

[src/types/generatedGraphQLTypes.ts:69](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/types/generatedGraphQLTypes.ts#L69)
