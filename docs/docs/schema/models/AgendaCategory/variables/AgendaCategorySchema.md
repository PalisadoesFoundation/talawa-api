[Admin Docs](/)

***

# Variable: AgendaCategorySchema

> `const` **AgendaCategorySchema**: `Schema`\<`Model`, \{ `createdAt`: `Date`; `createdBy`: `ObjectId`; `description`: `string`; `name`: `string`; `organizationId`: `ObjectId`; `updatedAt`: `Date`; `updatedBy`: `ObjectId`; \}, `Document`\<`unknown`, \{\}, `FlatRecord`\<\{ `createdAt`: `Date`; `createdBy`: `ObjectId`; `description`: `string`; `name`: `string`; `organizationId`: `ObjectId`; `updatedAt`: `Date`; `updatedBy`: `ObjectId`; \}\>\> & `FlatRecord`\<\{ `createdAt`: `Date`; `createdBy`: `ObjectId`; `description`: `string`; `name`: `string`; `organizationId`: `ObjectId`; `updatedAt`: `Date`; `updatedBy`: `ObjectId`; \}\> & `object`\>

Mongoose schema definition for an agenda category document.

## Param

Name of the agenda category.

## Param

Optional description of the agenda category.

## Param

Reference to the organization associated with the agenda category.

## Param

Reference to the user who created the agenda category.

## Param

Reference to the user who last updated the agenda category.

## Param

Date when the agenda category was created.

## Param

Date when the agenda category was last updated.

## Defined in

[src/models/AgendaCategory.ts:32](https://github.com/Suyash878/talawa-api/blob/cfd688207611ba245c99edd8dbaccb2cdbf6a043/src/models/AgendaCategory.ts#L32)
