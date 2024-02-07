[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Mutation/blockPluginCreationBySuperadmin

# Module: resolvers/Mutation/blockPluginCreationBySuperadmin

## Table of contents

### Variables

- [blockPluginCreationBySuperadmin](resolvers_Mutation_blockPluginCreationBySuperadmin.md#blockplugincreationbysuperadmin)

## Variables

### blockPluginCreationBySuperadmin

• `Const` **blockPluginCreationBySuperadmin**: [`MutationResolvers`](types_generatedGraphQLTypes.md#mutationresolvers)[``"blockPluginCreationBySuperadmin"``]

This function enables an admin to create block plugin.

**`Param`**

parent of current request

**`Param`**

payload provided with the request

**`Param`**

context of entire application

**`Remarks`**

The following checks are done:
1. If the user exists
2. If the user is the SUPERADMIN of organization

#### Defined in

[src/resolvers/Mutation/blockPluginCreationBySuperadmin.ts:16](https://github.com/PalisadoesFoundation/talawa-api/blob/cf57ca9/src/resolvers/Mutation/blockPluginCreationBySuperadmin.ts#L16)
