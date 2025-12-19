# Biome Plugins

This directory contains custom [GritQL](https://docs.grit.io/) plugins for [Biome](https://biomejs.dev/).

## `require_escapeHTML`

This plugin is designed to enhance security by detecting potential Cross-Site Scripting (XSS) vulnerabilities in Pothos GraphQL resolvers. It checks if `t.string` fields with a `resolve` function are using the `escapeHTML` utility.

### Why is this important?

When returning user-generated content (like bios, descriptions, comments) in a GraphQL API, it is crucial to sanitize the output to prevent malicious scripts from being executed in the client's browser. The `escapeHTML` function performs this sanitization.

### What it detects

The plugin looks for `t.string(...)` definitions that:

1.  Have a `resolve` property.
2.  Do **not** contain a call to `escapeHTML(...)` within the resolver.

**Example that triggers a warning:**

```typescript
t.string({
  resolve: (parent) => parent.bio, // Warning: Missing escapeHTML
});
```

**Example that passes:**

```typescript
import { escapeHTML } from "~/src/utilities/sanitizer";

t.string({
  resolve: (parent) => escapeHTML(parent.bio), // Safe
});
```

### False Positives & Limitations

This pattern is a heuristic and may flag safe code:

1.  **Safe Strings:** IDs, Enums, numbers converted to strings, or hardcoded strings do not need sanitization but will still be flagged if they are in a `t.string` resolver.
2.  **External Sanitization:** If you sanitize the string _before_ the resolver or in a separate function call that isn't named `escapeHTML`, the plugin will not detect it.
    ```typescript
    const safeBio = escapeHTML(user.bio);
    t.string({ resolve: () => safeBio }); // Warning: Plugin only sees the resolver body
    ```
3.  **Pattern Scope:** It currently only matches `t.string(...)`. It does not catch `t.field({ type: 'String', ... })`.

### How to Suppress

If you are certain a field is safe (e.g., it returns a database ID), you can suppress the warning.

Since this is a custom GritQL plugin, standard `// biome-ignore` comments might not work depending on the Biome version and integration.

If `// biome-ignore` does not work, you can exclude specific files in `biome.jsonc` or refactor the code to make the safety explicit (e.g., using a helper function that includes `escapeHTML` in its name, or just adding a comment explaining why it's safe if the warning is non-blocking).
