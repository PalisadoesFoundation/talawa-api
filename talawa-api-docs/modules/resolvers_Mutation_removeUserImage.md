[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Mutation/removeUserImage

# Module: resolvers/Mutation/removeUserImage

## Table of contents

### Variables

- [removeUserImage](resolvers_Mutation_removeUserImage.md#removeuserimage)

## Variables

### removeUserImage

• `Const` **removeUserImage**: [`MutationResolvers`](types_generatedGraphQLTypes.md#mutationresolvers)[``"removeUserImage"``]

This function enables to remove user image.

**`Param`**

parent of current request

**`Param`**

payload provided with the request

**`Param`**

context of entire application

**`Remarks`**

The following checks are done:
1. If the user exists.
2. If the image exists

#### Defined in

[src/resolvers/Mutation/removeUserImage.ts:19](https://github.com/PalisadoesFoundation/talawa-api/blob/4e2c75b/src/resolvers/Mutation/removeUserImage.ts#L19)
