# Talawa API Plugin System

The Talawa API Plugin System is a microkernel architecture that allows extending the API with new functionality through plugins. This system provides a flexible way to add new GraphQL operations, database tables, and custom business logic without modifying the core API code.

## Overview

The plugin system consists of:

- **Plugin Manager**: Core system that handles loading, activation, and lifecycle management of plugins
- **Extension Points**: Predefined points where plugins can extend functionality (GraphQL, Database, Hooks)
- **Plugin Registry**: System for managing plugin registration and initialization
- **Plugin Context**: Shared context providing access to database, GraphQL, PubSub, and logging

## Architecture

```
src/plugin/
├── manager.ts          # Core plugin management system
├── types.ts           # TypeScript interfaces and types
├── utils.ts           # Utility functions
├── registry.ts        # Plugin registry and initialization
├── index.ts           # Main exports
├── logger.ts          # Plugin logging system
├── available/         # Directory containing available plugins
└── README.md          # This file
```

## Plugin Structure

Each plugin must have:

1. **Manifest file** (`manifest.json`): Describes the plugin and its extension points
2. **Main entry file**: Implements the plugin logic and lifecycle hooks
3. **Extension implementations**: GraphQL resolvers, database tables, etc.

### Example Plugin Structure

```
my_plugin/
├── manifest.json      # Plugin metadata and extension points
├── index.ts          # Main plugin file with lifecycle hooks
├── database/
│   └── tables.ts     # Database table definitions
└── graphql/
    ├── queries.ts    # GraphQL query resolvers
    └── mutations.ts  # GraphQL mutation resolvers
```

## Creating a Plugin

### 1. Create Plugin Directory

Create a new directory under `src/plugin/available/` with your plugin name:

```bash
mkdir src/plugin/available/my_plugin
```

### 2. Create Manifest File

Create `manifest.json` with plugin metadata:

```json
{
  "name": "My Plugin",
  "pluginId": "my_plugin",
  "version": "1.0.0",
  "description": "Description of my plugin",
  "author": "Your Name",
  "main": "index.ts",
  "extensionPoints": {
    "graphql": [
      {
        "type": "query",
        "name": "getMyData",
        "file": "graphql/queries.ts",
        "resolver": "getMyData"
      },
      {
        "type": "mutation",
        "name": "createMyData",
        "file": "graphql/mutations.ts",
        "resolver": "createMyData"
      }
    ],
    "database": [
      {
        "type": "table",
        "name": "myDataTable",
        "file": "database/tables.ts"
      }
    ],
    "hooks": [
      {
        "type": "post",
        "event": "mydata:created",
        "handler": "onMyDataCreated"
      }
    ]
  }
}
```

### 3. Create Main Plugin File

Create `index.ts` with plugin implementation:

```typescript
import type { IPluginContext, IPluginLifecycle } from "../../types";

// Export database tables and GraphQL resolvers
export * from "./database/tables";
export * from "./graphql/queries";
export * from "./graphql/mutations";

// Lifecycle hooks
export async function onLoad(context: IPluginContext): Promise<void> {
  context.logger?.info("My Plugin loaded");
}

export async function onActivate(context: IPluginContext): Promise<void> {
  context.logger?.info("My Plugin activated");
}

export async function onDeactivate(context: IPluginContext): Promise<void> {
  context.logger?.info("My Plugin deactivated");
}

// Hook handlers
export async function onMyDataCreated(
  data: any,
  context: IPluginContext
): Promise<void> {
  context.logger?.info("My data created:", data);
}
```

### 4. Create Database Tables

Create `database/tables.ts`:

```typescript
import { pgTable, uuid, varchar, timestamp } from "drizzle-orm/pg-core";
import { uuidv7 } from "uuidv7";

export const myDataTable = pgTable("plugin_my_data", {
  id: uuid("id")
    .primaryKey()
    .$defaultFn(() => uuidv7()),
  name: varchar("name", { length: 255 }).notNull(),
  userId: uuid("user_id").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type MyData = typeof myDataTable.$inferSelect;
export type NewMyData = typeof myDataTable.$inferInsert;
```

### 5. Create GraphQL Resolvers

Create `graphql/queries.ts`:

```typescript
import { eq } from "drizzle-orm";
import type { IPluginContext } from "../../../types";
import { myDataTable } from "../database/tables";

export async function getMyData(
  parent: any,
  args: { userId: string },
  context: IPluginContext
) {
  return await context.db
    .select()
    .from(myDataTable)
    .where(eq(myDataTable.userId, args.userId));
}
```

Create `graphql/mutations.ts`:

