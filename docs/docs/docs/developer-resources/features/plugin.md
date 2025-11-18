---
id: plugin
title: Plugin System
slug: /developer-resources/plugin
sidebar_position: 60
---

## Overview

The Talawa API Plugin System is a robust, event-driven plugin architecture designed for extending the GraphQL API backend without modifying core code. It provides a complete lifecycle management system for server-side plugins with support for GraphQL extensions, database schema extensions, hooks, webhooks, and Docker container management.

### Key Features

- **Builder-First GraphQL Extensions**: Pothos GraphQL builder integration for type-safe schema extensions
- **Database Extensions**: Dynamic table creation and management with Drizzle ORM
- **Event Hooks**: Pre/post event hooks for plugin lifecycle and business logic
- **Webhook Support**: RESTful webhook endpoints for external integrations
- **Docker Integration**: Automatic container lifecycle management for plugins requiring services
- **Dependency Management**: Automatic npm package installation for plugin dependencies
- **Event-Driven Architecture**: EventEmitter-based pub/sub system for plugin communication
- **Database as Source of Truth**: Plugin state persisted in database for reliability
- **Type-Safe**: Full TypeScript support with comprehensive type definitions

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                  Plugin Manager (Core)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  Lifecycle   │  │  Extensions  │  │   Registry       │   │
│  │  Manager     │  │  Loader      │  │   Manager        │   │
│  └──────────────┘  └──────────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
        ┌───────────────────┼──────────────────┐
        │                   │                  │
