[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Mutation/login

# Module: resolvers/Mutation/login

## Table of contents

### Variables

- [login](resolvers_Mutation_login.md#login)

## Variables

### login

• `Const` **login**: [`MutationResolvers`](types_generatedGraphQLTypes.md#mutationresolvers)[``"login"``]

This function enables login.

**`Param`**

parent of current request

**`Param`**

payload provided with the request

**`Remarks`**

The following checks are done:
1. If the user exists
2. If the password is valid

#### Defined in

[src/resolvers/Mutation/login.ts:26](https://github.com/Veer0x1/talawa-api/blob/4ede423/src/resolvers/Mutation/login.ts#L26)
