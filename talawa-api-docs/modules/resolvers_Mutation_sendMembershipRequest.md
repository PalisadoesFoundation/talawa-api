[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Mutation/sendMembershipRequest

# Module: resolvers/Mutation/sendMembershipRequest

## Table of contents

### Variables

- [sendMembershipRequest](resolvers_Mutation_sendMembershipRequest.md#sendmembershiprequest)

## Variables

### sendMembershipRequest

• `Const` **sendMembershipRequest**: [`MutationResolvers`](types_generatedGraphQLTypes.md#mutationresolvers)[``"sendMembershipRequest"``]

This function enables to send membership request.

**`Param`**

parent of current request

**`Param`**

payload provided with the request

**`Param`**

context of entire application

**`Remarks`**

The following checks are done:
1. If the user exists.
2. If the organization exists
3. If the membership request already exists.

#### Defined in

[src/resolvers/Mutation/sendMembershipRequest.ts:21](https://github.com/PalisadoesFoundation/talawa-api/blob/1bb35e9/src/resolvers/Mutation/sendMembershipRequest.ts#L21)