┌───────▼────────┐   ┌──────▼──────┐  ┌────────▼─────────┐
│   Extension    │   │  Database   │  │   Event System   │
│   Registry     │   │  Operations │  │   (EventEmitter) │
├────────────────┤   ├─────────────┤  ├──────────────────┤
│ • GraphQL      │   │ • Plugin DB │  │ • Lifecycle      │
│   (Pothos)     │   │ • Tables    │  │   Events         │
│ • Database     │   │ • Enums     │  │ • Hook Events    │
│ • Hooks        │   │ • Relations │  │ • Custom Events  │
│ • Webhooks     │   │             │  │                  │
└────────────────┘   └─────────────┘  └──────────────────┘
```

---

## Core Files

### 1. `index.ts` - Main Entry Point

**Purpose**: Central export hub for the entire API plugin system.

**Responsibilities**:
- Exports all public APIs, types, utilities, and managers
- Provides clean interface for consuming the plugin system
- Single source of truth for what's available to external consumers

**Key Exports**:
- `PluginManager` - Main orchestrator class
- Type definitions (`IPluginManifest`, `IExtensionPoints`, etc.)
- Utility functions (`validatePluginManifest`, `loadPluginManifest`, etc.)
- Registry functions (`initializePluginSystem`, `createPluginContext`)

---

### 2. `types.ts` - Type Definitions

**Purpose**: Centralized TypeScript type definitions for the entire plugin system.

**Key Type Categories**:

#### 1. Plugin Manifest Types (`IPluginManifest`)
```typescript
{
  name: string;
  pluginId: string;
  version: string;
  description: string;
  author: string;
  main: string;
  extensionPoints?: IExtensionPoints;
  dependencies?: Record<string, string>;
  docker?: {
    enabled?: boolean;
    composeFile?: string;
    service?: string;
    // Lifecycle flags
    buildOnInstall?: boolean;
    upOnActivate?: boolean;
    downOnDeactivate?: boolean;
    removeOnUninstall?: boolean;
  };
}
```

#### 2. Extension Types

**GraphQL Extensions** (`IGraphQLExtension`)
- Uses Pothos builder-first approach
- `builderDefinition`: Function name that defines the GraphQL field
- Supports queries, mutations, and subscriptions
- Type-safe field definitions

**Database Extensions** (`IDatabaseExtension`)
- `type`: "table" | "enum" | "relation"
- `name`: Database object name
- `file`: Path to definition file

**Hook Extensions** (`IHookExtension`)
- `type`: "pre" | "post"
- `event`: Event name to hook into
- `handler`: Function name to execute

**Webhook Extensions** (`IWebhookExtension`)
- `path`: Webhook endpoint path
- `method`: HTTP method (GET, POST, PUT, DELETE, PATCH)
- `handler`: Function name for request handling

#### 3. Runtime Types

**`ILoadedPlugin`** - Plugin instance with loaded components:
```typescript
{
  id: string;
  manifest: IPluginManifest;
  graphqlResolvers: Record<string, unknown>;
  databaseTables: Record<string, Record<string, unknown>>;
  hooks: Record<string, Function>;
  webhooks: Record<string, Function>;
  status: PluginStatus;
}
```

**`PluginStatus`** - Enum for plugin states:
- `ACTIVE` - Plugin is loaded and active
- `INACTIVE` - Plugin is loaded but not active
- `ERROR` - Plugin encountered an error
- `LOADING` - Plugin is currently loading

#### 4. Context Types

**`IPluginContext`** - Runtime context passed to plugins:
```typescript
{
  db: IDatabaseClient;        // Drizzle database client
  graphql: unknown;            // GraphQL schema/builder
  pubsub: unknown;             // PubSub for subscriptions
  logger: ILogger;             // Logger instance
}
```

---

### 3. `registry.ts` - Plugin Registry & Initialization

**Purpose**: Provides initialization utilities and global plugin manager access.

**Key Functions**:

#### `createPluginContext(dependencies)`
Creates a plugin context object with all necessary dependencies:
```typescript
const context = createPluginContext({
  db: drizzleClient,
  graphql: builder,
  pubsub: pubsubInstance,
  logger: logger
});
```

#### `initializePluginSystem(context, pluginsDirectory?)`
Initializes the plugin system and returns the plugin manager:
```typescript
const pluginManager = await initializePluginSystem(context);
```

**Features**:
- Singleton pattern - returns same instance on subsequent calls
- Waits for `plugins:ready` event before resolving
- Error handling and logging
- Async initialization

#### `getPluginManagerInstance()`
Returns the current plugin manager instance:
```typescript
const manager = getPluginManagerInstance();
```

#### `isPluginSystemInitialized()`
Checks if plugin system is ready:
```typescript
if (isPluginSystemInitialized()) {
  // System is ready
}
```

#### `destroyPluginSystem()`
Gracefully shuts down plugin system (useful for testing):
```typescript
await destroyPluginSystem();
```

#### `getPluginSystemStatus()`
Returns health check and status information:
```typescript
const status = getPluginSystemStatus();
// { initialized: true, pluginCount: 5, ... }
```

---

### 4. `utils.ts` - Utility Functions

**Purpose**: Common utility functions for plugin operations.

**Key Functions**:

#### Validation Functions

**`validatePluginManifest(manifest)`**
- Validates manifest structure and required fields
- Checks version format (semver)
- Validates pluginId format (alphanumeric + underscores, no hyphens)
- Returns type predicate for TypeScript

**`isValidPluginId(pluginId)`**
- Validates plugin ID format
- Must start with letter, can contain letters, numbers, underscores
- No hyphens (important for GraphQL field naming)

#### Loading Functions

**`loadPluginManifest(pluginPath)`**
- Loads and parses manifest.json
- Validates manifest structure
- Throws descriptive errors

**`safeRequire(filePath)`**
- Safely requires/imports a module
- Handles both CommonJS and ES modules
- Returns null on failure instead of throwing

#### File System Functions

**`directoryExists(path)`**
- Checks if directory exists
- Returns boolean

**`ensureDirectory(path)`**
- Creates directory if it doesn't exist
- Recursive creation (like `mkdir -p`)

#### Plugin-Specific Functions

**`generatePluginId(name)`**
- Creates valid plugin ID from name
- Lowercase, alphanumeric + underscores

**`normalizeImportPath(path)`**
- Normalizes import paths for cross-platform compatibility

#### Database Functions

**`createPluginTables(pluginId, tableDefinitions, db)`**
- Creates database tables for a plugin
- Uses Drizzle ORM schema definitions

**`dropPluginTables(pluginId, db)`**
- Drops all tables associated with a plugin
- Cleanup on uninstall

#### Helper Functions

**`sortExtensionPoints(extensions)`**
- Sorts extensions by priority/order

**`filterActiveExtensions(extensions)`**
- Filters for active extensions only

**`debounce(fn, delay)`**
- Debounces function calls

**`deepClone(obj)`**
- Deep clones objects safely

---

### 5. `pluginWebhooks.ts` - Webhook Handler

**Purpose**: Fastify plugin that handles dynamic webhook routing for plugins.

**How It Works**:
1. Registers wildcard routes: `/api/plugins/:pluginId/webhook/*`
2. Looks up webhook handler in extension registry
3. Injects plugin context into request
4. Executes webhook handler
5. Returns response

**Route Patterns**:
```typescript
// Primary webhook endpoint
POST /api/plugins/my-plugin/webhook

// Webhook with path
POST /api/plugins/my-plugin/webhook/callback
GET  /api/plugins/my-plugin/webhook/status
```

**Features**:
- Dynamic handler lookup from extension registry
- Plugin context injection
- Error handling with proper HTTP status codes
- Support for all HTTP methods (GET, POST, PUT, DELETE, PATCH)

**Integration**:
```typescript
// In Fastify app setup
import { pluginWebhooks } from './plugin/pluginWebhooks';
await fastify.register(pluginWebhooks);
```

**Usage in Plugin**:
```typescript
// Plugin manifest
{
  "extensionPoints": {
    "webhooks": [
      {
        "path": "/callback",
        "method": "POST",
        "handler": "handleWebhook"
      }
    ]
  }
}

// Plugin code
export async function handleWebhook(request, reply) {
  const data = request.body;
  // Process webhook
  reply.send({ success: true });
}
```

---

## Manager Directory

### 1. `manager/core.ts` - Core Plugin Manager

**Purpose**: Main orchestrator for the entire plugin system. Extends EventEmitter for event-driven architecture.

**Key Responsibilities**:

#### 1. Plugin Discovery & Loading
- Discovers plugins from database (database is source of truth)
- Loads plugin manifests and modules
- Initializes plugin components
- Registers extension points

#### 2. Plugin State Management
- Maintains `loadedPlugins` Map with plugin instances
- Tracks plugin status (ACTIVE, INACTIVE, ERROR, LOADING)
- Manages plugin errors and error recovery

#### 3. Extension Registry
- Maintains centralized registry of all extensions:
  - GraphQL builder extensions
  - Database tables, enums, relations
  - Pre/post hooks
  - Webhook handlers

#### 4. Lifecycle Coordination
- Delegates to `PluginLifecycle` for lifecycle operations
- Emits events throughout plugin lifecycle
- Coordinates with database for persistence

#### 5. Component Coordination
- Initializes and manages:
  - `ExtensionLoader` - Loads extension points
  - `PluginLifecycle` - Handles lifecycle operations
  - `PluginRegistry` - Database operations

**Key Methods**:

**`loadPlugin(pluginId)`** - Load a plugin from filesystem:
```typescript
const success = await pluginManager.loadPlugin('my-plugin');
```

**`activatePlugin(pluginId)`** - Activate a loaded plugin:
```typescript
await pluginManager.activatePlugin('my-plugin');
// Triggers schema rebuild
```

**`deactivatePlugin(pluginId)`** - Deactivate active plugin:
```typescript
await pluginManager.deactivatePlugin('my-plugin');
// Triggers schema rebuild
```

**`installPlugin(pluginId)`** - Install plugin (dependencies + database):
```typescript
await pluginManager.installPlugin('my-plugin');
```

**`uninstallPlugin(pluginId)`** - Uninstall and cleanup:
```typescript
await pluginManager.uninstallPlugin('my-plugin');
```

**`getExtensionRegistry()`** - Get all registered extensions:
```typescript
const registry = pluginManager.getExtensionRegistry();
const graphqlExtensions = registry.graphql.builderExtensions;
```

**`getLoadedPlugins()`** - Get all loaded plugins:
```typescript
const plugins = pluginManager.getLoadedPlugins();
```

**`isSystemInitialized()`** - Check initialization status:
```typescript
if (pluginManager.isSystemInitialized()) {
  // System ready
}
```

**`gracefulShutdown()`** - Shutdown without deactivating plugins:
```typescript
await pluginManager.gracefulShutdown();
```

**Event System**:
```typescript
pluginManager.on('plugins:initializing', () => {});
pluginManager.on('plugins:initialized', (pluginIds) => {});
pluginManager.on('plugin:loading', (pluginId) => {});
pluginManager.on('plugin:loaded', (pluginId) => {});
pluginManager.on('plugin:activating', (pluginId) => {});
pluginManager.on('plugin:activated', (pluginId) => {});
pluginManager.on('plugin:deactivating', (pluginId) => {});
pluginManager.on('plugin:deactivated', (pluginId) => {});
pluginManager.on('plugin:error', (pluginId, error) => {});
```

---

### 2. `manager/lifecycle.ts` - Lifecycle Manager

**Purpose**: Handles isolated plugin lifecycle processes with clear separation of concerns.

**Lifecycle Operations**:

#### 1. Plugin Installation
```typescript
await lifecycle.installPlugin(pluginId, pluginManager);
```

**Actions**:
- Install npm dependencies (from manifest.dependencies)
- Create plugin-defined database tables
- Call `onInstall` lifecycle hook
- Build Docker container (if enabled)
- Emit `plugin:installed` event

**No schema rebuild** - plugin must be activated to integrate with GraphQL

#### 2. Plugin Activation
```typescript
await lifecycle.activatePlugin(pluginId, pluginManager);
```

**Actions**:
- Call `onActivate` lifecycle hook
- Start Docker container (if configured)
- Update plugin status to ACTIVE
- Update database record
- **Trigger schema rebuild** to integrate extensions
- Emit `plugin:activated` event

#### 3. Plugin Deactivation
```typescript
await lifecycle.deactivatePlugin(pluginId, pluginManager);
```

**Actions**:
- Call `onDeactivate` lifecycle hook
- Stop Docker container (if configured)
- Update plugin status to INACTIVE
- Update database record
- **Trigger schema rebuild** to remove extensions
- Emit `plugin:deactivated` event

#### 4. Plugin Uninstallation
```typescript
await lifecycle.uninstallPlugin(pluginId, pluginManager);
```

**Actions**:
- Call `onUninstall` lifecycle hook
- Remove Docker container (if enabled)
- Drop plugin database tables
- Remove from extension registry
- Remove from loaded plugins
- **Trigger schema rebuild** for cleanup
- Emit `plugin:uninstalled` event

**Lifecycle Hooks**:

Plugins can export lifecycle functions:
```typescript
// Plugin code
export async function onInstall(context: IPluginContext) {
  // Setup logic
}

export async function onActivate(context: IPluginContext) {
  // Activation logic
}

export async function onDeactivate(context: IPluginContext) {
  // Cleanup logic
}

export async function onUninstall(context: IPluginContext) {
  // Final cleanup
}
```

**Docker Management**:

Automatically manages Docker containers based on manifest:
```json
{
  "docker": {
    "enabled": true,
    "composeFile": "docker-compose.yml",
    "service": "my-service",
    "buildOnInstall": true,
    "upOnActivate": true,
    "downOnDeactivate": true,
    "removeOnUninstall": true,
    "env": {
      "PLUGIN_VAR": "value"
    }
  }
}
```

**Key Methods**:
- `createPluginDatabases(pluginId, manifest)` - Create tables
- `removePluginDatabases(pluginId)` - Drop tables
- `manageDocker(pluginId, manifest, operation)` - Docker lifecycle
- `triggerSchemaRebuild()` - Rebuild GraphQL schema
- `callOnInstallHook(pluginId)` - Call install hook
- `callOnActivateHook(pluginId)` - Call activate hook

---

### 3. `manager/extensions.ts` - Extension Loader

**Purpose**: Loads and registers GraphQL, Database, Hook, and Webhook extensions from plugins.

**Extension Loading Process**:

#### 1. GraphQL Extensions (Builder-First Approach)
```typescript
await extensionLoader.loadExtensionPoints(pluginId, manifest, pluginModule);
```

**Pothos Builder Integration**:
```typescript
// Plugin manifest
{
  "extensionPoints": {
    "graphql": [
      {
        "type": "query",
        "name": "myPluginQuery",
        "builderDefinition": "defineMyQuery",
        "file": "graphql/queries.ts"
      }
    ]
  }
}

// Plugin code (graphql/queries.ts)
export function defineMyQuery(builder: PothosSchemaBuilder) {
  builder.queryField('myPluginQuery', (t) =>
    t.field({
      type: 'String',
      resolve: () => 'Hello from plugin!'
    })
  );
}
```

**Features**:
- Type-safe field definitions with Pothos
- Automatic prefixing with plugin ID
- Support for queries, mutations, subscriptions
- Error handling and validation

#### 2. Database Extensions
```typescript
// Plugin manifest
{
  "extensionPoints": {
    "database": [
      {
        "type": "table",
        "name": "plugin_data",
        "file": "database/tables.ts"
      }
    ]
  }
}

// Plugin code (database/tables.ts)
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const pluginDataTable = pgTable('plugin_data', {
  id: text('id').primaryKey(),
  content: text('content'),
  createdAt: timestamp('created_at').defaultNow()
});
```

**Features**:
- Drizzle ORM schema definitions
- Automatic table creation/deletion
- Support for tables, enums, relations

#### 3. Hook Extensions
```typescript
// Plugin manifest
{
  "extensionPoints": {
    "hooks": [
      {
        "type": "pre",
        "event": "user:create",
        "handler": "beforeUserCreate",
        "file": "hooks/user.ts"
      }
    ]
  }
}

// Plugin code (hooks/user.ts)
export async function beforeUserCreate(data: any) {
  // Pre-processing logic
  return modifiedData;
}
```

**Features**:
- Pre/post event hooks
- Async support
- Event-driven architecture

#### 4. Webhook Extensions
```typescript
// Plugin manifest
{
  "extensionPoints": {
    "webhooks": [
      {
        "path": "/callback",
        "method": "POST",
        "handler": "handleCallback",
        "description": "Webhook callback handler"
      }
    ]
  }
}

// Plugin code
export async function handleCallback(request, reply) {
  const data = request.body;
  // Process webhook
  reply.send({ success: true });
}
```

**Key Methods**:
- `loadExtensionPoints(pluginId, manifest, module)` - Load all extensions
- `loadBuilderGraphQLExtension(pluginId, extension, module)` - Load GraphQL
- `loadDatabaseExtension(pluginId, extension, module)` - Load database
- `loadHookExtension(pluginId, extension, module)` - Load hooks
- `loadWebhookExtension(pluginId, extension, module)` - Load webhooks

---

### 4. `manager/registry.ts` - Registry Manager

**Purpose**: Handles database operations for plugin state management.

**Key Responsibilities**:

1. **Database Queries**
   - Fetch plugin records from database
   - Query by plugin ID
   - List all installed plugins

2. **Database Updates**
   - Update plugin status (activated/deactivated)
   - Update plugin metadata
   - Track installation state

**Key Methods**:

**`getPluginFromDatabase(pluginId)`**
```typescript
const plugin = await registry.getPluginFromDatabase('my-plugin');
// { id, pluginId, isActivated, isInstalled, ... }
```

**`updatePluginInDatabase(pluginId, updates)`**
```typescript
await registry.updatePluginInDatabase('my-plugin', {
  isActivated: true,
  updatedAt: new Date()
});
```

**Database Schema** (from `pluginsTable`):
```typescript
{
  id: string;              // UUID
  pluginId: string;        // Plugin identifier
  isActivated: boolean;    // Activation status
  isInstalled: boolean;    // Installation status
  backup: boolean;         // Backup flag
  createdAt: Date;        // Creation timestamp
  updatedAt: Date;        // Last update timestamp
}
```

**Integration**:
- Uses Drizzle ORM for type-safe queries
- Accesses database through plugin context
- Error handling and logging

---

### 5. `manager/index.ts` - Manager Exports

**Purpose**: Central export point for all manager components.

**Exports**:
```typescript
export { default as PluginManager } from './core';
export { default } from './core';
export { ExtensionLoader } from './extensions';
export { PluginLifecycle } from './lifecycle';
export { PluginRegistry } from './registry';
```

**Usage**:
```typescript
// Import main manager
import PluginManager from '@/plugin/manager';

// Import individual components (advanced usage)
import { ExtensionLoader, PluginLifecycle } from '@/plugin/manager';
```

---

## Extension Point System

### GraphQL Extensions (Builder-First)

The system uses **Pothos GraphQL** builder for type-safe schema extensions:

**Why Builder-First?**
- Type safety with TypeScript
- No code generation needed
- Better IDE support
- Easier to test
- Composable field definitions

**Example**:
```typescript
// Manifest
{
  "extensionPoints": {
    "graphql": [
      {
        "type": "query",
        "name": "getPluginData",
        "builderDefinition": "defineGetPluginDataQuery"
      }
    ]
  }
}

// Plugin code
export function defineGetPluginDataQuery(builder: PothosSchemaBuilder) {
  builder.queryField('myPlugin_getPluginData', (t) =>
    t.field({
      type: 'String',
      args: {
        id: t.arg.string({ required: true })
      },
      resolve: async (parent, args, context) => {
        // Resolver logic
        return data;
      }
    })
  );
}
```

**Automatic Prefixing**: Query/mutation names are automatically prefixed with plugin ID to avoid conflicts.

### Database Extensions

**Drizzle ORM Integration**:
```typescript
// Define table
import { pgTable, text, timestamp } from 'drizzle-orm/pg-core';

export const myPluginTable = pgTable('my_plugin_data', {
  id: text('id').primaryKey(),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow()
});

// Use in plugin
export async function saveData(context: IPluginContext, data: any) {
  const db = context.db as IDatabaseClient;
  await db.insert(myPluginTable).values(data);
}
```

**Features**:
- Automatic table creation on install
- Automatic table deletion on uninstall
- Type-safe queries
- Migration support

### Hook Extensions

**Event-Driven Hooks**:
```typescript
// Pre-hook (can modify data)
export async function beforeUserCreate(data: any, context: IPluginContext) {
  // Validation or modification
  data.customField = await fetchSomeData();
  return data;
}

// Post-hook (side effects only)
export async function afterUserCreate(user: any, context: IPluginContext) {
  // Notifications, logging, etc.
  await sendWelcomeEmail(user.email);
}
```

**Common Events**:
- `user:create`, `user:update`, `user:delete`
- `post:create`, `post:update`, `post:delete`
- `event:create`, `event:update`, `event:delete`
- Custom plugin events

### Webhook Extensions

**RESTful Webhook Endpoints**:
```typescript
export async function handleWebhook(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const data = request.body;
  const context = (request as any).pluginContext;
  
  // Process webhook
  const result = await processData(data, context);
  
  reply.send({ success: true, result });
}
```

**Webhook URL Pattern**: `/api/plugins/{pluginId}/webhook/{path}`

---

## Plugin Development Workflow

### 1. Plugin Structure
```
my-plugin/
├── manifest.json           # Plugin metadata and extensions
├── index.ts               # Main entry point
├── graphql/
│   ├── queries.ts        # GraphQL query definitions
│   └── mutations.ts      # GraphQL mutation definitions
├── database/
│   └── tables.ts         # Database schema definitions
├── hooks/
│   └── user.ts           # Event hooks
├── webhooks/
│   └── handler.ts        # Webhook handlers
├── docker-compose.yml    # Optional Docker services
└── package.json          # Plugin dependencies
```

### 2. Manifest Example
```json
{
  "name": "My Awesome Plugin",
  "pluginId": "myAwesomePlugin",
  "version": "1.0.0",
  "description": "Adds cool features to Talawa API",
  "author": "Your Name",
  "main": "index.ts",
  "dependencies": {
    "axios": "^1.0.0",
    "lodash": "^4.17.21"
  },
  "extensionPoints": {
    "graphql": [
      {
        "type": "query",
        "name": "getAwesomeData",
        "builderDefinition": "defineGetAwesomeData",
        "file": "graphql/queries.ts"
      }
    ],
    "database": [
      {
        "type": "table",
        "name": "awesome_data",
        "file": "database/tables.ts"
      }
    ],
    "hooks": [
      {
        "type": "post",
        "event": "user:create",
        "handler": "afterUserCreate",
        "file": "hooks/user.ts"
      }
    ],
    "webhooks": [
      {
        "path": "/callback",
        "method": "POST",
        "handler": "handleCallback"
      }
    ]
  },
  "docker": {
    "enabled": true,
    "composeFile": "docker-compose.yml",
    "service": "my-service",
    "buildOnInstall": true,
    "upOnActivate": true,
    "downOnDeactivate": true
  }
}
```

### 3. Plugin Code Example
```typescript
// index.ts
import type { IPluginContext } from '@/plugin/types';

export { defineGetAwesomeData } from './graphql/queries';
export { awesomeDataTable } from './database/tables';
export { afterUserCreate } from './hooks/user';
export { handleCallback } from './webhooks/handler';

// Lifecycle hooks
export async function onInstall(context: IPluginContext) {
  context.logger.info('Plugin installed!');
}

export async function onActivate(context: IPluginContext) {
  context.logger.info('Plugin activated!');
}
```

### 4. Installation & Usage
```typescript
// Initialize plugin system
import { initializePluginSystem, createPluginContext } from '@/plugin';

const context = createPluginContext({
  db: drizzleClient,
  graphql: builder,
  pubsub: pubsubInstance,
  logger: logger
});

const pluginManager = await initializePluginSystem(context);

// Install plugin
await pluginManager.installPlugin('myAwesomePlugin');

// Activate plugin
await pluginManager.activatePlugin('myAwesomePlugin');

// Plugin extensions are now active and integrated!
```

---

## Best Practices

### For Plugin Developers

1. **Use Builder-First GraphQL** - Always use Pothos builder definitions
2. **Validate Plugin IDs** - No hyphens, alphanumeric + underscores only
3. **Handle Errors Gracefully** - Implement proper error handling
4. **Document Extensions** - Add descriptions to all extensions
5. **Test Lifecycle Hooks** - Ensure install/uninstall work correctly
6. **Version Properly** - Use semantic versioning
7. **Declare Dependencies** - List all npm packages in manifest

### For System Integrators

1. **Initialize Early** - Initialize plugin system during app startup
2. **Wait for Ready** - Wait for `plugins:ready` event
3. **Handle Events** - Subscribe to lifecycle events for monitoring
4. **Use Singleton** - Access via `getPluginManagerInstance()`
5. **Graceful Shutdown** - Call `gracefulShutdown()` on app close

### For Administrators

1. **Database First** - Plugin state is in database, filesystem is secondary
2. **Test in Development** - Validate plugins before production
3. **Monitor Docker** - Check container health if using Docker features
4. **Backup Database** - Backup before installing/uninstalling plugins
5. **Check Dependencies** - Review npm packages for security

---

## Event System

The plugin manager extends EventEmitter for comprehensive event-driven architecture:

### Lifecycle Events
```typescript
pluginManager.on('plugins:initializing', () => {
  console.log('Plugin system starting...');
});

pluginManager.on('plugins:initialized', (pluginIds: string[]) => {
  console.log('Loaded plugins:', pluginIds);
});

pluginManager.on('plugin:loading', (pluginId: string) => {
  console.log(`Loading ${pluginId}...`);
});

pluginManager.on('plugin:loaded', (pluginId: string) => {
  console.log(`${pluginId} loaded successfully`);
});

pluginManager.on('plugin:activating', (pluginId: string) => {
  console.log(`Activating ${pluginId}...`);
});

pluginManager.on('plugin:activated', (pluginId: string) => {
  console.log(`${pluginId} is now active`);
});

pluginManager.on('plugin:error', (pluginId: string, error: Error) => {
  console.error(`Plugin ${pluginId} error:`, error);
});
```

### Custom Plugin Events
```typescript
// Plugin can emit custom events
export function defineCustomMutation(builder: PothosSchemaBuilder) {
  builder.mutationField('doSomething', (t) =>
    t.field({
      type: 'Boolean',
      resolve: async (parent, args, context) => {
        // Emit custom event
        context.pluginManager.emit('myPlugin:customEvent', { data: args });
        return true;
      }
    })
  );
}

// Other plugins or app can listen
pluginManager.on('myPlugin:customEvent', (data) => {
  console.log('Custom event received:', data);
});
```

---

## Testing

### Unit Tests
```typescript
import { validatePluginManifest, generatePluginId } from '@/plugin/utils';

describe('Plugin Utils', () => {
  test('validates manifest', () => {
    const manifest = {
      name: 'Test Plugin',
      pluginId: 'testPlugin',
      version: '1.0.0',
      description: 'Test',
      author: 'Tester',
      main: 'index.ts'
    };
    expect(validatePluginManifest(manifest)).toBe(true);
  });
  
  test('generates plugin ID', () => {
    expect(generatePluginId('My Plugin!')).toBe('my_plugin');
  });
});
```

### Integration Tests
```typescript
describe('Plugin Manager', () => {
  let pluginManager: PluginManager;
  
  beforeAll(async () => {
    const context = createPluginContext({ /* ... */ });
    pluginManager = await initializePluginSystem(context);
  });
  
  test('loads plugin', async () => {
    const success = await pluginManager.loadPlugin('testPlugin');
    expect(success).toBe(true);
  });
  
  test('activates plugin', async () => {
    await pluginManager.activatePlugin('testPlugin');
    const plugin = pluginManager.getLoadedPlugin('testPlugin');
    expect(plugin?.status).toBe(PluginStatus.ACTIVE);
  });
  
  afterAll(async () => {
    await destroyPluginSystem();
  });
});
```

---

## Troubleshooting

### Plugin Not Loading

**Symptoms**: Plugin doesn't appear in loaded plugins list

**Solutions**:
1. Check plugin exists in database: `SELECT * FROM plugins WHERE plugin_id = 'myPlugin'`
2. Verify plugin directory exists: `src/plugin/available/myPlugin/`
3. Validate manifest: `validatePluginManifest(manifest)`
4. Check console for error messages
5. Verify `isInstalled` is true in database

### GraphQL Extension Not Working

**Symptoms**: Query/mutation not available in schema

**Solutions**:
1. Ensure plugin is activated (not just loaded)
2. Check builder function is exported correctly
3. Verify `builderDefinition` name matches exported function
4. Look for schema rebuild logs
5. Test builder function manually

### Database Tables Not Created

**Symptoms**: Tables don't exist after installation

**Solutions**:
1. Check database extension is defined in manifest
2. Verify table definition is exported correctly
3. Check for errors in `onInstall` lifecycle
4. Manually verify database schema
5. Check Drizzle ORM configuration

### Webhook Not Responding

**Symptoms**: Webhook endpoint returns 404

**Solutions**:
1. Verify webhook is registered: `pluginManager.getExtensionRegistry().webhooks`
2. Check webhook path format (should start with `/`)
3. Ensure plugin is activated
4. Verify Fastify plugin is registered
5. Check handler function signature

### Docker Container Issues

**Symptoms**: Container not starting or stopping

**Solutions**:
1. Verify Docker is running
2. Check `docker-compose.yml` exists
3. Validate service name in manifest
4. Check Docker logs: `docker-compose logs`
5. Manually test: `docker-compose up`

---

## Future Enhancements

- **Plugin Marketplace**: Central repository for discovering plugins
- **Version Management**: Support multiple plugin versions
- **Plugin Dependencies**: Declare dependencies on other plugins
- **GraphQL Federation**: Federated schema support
- **Performance Monitoring**: Track plugin performance impact
- **Sandboxing**: Isolate plugin execution contexts
- **Hot Reloading**: Update plugins without restart
- **Permission System**: Fine-grained plugin permissions

---

## Contributing

When extending the plugin system:

1. Follow existing architectural patterns
2. Add comprehensive tests for new features
3. Update type definitions
4. Document new functionality
5. Maintain backward compatibility
6. Consider performance implications

---

## License

See main project LICENSE file.
