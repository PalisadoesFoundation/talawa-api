[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Mutation/joinPublicOrganization

# Module: resolvers/Mutation/joinPublicOrganization

## Table of contents

### Variables

- [joinPublicOrganization](resolvers_Mutation_joinPublicOrganization.md#joinpublicorganization)

## Variables

### joinPublicOrganization

• `Const` **joinPublicOrganization**: [`MutationResolvers`](types_generatedGraphQLTypes.md#mutationresolvers)[``"joinPublicOrganization"``]

This function enables to join a public organization.

**`Param`**

parent of current request

**`Param`**

payload provided with the request

**`Param`**

context of entire application

**`Remarks`**

The following checks are done:
1. If the organization exists
2. If the organization required user registration
3. If the user exists
4. If the user is already a member of the organization.

#### Defined in

[src/resolvers/Mutation/joinPublicOrganization.ts:25](https://github.com/PalisadoesFoundation/talawa-api/blob/cf57ca9/src/resolvers/Mutation/joinPublicOrganization.ts#L25)
