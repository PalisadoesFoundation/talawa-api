[talawa-api](../README.md) / [Exports](../modules.md) / resolvers/Mutation/createActionItem

# Module: resolvers/Mutation/createActionItem

## Table of contents

### Variables

- [createActionItem](resolvers_Mutation_createActionItem.md#createactionitem)

## Variables

### createActionItem

• `Const` **createActionItem**: [`MutationResolvers`](types_generatedGraphQLTypes.md#mutationresolvers)[``"createActionItem"``]

This function enables to create an action item.

**`Param`**

parent of current request

**`Param`**

payload provided with the request

**`Param`**

context of entire application

**`Remarks`**

The following checks are done:
1. If the user exists
3. If the asignee exists
4. If the actionItemCategory exists
5. If the asignee is a member of the organization
6. If the user is a member of the organization
7. If the event exists (if action item related to an event)
8. If the user is authorized.

#### Defined in

[src/resolvers/Mutation/createActionItem.ts:32](https://github.com/PalisadoesFoundation/talawa-api/blob/2c2e70a/src/resolvers/Mutation/createActionItem.ts#L32)
