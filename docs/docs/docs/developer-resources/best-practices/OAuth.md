---
id: auth
title: OAuth
slug: /developer-resources/OAuth
sidebar_position: 40
---

This page provides comprehensive documentation for the OAuth implementation in Talawa API, including the base provider class, registry system, and type definitions.

## Introduction

The Talawa API OAuth system provides a robust and extensible framework for implementing OAuth 2.0 authentication with various providers (Google, GitHub, etc.). The system is built around a modular architecture that allows easy addition of new OAuth providers while maintaining consistent error handling and security practices.

## Architecture Overview

The OAuth system consists of several key components:

- **BaseOAuthProvider**: Abstract base class that implements common HTTP logic and error handling
- **OAuthProviderRegistry**: Singleton registry for managing OAuth provider instances
- **OAuth Accounts Table**: Database table for storing OAuth account linkages and provider data
- **Type Definitions**: TypeScript interfaces for OAuth configurations and responses
- **Error Classes**: Specialized error classes for different OAuth failure scenarios

## OAuth Accounts Database Table

The OAuth accounts table (`oauth_accounts`) stores provider-specific account information linked to users. This table serves as the bridge between Talawa users and their external OAuth provider accounts.

### Table Structure

The table is defined using Drizzle ORM and includes the following fields:

```typescript
export const oauthAccountsTable = pgTable("oauth_accounts", {
  // Primary unique identifier
  id: uuid("id").primaryKey().$default(uuidv7),

  // Foreign key to users table
  userId: uuid("user_id")
    .notNull()
    .references(() => usersTable.id, { onDelete: "cascade" }),

  // OAuth provider information
  provider: varchar("provider", { length: 50 }).notNull(),
  providerId: varchar("provider_id", { length: 255 }).notNull(),

  // Account details from provider
  email: varchar("email", { length: 255 }),
  profile: jsonb("profile").$type<OAuthAccountProfile>(),

  // Timestamp tracking
  linkedAt: timestamp("linked_at", {
    withTimezone: true,
    mode: "date",
    precision: 3,
  })
    .notNull()
    .defaultNow(),

  lastUsedAt: timestamp("last_used_at", {
    withTimezone: true,
    mode: "date",
    precision: 3,
  })
    .notNull()
    .defaultNow(),
});
```

### Field Descriptions

- **`id`**: Primary unique identifier using UUIDv7 for better performance and ordering
- **`userId`**: Foreign key reference to the user who owns this OAuth account (cascades on delete)
- **`provider`**: OAuth provider name (e.g., 'google', 'github', 'facebook')
- **`providerId`**: Provider-specific user identifier (unique per provider)
- **`email`**: Email address associated with the OAuth account from the provider
- **`profile`**: Additional profile data from the OAuth provider stored as JSON
- **`linkedAt`**: Timestamp when the OAuth account was first linked to the user
- **`lastUsedAt`**: Timestamp when the OAuth account was last used for authentication

### Indexes and Constraints

The table includes several indexes and constraints for data integrity and performance:

```typescript
// Ensures each external provider account is linked only once
providerUserUnique: unique("oauth_accounts_provider_provider_id_unique")
  .on(table.provider, table.providerId),

// Index for efficient user lookups
userIdIdx: index("oauth_accounts_user_id_idx").on(table.userId),

// Index for provider-based queries
providerIdx: index("oauth_accounts_provider_idx").on(table.provider),
```

### Relations

The table establishes a many-to-one relationship with the users table:

```typescript
export const oauthAccountsTableRelations = relations(
  oauthAccountsTable,
  ({ one }) => ({
    user: one(usersTable, {
      fields: [oauthAccountsTable.userId],
      references: [usersTable.id],
      relationName: "oauth_accounts.user_id:users.id",
    }),
  }),
);
```

### Usage Examples

#### Querying OAuth Accounts

