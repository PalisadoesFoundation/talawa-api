[**talawa-api**](../../../README.md)

***

# Variable: AgendaItemSchema

> `const` **AgendaItemSchema**: `Schema`\<`Model`, \{ `attachments`: `string`[]; `categories`: `ObjectId`[]; `createdAt`: `Date`; `createdBy`: `ObjectId`; `description`: `string`; `duration`: `string`; `itemType`: [`ItemType`](../enumerations/ItemType.md); `notes`: `ObjectId`[]; `organizationId`: `ObjectId`; `relatedEventId`: `ObjectId`; `sequence`: `number`; `title`: `string`; `updatedAt`: `Date`; `updatedBy`: `ObjectId`; `urls`: `string`[]; `users`: `ObjectId`[]; \}, `Document`\<`unknown`, \{\}, `FlatRecord`\<\{ `attachments`: `string`[]; `categories`: `ObjectId`[]; `createdAt`: `Date`; `createdBy`: `ObjectId`; `description`: `string`; `duration`: `string`; `itemType`: [`ItemType`](../enumerations/ItemType.md); `notes`: `ObjectId`[]; `organizationId`: `ObjectId`; `relatedEventId`: `ObjectId`; `sequence`: `number`; `title`: `string`; `updatedAt`: `Date`; `updatedBy`: `ObjectId`; `urls`: `string`[]; `users`: `ObjectId`[]; \}\>\> & `FlatRecord`\<\{ `attachments`: `string`[]; `categories`: `ObjectId`[]; `createdAt`: `Date`; `createdBy`: `ObjectId`; `description`: `string`; `duration`: `string`; `itemType`: [`ItemType`](../enumerations/ItemType.md); `notes`: `ObjectId`[]; `organizationId`: `ObjectId`; `relatedEventId`: `ObjectId`; `sequence`: `number`; `title`: `string`; `updatedAt`: `Date`; `updatedBy`: `ObjectId`; `urls`: `string`[]; `users`: `ObjectId`[]; \}\> & `object`\>

Mongoose schema definition for an agenda item document.

## Param

Title of the agenda item.

## Param

Optional description of the agenda item.

## Param

Reference to the event associated with the agenda item.

## Param

Duration of the agenda item.

## Param

Optional array of attachment URLs.

## Param

Reference to the user who created the agenda item.

## Param

Reference to the user who last updated the agenda item.

## Param

Optional array of URLs related to the agenda item.

## Param

Optional array of users associated with the agenda item.

## Param

Optional array of agenda categories associated with the agenda item.

## Param

Sequence number of the agenda item.

## Param

Type of the agenda item (Regular or Note).

## Param

Date when the agenda item was created.

## Param

Date when the agenda item was last updated.

## Param

Reference to the organization associated with the agenda item.

## Param

Array of notes associated with the agenda item.

## Defined in

[src/models/AgendaItem.ts:61](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/models/AgendaItem.ts#L61)
