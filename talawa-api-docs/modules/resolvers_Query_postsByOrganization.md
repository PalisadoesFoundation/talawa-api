[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Query/postsByOrganization

# Module: resolvers/Query/postsByOrganization

## Table of contents

### Variables

- [postsByOrganization](resolvers_Query_postsByOrganization.md#postsbyorganization)

## Variables

### postsByOrganization

• `Const` **postsByOrganization**: [`QueryResolvers`](types_generatedGraphQLTypes.md#queryresolvers)[``"postsByOrganization"``]

This query will fetch the list of all post within an Organization from database.

**`Param`**

**`Param`**

An object that contains `id` of the organization, `orderBy` fields.

**`Remarks`**

The query function uses `getSort()` function to sort the data in specified order.

#### Defined in

[src/resolvers/Query/postsByOrganization.ts:13](https://github.com/PalisadoesFoundation/talawa-api/blob/cf57ca9/src/resolvers/Query/postsByOrganization.ts#L13)
