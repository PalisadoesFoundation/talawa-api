[**talawa-api**](../../../README.md)

***

# Variable: NoteSchema

> `const` **NoteSchema**: `Schema`\<`Model`, \{ `agendaItemId`: `ObjectId`; `content`: `string`; `createdAt`: `Date`; `createdBy`: `ObjectId`; `updatedAt`: `Date`; `updatedBy`: `ObjectId`; \}, `Document`\<`unknown`, \{\}, `FlatRecord`\<\{ `agendaItemId`: `ObjectId`; `content`: `string`; `createdAt`: `Date`; `createdBy`: `ObjectId`; `updatedAt`: `Date`; `updatedBy`: `ObjectId`; \}\>\> & `FlatRecord`\<\{ `agendaItemId`: `ObjectId`; `content`: `string`; `createdAt`: `Date`; `createdBy`: `ObjectId`; `updatedAt`: `Date`; `updatedBy`: `ObjectId`; \}\> & `object`\>

Mongoose schema definition for Note documents.

## Param

The content of the note.

## Param

The ID of the user who created the note.

## Param

Optional: The ID of the user who last updated the note.

## Param

The date when the note was created.

## Param

Optional: The date when the note was last updated.

## Param

The ID of the agenda item associated with the note.

## Defined in

[src/models/Note.ts:29](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/models/Note.ts#L29)