```typescript
import { db } from "~/src/drizzle/db";
import { oauthAccountsTable } from "~/src/drizzle/tables/oauthAccount";
import { eq, and } from "drizzle-orm";

// Find all OAuth accounts for a user
const userOAuthAccounts = await db
  .select()
  .from(oauthAccountsTable)
  .where(eq(oauthAccountsTable.userId, userId));

// Find specific provider account
const googleAccount = await db
  .select()
  .from(oauthAccountsTable)
  .where(
    and(
      eq(oauthAccountsTable.userId, userId),
      eq(oauthAccountsTable.provider, "google"),
    ),
  );

// Find account by provider ID
const providerAccount = await db
  .select()
  .from(oauthAccountsTable)
  .where(
    and(
      eq(oauthAccountsTable.provider, "google"),
      eq(oauthAccountsTable.providerId, externalUserId),
    ),
  );
```

#### Creating OAuth Account Linkage

```typescript
import { oauthAccountsTableInsertSchema } from "~/src/drizzle/tables/oauthAccount";

// Validate and create new OAuth account linkage
const newOAuthAccount = oauthAccountsTableInsertSchema.parse({
  userId: user.id,
  provider: "google",
  providerId: userProfile.providerId,
  email: userProfile.email,
  profile: {
    name: userProfile.name,
    picture: userProfile.picture,
    emailVerified: userProfile.emailVerified,
  },
});

const [createdAccount] = await db
  .insert(oauthAccountsTable)
  .values(newOAuthAccount)
  .returning();
```

#### Updating Last Used Timestamp

```typescript
// Update lastUsedAt when account is used for authentication
await db
  .update(oauthAccountsTable)
  .set({ lastUsedAt: new Date() })
  .where(eq(oauthAccountsTable.id, oauthAccountId));
```

### OAuthAccountProfile Type

The `profile` field stores additional provider data using a typed JSONB column:

```typescript
interface OAuthAccountProfile {
  name?: string;
  picture?: string;
  emailVerified?: boolean;
  [key: string]: any; // Additional provider-specific fields
}
```

This flexible structure allows storing provider-specific profile information while maintaining type safety for common fields.

### Data Integrity and Security

- **Cascade Deletion**: When a user is deleted, all linked OAuth accounts are automatically removed
- **Unique Constraints**: Each external provider account can only be linked to one Talawa user
- **Indexing**: Optimized queries for user lookups and provider-based searches
- **Timezone Support**: All timestamps include timezone information for accurate tracking across regions

## OAuth Configuration Functions

The OAuth configuration system provides utility functions for loading and validating OAuth provider configurations from environment variables.

### loadOAuthConfig

The `loadOAuthConfig` function loads and validates OAuth configuration from environment variables, automatically enabling or disabling providers based on the availability of required credentials.

```typescript
function loadOAuthConfig(env = process.env): OAuthProvidersConfig;
```

#### Parameters

- **`env`** (optional): Environment variables object. Defaults to `process.env`

#### Returns

- **`OAuthProvidersConfig`**: Configuration object containing Google and GitHub provider settings

#### Behavior

- **Provider Enablement**: Providers are automatically enabled only when all required environment variables are present
- **Timeout Handling**: Uses `API_OAUTH_REQUEST_TIMEOUT_MS` with fallback to 10000ms (10 seconds)
- **Error Recovery**: Invalid timeout values (NaN) automatically fall back to the default timeout

#### Environment Variables

- **Google Provider**: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`
- **GitHub Provider**: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `GITHUB_REDIRECT_URI`
- **Request Timeout**: `API_OAUTH_REQUEST_TIMEOUT_MS` (optional, defaults to 10000)

#### Usage Example

```typescript
import { loadOAuthConfig } from "~/src/config/oauth";

// Load configuration from process.env
const config = loadOAuthConfig();

if (config.google.enabled) {
  console.log("Google OAuth is configured");
  console.log("Timeout:", config.google.requestTimeoutMs);
}

// Load configuration from custom environment
const customEnv = {
  GOOGLE_CLIENT_ID: "your-google-client-id",
  GOOGLE_CLIENT_SECRET: "your-google-secret",
  GOOGLE_REDIRECT_URI: "http://localhost:4000/auth/google/callback",
  API_OAUTH_REQUEST_TIMEOUT_MS: "15000",
};

