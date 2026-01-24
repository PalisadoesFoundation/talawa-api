[**talawa-api**](../../../../../README.md)

***

# Variable: queryPluginInputSchema

> `const` **queryPluginInputSchema**: `ZodObject`\<\{ `id`: `ZodString`; \}, `$strip`\>

Defined in: [src/graphql/types/Plugin/inputs.ts:24](https://github.com/hkumar1729/talawa-api/blob/0d2a05d79b795ac9f77f76c2bbb56075e621d21c/src/graphql/types/Plugin/inputs.ts#L24)

Plugin Input Types and Schemas

This file co-locates Zod validation schemas with GraphQL input types to ensure
they stay in sync and reduce import complexity.

Usage examples:

// Option 1: Import both schema and type separately
import { createPluginInputSchema, CreatePluginInput } from "./inputs";

// Option 2: Use helper function to get both together
import { getCreatePluginInput } from "./inputs";
const { schema, type } = getCreatePluginInput();

// Option 3: Import all schemas and types
import * as PluginInputs from "./inputs";
