[**talawa-api**](../../../README.md)

***

# Type Alias: ResolversUnionTypes\<_RefType\>

> **ResolversUnionTypes**\<`_RefType`\>: `object`

Mapping of union types

## Type Parameters

• **_RefType** *extends* `Record`\<`string`, `unknown`\>

## Type declaration

### ConnectionError

> **ConnectionError**: [`InvalidCursor`](InvalidCursor.md) \| [`MaximumValueError`](MaximumValueError.md)

### CreateAdminError

> **CreateAdminError**: [`OrganizationMemberNotFoundError`](OrganizationMemberNotFoundError.md) \| [`OrganizationNotFoundError`](OrganizationNotFoundError.md) \| [`UserNotAuthorizedError`](UserNotAuthorizedError.md) \| [`UserNotFoundError`](UserNotFoundError.md)

### CreateCommentError

> **CreateCommentError**: [`PostNotFoundError`](PostNotFoundError.md)

### CreateMemberError

> **CreateMemberError**: [`MemberNotFoundError`](MemberNotFoundError.md) \| [`OrganizationNotFoundError`](OrganizationNotFoundError.md) \| [`UserNotAuthorizedAdminError`](UserNotAuthorizedAdminError.md) \| [`UserNotAuthorizedError`](UserNotAuthorizedError.md) \| [`UserNotFoundError`](UserNotFoundError.md)

## Defined in

[src/types/generatedGraphQLTypes.ts:3488](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/types/generatedGraphQLTypes.ts#L3488)
