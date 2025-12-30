[API Docs](/)

***

# Type Alias: Dataloaders

> **Dataloaders** = `object`

Defined in: [src/utilities/dataloaders/index.ts:14](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/dataloaders/index.ts#L14)

Type representing all available DataLoaders for the application.
These loaders provide batched, request-scoped data loading to prevent N+1 queries.

## Properties

### actionItem

> **actionItem**: `ReturnType`\<*typeof* [`createActionItemLoader`](../actionItemLoader/functions/createActionItemLoader.md)\>

Defined in: [src/utilities/dataloaders/index.ts:30](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/dataloaders/index.ts#L30)

DataLoader for fetching action items by ID.

***

### event

> **event**: `ReturnType`\<*typeof* [`createEventLoader`](../eventLoader/functions/createEventLoader.md)\>

Defined in: [src/utilities/dataloaders/index.ts:26](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/dataloaders/index.ts#L26)

DataLoader for fetching events by ID.

***

### organization

> **organization**: `ReturnType`\<*typeof* [`createOrganizationLoader`](../organizationLoader/functions/createOrganizationLoader.md)\>

Defined in: [src/utilities/dataloaders/index.ts:22](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/dataloaders/index.ts#L22)

DataLoader for fetching organizations by ID.

***

### user

> **user**: `ReturnType`\<*typeof* [`createUserLoader`](../userLoader/functions/createUserLoader.md)\>

Defined in: [src/utilities/dataloaders/index.ts:18](https://github.com/PalisadoesFoundation/talawa-api/tree/mainsrc/utilities/dataloaders/index.ts#L18)

DataLoader for fetching users by ID.
