[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Query/postsByOrganizationConnection

# Module: resolvers/Query/postsByOrganizationConnection

## Table of contents

### Variables

- [postsByOrganizationConnection](resolvers_Query_postsByOrganizationConnection.md#postsbyorganizationconnection)

## Variables

### postsByOrganizationConnection

• `Const` **postsByOrganizationConnection**: [`QueryResolvers`](types_generatedGraphQLTypes.md#queryresolvers)[``"postsByOrganizationConnection"``]

This query will retrieve from the database a list of posts
in the organisation under the specified limit for the specified page in the pagination.

**`Param`**

**`Param`**

An object holds the data required to execute the query.
`args.first` specifies the number of members to retrieve, and `args.after` specifies
the unique identification for each item in the returned list.

**`Remarks`**

Connection in graphQL means pagination,
learn more about Connection [here](https://relay.dev/graphql/connections.htm).

#### Defined in

[src/resolvers/Query/postsByOrganizationConnection.ts:19](https://github.com/PalisadoesFoundation/talawa-api/blob/612a320/src/resolvers/Query/postsByOrganizationConnection.ts#L19)