const customConfig = loadOAuthConfig(customEnv);
```

#### Return Structure

```typescript
interface OAuthProvidersConfig {
  google: {
    enabled: boolean;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    requestTimeoutMs: number;
  };
  github: {
    enabled: boolean;
    clientId: string;
    clientSecret: string;
    redirectUri: string;
    requestTimeoutMs: number;
  };
}
```

### getProviderConfig

The `getProviderConfig` function retrieves a specific provider's configuration and validates that it's properly configured and enabled.

```typescript
function getProviderConfig(
  provider: ProviderKey,
  env = process.env,
): Required<OAuthProviderConfig>;
```

#### Parameters

- **`provider`**: Provider key (`"google"` or `"github"`)
- **`env`** (optional): Environment variables object. Defaults to `process.env`

#### Returns

- **`Required<OAuthProviderConfig>`**: Complete provider configuration with all required fields

#### Throws

- **`Error`**: When the provider is not properly configured or disabled

#### Behavior

- **Validation**: Ensures the provider is enabled and has all required configuration
- **Fallback Timeout**: Provides 10000ms fallback if timeout is falsy (defensive programming)
- **Type Safety**: Returns a configuration object with all fields guaranteed to be present

#### Usage Example

```typescript
import { getProviderConfig } from "~/src/config/oauth";

try {
  // Get Google provider configuration
  const googleConfig = getProviderConfig("google");

  // Safe to use - all fields are guaranteed to be present
  console.log("Client ID:", googleConfig.clientId);
  console.log("Timeout:", googleConfig.requestTimeoutMs);

  // Initialize OAuth provider
  const provider = new GoogleOAuthProvider(googleConfig);
} catch (error) {
  console.error("Google OAuth is not configured:", error.message);
}

// Custom environment example
try {
  const githubConfig = getProviderConfig("github", customEnvironment);
  // Use configuration...
} catch (error) {
  console.error("GitHub OAuth configuration error:", error.message);
}
```

#### Error Handling

The function throws descriptive errors for various configuration issues:

```typescript
// Missing environment variables
throw new Error('OAuth provider "google" is not properly configured');

// This covers scenarios where:
// - Provider is disabled (missing required credentials)
// - clientId is missing or empty
// - clientSecret is missing or empty
// - redirectUri is missing or empty
```

#### Provider Keys

```typescript
type ProviderKey = "google" | "github";
```

Currently supported providers:

- **`"google"`**: Google OAuth 2.0
- **`"github"`**: GitHub OAuth Apps

## BaseOAuthProvider

The `BaseOAuthProvider` is an abstract base class that provides common functionality for all OAuth providers.

### Key Features

- **HTTP Request Handling**: Built-in POST and GET methods with proper error handling
- **Configuration Validation**: Ensures required OAuth credentials are present
- **URL Encoding**: Automatic conversion of data to URLSearchParams for form submission
- **Timeout Management**: Configurable request timeouts with sensible defaults

### Class Definition

```typescript
export abstract class BaseOAuthProvider implements IOAuthProvider {
  protected config: OAuthConfig;
  protected providerName: string;

  constructor(providerName: string, config: OAuthConfig);
  abstract exchangeCodeForTokens(
    code: string,
    redirectUri: string,
  ): Promise<OAuthProviderTokenResponse>;
  abstract getUserProfile(accessToken: string): Promise<OAuthUserProfile>;
}
```

### Configuration

The provider requires an `OAuthConfig` object:

```typescript
interface OAuthConfig {
  clientId: string; // Required: OAuth client ID
  clientSecret: string; // Required: OAuth client secret
  redirectUri?: string; // Optional: Redirect URI (provider-specific)
  requestTimeoutMs?: number; // Optional: Request timeout (default: 10000ms)
}
```

:::warning Security Notice
The `clientSecret` contains sensitive credentials and must:

- Be used server-side only
- Never be logged or exposed in error messages
- Be stored securely in environment variables
  :::

### Usage Example

```typescript
class GoogleOAuthProvider extends BaseOAuthProvider {
  constructor(config: OAuthConfig) {
    super("google", config);
  }

  async exchangeCodeForTokens(
    code: string,
    redirectUri: string,
  ): Promise<OAuthProviderTokenResponse> {
    return await this.post<OAuthProviderTokenResponse>(
      "https://oauth2.googleapis.com/token",
      {
        grant_type: "authorization_code",
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code,
        redirect_uri: redirectUri,
      },
    );
  }

