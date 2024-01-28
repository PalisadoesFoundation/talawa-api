[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Query/organizationsConnection

# Module: resolvers/Query/organizationsConnection

## Table of contents

### Variables

- [organizationsConnection](resolvers_Query_organizationsConnection.md#organizationsconnection)

## Variables

### organizationsConnection

• `Const` **organizationsConnection**: [`QueryResolvers`](types_generatedGraphQLTypes.md#queryresolvers)[``"organizationsConnection"``]

This query will retrieve from the database a list of
organisation under the specified limit for the specified page in the pagination.

**`Param`**

**`Param`**

An object holds the data required to execute the query.
`args.first` specifies the number of members to retrieve, and `args.after` specifies
the unique identification for each item in the returned list.

**`Remarks`**

Connection in graphQL means pagination,
learn more about Connection [here](https://relay.dev/graphql/connections.htm).

#### Defined in

[src/resolvers/Query/organizationsConnection.ts:18](https://github.com/PalisadoesFoundation/talawa-api/blob/de4debc/src/resolvers/Query/organizationsConnection.ts#L18)
