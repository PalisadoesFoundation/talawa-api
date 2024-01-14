[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Mutation/rejectMembershipRequest

# Module: resolvers/Mutation/rejectMembershipRequest

## Table of contents

### Variables

- [rejectMembershipRequest](resolvers_Mutation_rejectMembershipRequest.md#rejectmembershiprequest)

## Variables

### rejectMembershipRequest

• `Const` **rejectMembershipRequest**: [`MutationResolvers`](types_generatedGraphQLTypes.md#mutationresolvers)[``"rejectMembershipRequest"``]

This function enables to reject membership request.

**`Param`**

parent of current request

**`Param`**

payload provided with the request

**`Param`**

context of entire application

**`Remarks`**

The following checks are done:
1. If the membership request exists.
2. If the organization exists.
3. If the user to be rejected exists.
4. If the user is the admin of the organization.

#### Defined in

[src/resolvers/Mutation/rejectMembershipRequest.ts:23](https://github.com/PalisadoesFoundation/talawa-api/blob/55cb3be/src/resolvers/Mutation/rejectMembershipRequest.ts#L23)