  async getUserProfile(accessToken: string): Promise<OAuthUserProfile> {
    const response = await this.get<GoogleUserResponse>(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        Authorization: `Bearer ${accessToken}`,
      },
    );

    return {
      providerId: response.id,
      email: response.email,
      name: response.name,
      picture: response.picture,
      emailVerified: response.verified_email,
    };
  }
}
```

## Provider Implementations

### GitHubOAuthProvider

The `GitHubOAuthProvider` implements OAuth 2.0 authentication with GitHub. It handles the complete authentication flow including token exchange and user profile retrieval.

#### Features
- Token exchange with GitHub OAuth endpoints
- User profile fetching from GitHub API
- Automatic email resolution for private email addresses

#### Usage

```typescript
import { GitHubOAuthProvider } from '~/src/utilities/auth/oauth/providers/GitHubOAuthProvider';

const provider = new GitHubOAuthProvider({
  clientId: process.env.GITHUB_CLIENT_ID!,
  clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  redirectUri: process.env.GITHUB_REDIRECT_URI,
});

// Exchange authorization code for tokens
const tokens = await provider.exchangeCodeForTokens(authCode, redirectUri);

// Get user profile
const profile = await provider.getUserProfile(tokens.access_token);
```

#### Required Scopes
- `user:email` - Required to access private email addresses when the primary email is not public

#### Environment Variables
- `GITHUB_CLIENT_ID` - GitHub OAuth app client ID
- `GITHUB_CLIENT_SECRET` - GitHub OAuth app client secret
- `GITHUB_REDIRECT_URI` - Authorized redirect URI

### Protected Methods

#### `post<T>(url, data, headers?)`

Makes an HTTP POST request with automatic URL encoding:

```typescript
protected async post<T>(
  url: string,
  data: Record<string, string> | URLSearchParams,
  headers?: Record<string, string>
): Promise<T>
```

- **Parameters:**
  - `url`: Target URL for the request
  - `data`: Request body data (automatically converted to URLSearchParams)
  - `headers`: Optional additional headers
- **Returns:** Parsed response data
- **Throws:** `TokenExchangeError` on failure

#### `get<T>(url, headers?)`

Makes an HTTP GET request:

```typescript
protected async get<T>(
  url: string,
  headers?: Record<string, string>
): Promise<T>
```

- **Parameters:**
  - `url`: Target URL for the request
  - `headers`: Optional request headers
- **Returns:** Parsed response data
- **Throws:** `ProfileFetchError` on failure

#### `validateConfig()`

Validates that required configuration is present:

```typescript
protected validateConfig(): void
```

- **Validates:** `clientId` and `clientSecret` are non-empty
- **Throws:** `OAuthError` with code `INVALID_CONFIG` if validation fails

## Provider Factory and Registry Initialization

### buildOAuthProviderRegistry

The `buildOAuthProviderRegistry` function initializes the OAuth provider registry by reading configuration and registering enabled providers.

```typescript
export function buildOAuthProviderRegistry(): OAuthProviderRegistry
```

#### Behavior

- Reads OAuth configuration via `loadOAuthConfig()`
- Instantiates and registers Google provider if enabled
- Instantiates and registers GitHub provider if enabled
- Clears existing providers for idempotent initialization
- Returns the singleton registry instance

#### Usage

```typescript
import { buildOAuthProviderRegistry } from "~/src/utilities/auth/oauth/providerFactory";

// Build and initialize the registry
const registry = buildOAuthProviderRegistry();

