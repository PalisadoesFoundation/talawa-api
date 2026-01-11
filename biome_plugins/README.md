# Biome Plugins

This directory contains custom [GritQL](https://docs.grit.io/) plugins for [Biome](https://biomejs.dev/).

## Active Plugins

### require_escapeHTML.grit

Warns when Pothos string resolvers may be missing `escapeHTML()` calls for XSS prevention.

### require_cache_invalidation.grit

Warns when GraphQL mutations lack cache invalidation calls. Mutations should call `invalidateEntity`/`invalidateEntityLists` from `~/src/services/caching` after successful data modifications.

See [updateOrganization.ts](../src/graphql/types/Mutation/updateOrganization.ts) for the recommended pattern with graceful degradation.

## Documentation

For detailed documentation on the active plugins and their impact on testing, please refer to the [Testing & Validation documentation](../docs/docs/docs/developer-resources/testing/testing-validation.md#biome-plugins).
