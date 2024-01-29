[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Mutation/cancelMembershipRequest

# Module: resolvers/Mutation/cancelMembershipRequest

## Table of contents

### Variables

- [cancelMembershipRequest](resolvers_Mutation_cancelMembershipRequest.md#cancelmembershiprequest)

## Variables

### cancelMembershipRequest

• `Const` **cancelMembershipRequest**: [`MutationResolvers`](types_generatedGraphQLTypes.md#mutationresolvers)[``"cancelMembershipRequest"``]

This function enables to cancel membership request.

**`Param`**

parent of current request

**`Param`**

payload provided with the request

**`Param`**

context of entire application

**`Remarks`**

The following checks are done:
1. If the membership request exists
2. If the organization exists
3. If the user exists
4. If the user is the creator of the request

#### Defined in

[src/resolvers/Mutation/cancelMembershipRequest.ts:24](https://github.com/PalisadoesFoundation/talawa-api/blob/c199cfb/src/resolvers/Mutation/cancelMembershipRequest.ts#L24)