```typescript
import type { IPluginContext } from "../../../types";
import { myDataTable } from "../database/tables";

export async function createMyData(
  parent: any,
  args: { input: { name: string; userId: string } },
  context: IPluginContext
) {
  const [created] = await context.db
    .insert(myDataTable)
    .values(args.input)
    .returning();

  // Trigger post-creation hook
  await context.pluginManager?.executePostHooks("mydata:created", created);

  return created;
}
```

## Plugin Installation and Activation

### 1. Install Plugin via API

Upload the plugin using the GraphQL mutation:

```graphql
mutation UploadPlugin($input: UploadPluginZipInput!) {
  uploadPluginZip(input: $input) {
    id
    pluginId
    isInstalled
    isActivated
  }
}
```

Or create a plugin record manually:

```graphql
mutation CreatePlugin($input: CreatePluginInput!) {
  createPlugin(input: $input) {
    id
    pluginId
    isInstalled
    isActivated
  }
}
```

### 2. Initialize Plugin System

In your main application setup:

```typescript
import { createPluginContext, initializePluginSystem } from "./plugin";

// Create plugin context
const pluginContext = createPluginContext({
  db: yourDrizzleInstance,
  graphql: yourGraphQLBuilder,
  pubsub: yourPubSubInstance,
  logger: yourLogger,
});

// Initialize plugin system
const pluginManager = await initializePluginSystem(pluginContext);
```

## Extension Points

### GraphQL Extensions

Plugins can extend GraphQL schema with:

- **Queries**: Add new query operations
- **Mutations**: Add new mutation operations
- **Subscriptions**: Add new subscription operations
- **Types**: Add new GraphQL types

### Database Extensions

Plugins can extend database schema with:

- **Tables**: Add new database tables
- **Enums**: Add new enum types
- **Relations**: Define relationships between tables

### Hook Extensions

Plugins can register event handlers for:

- **Pre-hooks**: Execute before an event
- **Post-hooks**: Execute after an event

Common events:

- `user:created`
- `organization:created`
- `post:created`
- Custom plugin events

## Plugin Lifecycle

1. **Database Record**: Plugin is registered in database via API
2. **File Storage**: Plugin files are stored in `available/` directory
3. **Loading**: Plugin manifest and modules are loaded from files
4. **Activation**: Plugin extension points are registered with the system
5. **Runtime**: Plugin handles requests and events
6. **Deactivation**: Plugin is disabled but remains loaded
7. **Deletion**: Plugin is completely removed from database and files

## Plugin Management API

The plugin system provides methods for managing plugins:

```typescript
// Load a plugin
await pluginManager.loadPlugin("my_plugin");

// Activate a plugin
await pluginManager.activatePlugin("my_plugin");

// Deactivate a plugin
await pluginManager.deactivatePlugin("my_plugin");

// Unload a plugin
await pluginManager.unloadPlugin("my_plugin");

// Get plugin status
const plugin = pluginManager.getPlugin("my_plugin");
const isActive = pluginManager.isPluginActive("my_plugin");
```

## Best Practices

### 1. Plugin Naming

- Use camelCase or snake_case for plugin IDs (e.g., `myPlugin`, `my_plugin`)
- Use descriptive names that reflect functionality
- Avoid conflicts with core API features
- No hyphens allowed (GraphQL compatibility)

### 2. Database Design

- Tables are automatically prefixed with `{pluginId}_`
- Use UUIDs for primary keys when possible
- Include audit fields (createdAt, updatedAt)
- Add proper indexes for performance

### 3. Error Handling

- Always wrap operations in try-catch blocks
- Use meaningful error messages
- Log errors appropriately
- Fail gracefully without breaking the API

### 4. Security

- Validate all input data
- Implement proper authorization checks
- Use parameterized queries to prevent SQL injection
- Sanitize user input

### 5. Performance

- Use database indexes appropriately
- Implement pagination for large datasets
- Use async/await for database operations
- Consider caching for frequently accessed data

## Database-First Architecture

The plugin system uses a **database-first approach**:

1. **Source of Truth**: Database contains all plugin records
2. **File Storage**: Plugin files are stored separately
3. **Loading Strategy**: Plugins are loaded based on database records, not file discovery
4. **Graceful Handling**: Missing files are handled without breaking the system

## Troubleshooting

### Plugin Not Loading

1. Check plugin record exists in database
2. Verify plugin files exist in `available/` directory
3. Check manifest.json syntax and structure
4. Review server logs for detailed errors

### GraphQL Errors

1. Verify resolver function exports match manifest
2. Check parameter types and validation
3. Ensure database operations are correct
4. Review GraphQL schema conflicts

### Database Issues

1. Verify database tables were created during installation
2. Check table naming with plugin prefix
3. Ensure proper database permissions
4. Review table definition syntax

### Missing Files

When plugins exist in database but files are missing:

- Plugin loading will fail gracefully
- Check plugin installation logs
- Re-upload plugin files if needed
- Consider cleaning up orphaned database records