// Registry now contains all enabled providers
const providers = registry.listProviders(); // ["google", "github"]
```

### Fastify Plugin Integration

The OAuth provider registry is automatically initialized during server startup via the `oauthProviderRegistry` Fastify plugin. The plugin:

- Calls `buildOAuthProviderRegistry()` to initialize providers from configuration
- Decorates the Fastify instance with `oauthProviderRegistry` property
- Logs initialization details (enabled providers)
- Makes the registry available throughout the application

The registry is then injected into the GraphQL context, making it available to all resolvers:

```typescript
// In GraphQL resolvers
const provider = context.oauthProviderRegistry.get("google");
```

## OAuthProviderRegistry

The `OAuthProviderRegistry` is a singleton class that manages OAuth provider instances throughout the application lifecycle.

### Key Features

- **Singleton Pattern**: Ensures one registry instance per application
- **Provider Management**: Register, retrieve, and manage OAuth providers
- **Name Normalization**: Automatic normalization of provider names (trim, lowercase)
- **Error Handling**: Comprehensive error handling with descriptive messages
- **Testing Support**: Methods for clearing and unregistering providers
- **Server Integration**: Automatically initialized and available in GraphQL context

### Class Definition

```typescript
export class OAuthProviderRegistry {
  private providers: Map<string, IOAuthProvider>;
  private static instance?: OAuthProviderRegistry;

  static getInstance(): OAuthProviderRegistry;
  register(provider: IOAuthProvider): void;
  get(providerName: string): IOAuthProvider;
  has(providerName: string): boolean;
  listProviders(): string[];
  unregister(providerName: string): void;
  clear(): void;
}
```

### Usage Example

```typescript
// The registry is automatically initialized during server startup
// and available in GraphQL context

// In GraphQL resolvers
const provider = context.oauthProviderRegistry.get("google");
const tokenResponse = await provider.exchangeCodeForTokens(code, redirectUri);
const userProfile = await provider.getUserProfile(tokenResponse.access_token);

// Direct usage (for testing or non-resolver contexts)
import { OAuthProviderRegistry } from "~/src/utilities/auth/oauth/OAuthProviderRegistry";

const registry = OAuthProviderRegistry.getInstance();
const provider = registry.get("google");
```

### Methods

#### `getInstance()`

Returns the singleton registry instance:

```typescript
static getInstance(): OAuthProviderRegistry
```

#### `register(provider)`

Registers an OAuth provider:

```typescript
register(provider: IOAuthProvider): void
```

- **Parameters:**
  - `provider`: Provider instance implementing `IOAuthProvider`
- **Throws:**
  - `OAuthError` with code `INVALID_PROVIDER_NAME` if provider name is empty
  - `OAuthError` with code `DUPLICATE_PROVIDER` if provider already registered

#### `get(providerName)`

Retrieves a registered provider:

```typescript
get(providerName: string): IOAuthProvider
```

- **Parameters:**
  - `providerName`: Name of the provider to retrieve
- **Returns:** Provider instance
- **Throws:** `OAuthError` with code `PROVIDER_NOT_FOUND` if provider not found

#### `has(providerName)`

Checks if a provider is registered:

```typescript
has(providerName: string): boolean
```

- **Parameters:**
  - `providerName`: Name of the provider to check
- **Returns:** `true` if provider exists, `false` otherwise

#### `listProviders()`

Returns all registered provider names:

```typescript
listProviders(): string[]
```

- **Returns:** Array of registered provider names

#### `unregister(providerName)` and `clear()`

Testing utilities for removing providers:

```typescript
unregister(providerName: string): void  // Remove specific provider
clear(): void                          // Remove all providers
```

## Type Definitions

### OAuthProviderTokenResponse

Response structure from OAuth provider token endpoints:

```typescript
interface OAuthProviderTokenResponse {
  access_token: string; // Required: OAuth access token
  token_type: string; // Required: Token type (usually "Bearer")
  expires_in?: number; // Optional: Token expiration time in seconds
  refresh_token?: string; // Optional: Refresh token for renewing access
  scope?: string; // Optional: Granted scopes
  id_token?: string; // Optional: OpenID Connect ID token
}
```

### OAuthUserProfile

Normalized user profile structure:

```typescript
interface OAuthUserProfile {
  providerId: string; // Required: Unique user ID from provider
  email?: string; // Optional: User email address
  name?: string; // Optional: User display name
  picture?: string; // Optional: User profile picture URL
  emailVerified?: boolean; // Optional: Email verification status
}
```

### OAuthConfig

Configuration object for OAuth providers:

```typescript
interface OAuthConfig {
  clientId: string; // Required: OAuth client ID
  clientSecret: string; // Required: OAuth client secret
  requestTimeoutMs?: number; // Optional: Request timeout (default: 10000ms)
}
```

## Error Handling

The OAuth system uses specialized error classes for different failure scenarios:

### TokenExchangeError

Thrown when token exchange fails:

```typescript
class TokenExchangeError extends OAuthError {
  constructor(message: string, details?: string);
}
```

### ProfileFetchError

Thrown when user profile retrieval fails:

```typescript
class ProfileFetchError extends OAuthError {
  constructor(message: string);
}
```

### OAuthError

Base error class for OAuth-related errors:

```typescript
class OAuthError extends Error {
  constructor(message: string, code: string, statusCode: number);
}
```

Common error codes:

- `INVALID_CONFIG`: Configuration validation failed
- `INVALID_PROVIDER_NAME`: Provider name is empty or invalid
- `DUPLICATE_PROVIDER`: Attempting to register an already registered provider
- `PROVIDER_NOT_FOUND`: Requested provider is not registered

## Best Practices

### 1. Environment Configuration

Store OAuth credentials securely in environment variables:

```typescript
const config: OAuthConfig = {
  clientId: process.env.OAUTH_CLIENT_ID!,
  clientSecret: process.env.OAUTH_CLIENT_SECRET!,
  requestTimeoutMs: parseInt(process.env.OAUTH_TIMEOUT_MS || "10000"),
};
```

### 2. Error Handling

Always handle OAuth errors appropriately by using the centralized OAuthError hierarchy to represent well-defined failure cases with consistent error codes, status codes, and clear semantics:

```typescript
try {
  const provider = registry.get(providerName);
  const tokenResponse = await provider.exchangeCodeForTokens(code, redirectUri);
  const userProfile = await provider.getUserProfile(tokenResponse.access_token);

  // Handle successful authentication
} catch (error) {
  if (error instanceof TokenExchangeError) {
    // Handle token exchange failure
    logger.error("Token exchange failed:", error.message);
  } else if (error instanceof ProfileFetchError) {
    // Handle profile fetch failure
    logger.error("Profile fetch failed:", error.message);
  } else if (
    error instanceof OAuthError &&
    error.code === "PROVIDER_NOT_FOUND"
  ) {
    // Handle unknown provider
    throw new Error(`Unsupported OAuth provider: ${providerName}`);
  } else {
    // Handle unexpected errors
    throw error;
  }
}
```

### 3. Testing

When testing OAuth functionality:

```typescript
import { OAuthProviderRegistry } from "~/src/utilities/auth/oauth/OAuthProviderRegistry";

