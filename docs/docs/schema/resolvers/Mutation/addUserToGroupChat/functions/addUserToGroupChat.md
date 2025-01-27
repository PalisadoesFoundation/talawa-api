[**talawa-api**](../../../../README.md)

***

# Function: addUserToGroupChat()

> **addUserToGroupChat**(`parent`, `args`, `context`, `info`?): [`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceChat`](../../../../models/Chat/interfaces/InterfaceChat.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceChat`](../../../../models/Chat/interfaces/InterfaceChat.md)\>\>

Mutation resolver function to add a user to a group chat.

This function performs the following actions:
1. Verifies that the current user exists.
2. Ensures that the chat specified by `args.input.chatId` exists and is a group chat.
3. Checks whether the current user is an admin of the chat.
4. Verifies that the user to be added as an admin exists.
5. Ensures that the organization specified by `args.input.organizationId` exists.
6. Adds the user to the chat's admins list.

## Parameters

### parent

### args

[`RequireFields`](../../../../types/generatedGraphQLTypes/type-aliases/RequireFields.md)\<[`MutationAddUserToGroupChatArgs`](../../../../types/generatedGraphQLTypes/type-aliases/MutationAddUserToGroupChatArgs.md), `"userId"` \| `"chatId"`\>

The arguments for the mutation, containing `input` with `chatId`, `userId`, and `organizationId`.

### context

`any`

The context object for the mutation, containing the current user's ID.

### info?

`GraphQLResolveInfo`

## Returns

[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceChat`](../../../../models/Chat/interfaces/InterfaceChat.md)\> \| `Promise`\<[`ResolverTypeWrapper`](../../../../types/generatedGraphQLTypes/type-aliases/ResolverTypeWrapper.md)\<[`InterfaceChat`](../../../../models/Chat/interfaces/InterfaceChat.md)\>\>

## Defined in

[src/resolvers/Mutation/addUserToGroupChat.ts:28](https://github.com/Suyash878/talawa-api/blob/095e6964ce2a06c1c30d1acf81b6162203f1db91/src/resolvers/Mutation/addUserToGroupChat.ts#L28)
