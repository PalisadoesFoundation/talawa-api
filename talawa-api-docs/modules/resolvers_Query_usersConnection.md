[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Query/usersConnection

# Module: resolvers/Query/usersConnection

## Table of contents

### Variables

- [usersConnection](resolvers_Query_usersConnection.md#usersconnection)

## Variables

### usersConnection

• `Const` **usersConnection**: [`QueryResolvers`](types_generatedGraphQLTypes.md#queryresolvers)[``"usersConnection"``]

This query will fetch all the users in a specified order to paginate from the database.

**`Param`**

**`Param`**

An object that contains relevant data to execute the query.

**`Remarks`**

Connection in graphQL means pagination,
learn more about Connection [here](https://relay.dev/graphql/connections.htm).

#### Defined in

[src/resolvers/Query/usersConnection.ts:15](https://github.com/PalisadoesFoundation/talawa-api/blob/e7d3a46/src/resolvers/Query/usersConnection.ts#L15)
