[Admin Docs](/)

***

# Variable: envConfigSchema

> `const` **envConfigSchema**: `TObject`\<\{ `API_ADMINISTRATOR_USER_EMAIL_ADDRESS`: `TString`; `API_ADMINISTRATOR_USER_NAME`: `TString`; `API_ADMINISTRATOR_USER_PASSWORD`: `TString`; `API_BASE_URL`: `TString`; `API_COMMUNITY_FACEBOOK_URL`: `TOptional`\<`TString`\>; `API_COMMUNITY_GITHUB_URL`: `TOptional`\<`TString`\>; `API_COMMUNITY_INACTIVITY_TIMEOUT_DURATION`: `TOptional`\<`TInteger`\>; `API_COMMUNITY_INSTAGRAM_URL`: `TOptional`\<`TString`\>; `API_COMMUNITY_LINKEDIN_URL`: `TOptional`\<`TString`\>; `API_COMMUNITY_NAME`: `TString`; `API_COMMUNITY_REDDIT_URL`: `TOptional`\<`TString`\>; `API_COMMUNITY_SLACK_URL`: `TOptional`\<`TString`\>; `API_COMMUNITY_WEBSITE_URL`: `TOptional`\<`TString`\>; `API_COMMUNITY_X_URL`: `TOptional`\<`TString`\>; `API_COMMUNITY_YOUTUBE_URL`: `TOptional`\<`TString`\>; `API_HOST`: `TString`; `API_IS_APPLY_DRIZZLE_MIGRATIONS`: `TBoolean`; `API_IS_GRAPHIQL`: `TBoolean`; `API_IS_PINO_PRETTY`: `TBoolean`; `API_JWT_EXPIRES_IN`: `TNumber`; `API_JWT_SECRET`: `TString`; `API_LOG_LEVEL`: `TEnum`\<\{ `debug`: `"debug"`; `error`: `"error"`; `fatal`: `"fatal"`; `info`: `"info"`; `trace`: `"trace"`; `warn`: `"warn"`; \}\>; `API_MINIO_ACCESS_KEY`: `TString`; `API_MINIO_END_POINT`: `TString`; `API_MINIO_PORT`: `TNumber`; `API_MINIO_SECRET_KEY`: `TString`; `API_MINIO_USE_SSL`: `TBoolean`; `API_PORT`: `TNumber`; `API_POSTGRES_DATABASE`: `TString`; `API_POSTGRES_HOST`: `TString`; `API_POSTGRES_PASSWORD`: `TString`; `API_POSTGRES_PORT`: `TNumber`; `API_POSTGRES_SSL_MODE`: `TUnion`\<\[`TEnum`\<\{ `allow`: `"allow"`; `prefer`: `"prefer"`; `require`: `"require"`; `verify_full`: `"verify-full"`; \}\>, `TBoolean`\]\>; `API_POSTGRES_USER`: `TString`; `MINIO_ROOT_USER`: `TOptional`\<`TString`\>; \}\>

Defined in: [src/envConfigSchema.ts:8](https://github.com/PratapRathi/talawa-api/blob/8be1a1231af103d298d6621405c956dc45d3a73a/src/envConfigSchema.ts#L8)

JSON schema of a record of environment variables accessible to the talawa api at runtime.
