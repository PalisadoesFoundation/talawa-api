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
  }).notNull().defaultNow(),
  
  lastUsedAt: timestamp("last_used_at", {
    withTimezone: true,
    mode: "date",
    precision: 3,
  }).notNull().defaultNow(),
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
import { db } from '~/src/drizzle/db';
import { oauthAccountsTable } from '~/src/drizzle/tables/oauthAccount';
import { eq, and } from 'drizzle-orm';

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
      eq(oauthAccountsTable.provider, 'google')
    )
  );

// Find account by provider ID
const providerAccount = await db
  .select()
  .from(oauthAccountsTable)
  .where(
    and(
      eq(oauthAccountsTable.provider, 'google'),
      eq(oauthAccountsTable.providerId, externalUserId)
    )
  );
```

#### Creating OAuth Account Linkage

```typescript
import { oauthAccountsTableInsertSchema } from '~/src/drizzle/tables/oauthAccount';

// Validate and create new OAuth account linkage
const newOAuthAccount = oauthAccountsTableInsertSchema.parse({
  userId: user.id,
  provider: 'google',
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
  abstract exchangeCodeForTokens(code: string, redirectUri: string): Promise<OAuthProviderTokenResponse>;
  abstract getUserProfile(accessToken: string): Promise<OAuthUserProfile>;
}
```

### Configuration

The provider requires an `OAuthConfig` object:

```typescript
interface OAuthConfig {
  clientId: string;              // Required: OAuth client ID
  clientSecret: string;          // Required: OAuth client secret  
  redirectUri?: string;          // Optional: Redirect URI (provider-specific)
  requestTimeoutMs?: number;     // Optional: Request timeout (default: 10000ms)
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
    super('google', config);
  }

  async exchangeCodeForTokens(code: string, redirectUri: string): Promise<OAuthProviderTokenResponse> {
    return await this.post<OAuthProviderTokenResponse>(
      'https://oauth2.googleapis.com/token',
      {
        grant_type: 'authorization_code',
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        code,
        redirect_uri: redirectUri,
      }
    );
  }

  async getUserProfile(accessToken: string): Promise<OAuthUserProfile> {
    const response = await this.get<GoogleUserResponse>(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        Authorization: `Bearer ${accessToken}`,
      }
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

## OAuthProviderRegistry

The `OAuthProviderRegistry` is a singleton class that manages OAuth provider instances throughout the application lifecycle.

### Key Features

- **Singleton Pattern**: Ensures one registry instance per application
- **Provider Management**: Register, retrieve, and manage OAuth providers
- **Name Normalization**: Automatic normalization of provider names (trim, lowercase)
- **Error Handling**: Comprehensive error handling with descriptive messages
- **Testing Support**: Methods for clearing and unregistering providers

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
import { OAuthProviderRegistry } from '~/src/utilities/auth/oauth/OAuthProviderRegistry';
import { GoogleOAuthProvider } from '~/src/utilities/auth/oauth/providers/GoogleOAuthProvider';

// Get singleton instance
const registry = OAuthProviderRegistry.getInstance();

// Register a provider
const googleProvider = new GoogleOAuthProvider({
  clientId: process.env.GOOGLE_CLIENT_ID!,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  redirectUri: process.env.GOOGLE_REDIRECT_URI,
});

registry.register(googleProvider);

// Retrieve and use a provider
const provider = registry.get('google');
const tokenResponse = await provider.exchangeCodeForTokens(code, redirectUri);
const userProfile = await provider.getUserProfile(tokenResponse.access_token);
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
  access_token: string;      // Required: OAuth access token
  token_type: string;        // Required: Token type (usually "Bearer")
  expires_in?: number;       // Optional: Token expiration time in seconds
  refresh_token?: string;    // Optional: Refresh token for renewing access
  scope?: string;           // Optional: Granted scopes
  id_token?: string;        // Optional: OpenID Connect ID token
}
```

### OAuthUserProfile

Normalized user profile structure:

```typescript
interface OAuthUserProfile {
  providerId: string;        // Required: Unique user ID from provider
  email?: string;           // Optional: User email address
  name?: string;            // Optional: User display name
  picture?: string;         // Optional: User profile picture URL
  emailVerified?: boolean;  // Optional: Email verification status
}
```

### OAuthConfig

Configuration object for OAuth providers:

```typescript
interface OAuthConfig {
  clientId: string;              // Required: OAuth client ID
  clientSecret: string;          // Required: OAuth client secret
  redirectUri?: string;          // Optional: Redirect URI
  requestTimeoutMs?: number;     // Optional: Request timeout (default: 10000ms)
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
  redirectUri: process.env.OAUTH_REDIRECT_URI,
  requestTimeoutMs: parseInt(process.env.OAUTH_TIMEOUT_MS || '10000'),
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
    logger.error('Token exchange failed:', error.message);
  } else if (error instanceof ProfileFetchError) {
    // Handle profile fetch failure
    logger.error('Profile fetch failed:', error.message);
  } else if (error instanceof OAuthError && error.code === 'PROVIDER_NOT_FOUND') {
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
import { OAuthProviderRegistry } from '~/src/utilities/auth/oauth/OAuthProviderRegistry';

beforeEach(() => {
  // Clear registry before each test
  const registry = OAuthProviderRegistry.getInstance();
  registry.clear();
});
```

### 4. Security Considerations

- Never log or expose `clientSecret` in error messages