beforeEach(() => {
  // Clear registry before each test
  const registry = OAuthProviderRegistry.getInstance();
  registry.clear();
});
```

### 4. Security Considerations

- Never log or expose `clientSecret` in error messages

## Provider Implementations

### GoogleOAuthProvider

The `GoogleOAuthProvider` is a concrete implementation of the `BaseOAuthProvider` that enables OAuth 2.0 authentication with Google accounts.

#### Features

- Exchanges authorization codes for access tokens via Google OAuth 2.0 token endpoint
- Fetches user profile information from Google's userinfo API
- Automatically normalizes Google profile data to match Talawa's internal format
- Supports optional redirect URI for enhanced security

#### Usage

```typescript
import { GoogleOAuthProvider } from "~/src/utilities/auth/oauth";

// Initialize the provider
const googleProvider = new GoogleOAuthProvider({
  clientId: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
});

// Exchange authorization code for access token
const tokenData = await googleProvider.exchangeCodeForTokens(
  "authorization_code_from_google",
);
// Returns: { access_token: string, token_type: string, expires_in: number, ... }

// Fetch user profile using the access token
const userProfile = await googleProvider.getUserProfile(tokenData.access_token);
// Returns normalized profile: { providerId, email, name, picture, emailVerified }
```

#### Required Scopes

When configuring your Google OAuth application, ensure the following scopes are included in your authorization request:

- `openid` - Required for OpenID Connect authentication
- `email` - Access to user's email address
- `profile` - Access to user's basic profile information

#### Environment Variables

The following environment variables must be configured:

- `GOOGLE_CLIENT_ID`: Your Google OAuth application's client ID
- `GOOGLE_CLIENT_SECRET`: Your Google OAuth application's client secret
