[**talawa-api**](../../../README.md)

***

# Variable: AgendaSectionSchema

> `const` **AgendaSectionSchema**: `Schema`\<`Model`, \{ `createdAt`: `Date`; `createdBy`: `ObjectId`; `description`: `string`; `items`: `ObjectId`[]; `relatedEvent`: `ObjectId`; `sequence`: `number`; `updatedAt`: `Date`; \}, `Document`\<`unknown`, \{\}, `FlatRecord`\<\{ `createdAt`: `Date`; `createdBy`: `ObjectId`; `description`: `string`; `items`: `ObjectId`[]; `relatedEvent`: `ObjectId`; `sequence`: `number`; `updatedAt`: `Date`; \}\>\> & `FlatRecord`\<\{ `createdAt`: `Date`; `createdBy`: `ObjectId`; `description`: `string`; `items`: `ObjectId`[]; `relatedEvent`: `ObjectId`; `sequence`: `number`; `updatedAt`: `Date`; \}\> & `object`\>

This is the Mongoose schema for an agenda section.

## Param

Reference to the event associated with the agenda section.

## Param

Description of the agenda section.

## Param

Array of agenda items associated with the agenda section.

## Param

Sequence number of the agenda section.

## Param

Reference to the user who created the agenda section.

## Param

Date when the agenda section was created.

## Param

Date when the agenda section was last updated.

## Defined in

[src/models/AgendaSection.ts:34](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/models/AgendaSection.ts#L34)
