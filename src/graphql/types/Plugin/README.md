# Plugin GraphQL API Documentation

This document provides information about the GraphQL API endpoints available for managing plugins in the system.

## Queries

### Get a Single Plugin

Retrieves a single plugin by its ID.

```graphql
query GetPlugin($input: QueryPluginInput!) {
  plugin(input: $input) {
    id
    pluginId
    isActivated
    isInstalled
    backup
    createdAt
    updatedAt
  }
}
```

Variables:

```json
{
  "input": {
    "id": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

### Get Multiple Plugins

Retrieves multiple plugins with optional filtering.

```graphql
query GetPlugins($input: QueryPluginsInput!) {
  plugins(input: $input) {
    id
    pluginId
    isActivated
    isInstalled
    backup
    createdAt
    updatedAt
  }
}
```

Variables (all fields are optional):

```json
{
  "input": {
    "pluginId": "world-clock",
    "isActivated": true,
    "isInstalled": true
  }
}
```

## Mutations

### Create Plugin

Creates a new plugin.

```graphql
mutation CreatePlugin($input: CreatePluginInput!) {
  createPlugin(input: $input) {
    id
    pluginId
    isActivated
    isInstalled
    backup
    createdAt
    updatedAt
  }
}
```

Variables:

```json
{
  "input": {
    "pluginId": "world-clock",
    "isActivated": false,
    "isInstalled": true,
    "backup": false
  }
}
```

### Update Plugin

Updates an existing plugin.

```graphql
mutation UpdatePlugin($input: UpdatePluginInput!) {
  updatePlugin(input: $input) {
    id
    pluginId
    isActivated
    isInstalled
    backup
    createdAt
    updatedAt
  }
}
```

Variables:

```json
{
  "input": {
    "id": "123e4567-e89b-12d3-a456-426614174000",
    "isActivated": true,
    "isInstalled": true,
    "backup": false
  }
}
```

### Delete Plugin

Deletes a plugin.

```graphql
mutation DeletePlugin($input: DeletePluginInput!) {
  deletePlugin(input: $input) {
    id
    pluginId
    isActivated
    isInstalled
    backup
    createdAt
    updatedAt
  }
}
```

Variables:

```json
{
  "input": {
    "id": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

## Error Handling

The API uses the following error codes:

- `invalid_arguments`: When the input validation fails
- `not_found`: When trying to update or delete a non-existent plugin

## Field Descriptions

- `id`: Unique identifier for the plugin (UUID)
- `pluginId`: Unique identifier for the plugin type (e.g., "world-clock")
- `isActivated`: Whether the plugin is currently activated
- `isInstalled`: Whether the plugin is installed
- `backup`: Whether the plugin is a backup
- `createdAt`: Timestamp when the plugin was created
- `updatedAt`: Timestamp when the plugin was last updated

## Default Values

When creating a new plugin:

- `isActivated`: defaults to `false`
- `isInstalled`: defaults to `true`
- `backup`: defaults to `false`
