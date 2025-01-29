[**talawa-api**](../../../../README.md)

***

# Function: organizations()

> **organizations**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceOrganization`](../../../../models/Organization/interfaces/InterfaceOrganization.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceOrganization`](../../../../models/Organization/interfaces/InterfaceOrganization.md)\>[]\>

If a 'id' is specified, this query will return an organisation;
otherwise, it will return all organisations with a size of limit 100.

## Parameters

### parent

### args

`Partial`\<[`QueryOrganizationsArgs`](../../../../types/generatedGraphQLTypes/type-aliases/QueryOrganizationsArgs.md)\>

An object containing `orderBy` and `id` of the Organization.

### context

`any`

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceOrganization`](../../../../models/Organization/interfaces/InterfaceOrganization.md)\>[] \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceOrganization`](../../../../models/Organization/interfaces/InterfaceOrganization.md)\>[]\>

The organization if valid `id` is provided else return organizations with size limit 100.

## Remarks

`id` in the args is optional.

## Defined in

[src/resolvers/Query/organizations.ts:16](https://github.com/Suyash878/talawa-api/blob/b5a9d8b4a1ea678a3d6f5b710b3721f91a3052fc/src/resolvers/Query/organizations.ts#L16)
