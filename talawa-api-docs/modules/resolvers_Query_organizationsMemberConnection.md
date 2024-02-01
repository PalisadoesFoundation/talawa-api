[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Query/organizationsMemberConnection

# Module: resolvers/Query/organizationsMemberConnection

## Table of contents

### Variables

- [organizationsMemberConnection](resolvers_Query_organizationsMemberConnection.md#organizationsmemberconnection)

## Variables

### organizationsMemberConnection

• `Const` **organizationsMemberConnection**: [`QueryResolvers`](types_generatedGraphQLTypes.md#queryresolvers)[``"organizationsMemberConnection"``]

This query will retrieve from the database a list of members
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

[src/resolvers/Query/organizationsMemberConnection.ts:19](https://github.com/PalisadoesFoundation/talawa-api/blob/3677888/src/resolvers/Query/organizationsMemberConnection.ts#L19)
