[API Docs](/)

***

# Type Alias: Dataloaders

> **Dataloaders** = `object`

Defined in: [src/utilities/dataloaders/index.ts:15](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/dataloaders/index.ts#L15)

Type representing all available DataLoaders for the application.
These loaders provide batched, request-scoped data loading to prevent N+1 queries.

## Properties

### actionItem

> **actionItem**: `ReturnType`\<*typeof* [`createActionItemLoader`](../actionItemLoader/functions/createActionItemLoader.md)\>

Defined in: [src/utilities/dataloaders/index.ts:31](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/dataloaders/index.ts#L31)

DataLoader for fetching action items by ID.

***

### event

> **event**: `ReturnType`\<*typeof* [`createEventLoader`](../eventLoader/functions/createEventLoader.md)\>

Defined in: [src/utilities/dataloaders/index.ts:27](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/dataloaders/index.ts#L27)

DataLoader for fetching events by ID.

***

### organization

> **organization**: `ReturnType`\<*typeof* [`createOrganizationLoader`](../organizationLoader/functions/createOrganizationLoader.md)\>

Defined in: [src/utilities/dataloaders/index.ts:23](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/dataloaders/index.ts#L23)

DataLoader for fetching organizations by ID.

***

### user

> **user**: `ReturnType`\<*typeof* [`createUserLoader`](../userLoader/functions/createUserLoader.md)\>

Defined in: [src/utilities/dataloaders/index.ts:19](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/dataloaders/index.ts#L19)

DataLoader for fetching users by ID.
