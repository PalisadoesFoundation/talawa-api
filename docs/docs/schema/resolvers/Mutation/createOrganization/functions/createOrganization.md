[**talawa-api**](../../../../README.md)

***

# Function: createOrganization()

> **createOrganization**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceOrganization`](../../../../models/Organization/interfaces/InterfaceOrganization.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceOrganization`](../../../../models/Organization/interfaces/InterfaceOrganization.md)\>\>

Creates a new organization.

This resolver performs the following steps:

1. Verifies the existence of the current user making the request.
2. Checks the user's app profile to ensure they are authenticated and authorized as a super admin.
3. Validates the provided input data, including organization name, description, and address.
4. Uploads an optional image file associated with the organization.
5. Creates a new organization with the provided data and image.
6. Creates a default action item category for the new organization.
7. Updates the current user's document to include the new organization in their `joinedOrganizations`, `createdOrganizations`, and `adminFor` lists.
8. Caches the newly created organization.

## Parameters

### parent

### args

`Partial`\<[`MutationCreateOrganizationArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationCreateOrganizationArgs.md)\>

The input arguments for the mutation, including:
  - `data`: An object containing:
    - `name`: The name of the organization.
    - `description`: A description of the organization.
    - `address`: An optional address object for the organization.
  - `file`: An optional encoded image file for the organization.

### context

`any`

The context object containing user information (context.userId).

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceOrganization`](../../../../models/Organization/interfaces/InterfaceOrganization.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceOrganization`](../../../../models/Organization/interfaces/InterfaceOrganization.md)\>\>

The created organization object.

## Remarks

This function creates an organization, uploads an optional image, validates the input data, creates a default action item category, updates user records, and manages caching.

## Defined in

[src/resolvers/Mutation/createOrganization.ts:55](https://github.com/Suyash878/talawa-api/blob/f376d03c37e9acd046e7cc983947432c95f74442/src/resolvers/Mutation/createOrganization.ts#L55)
