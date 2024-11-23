# About this directory

This directory is intended for storing the pothos schema definitions for the graphql unions used in talawa api's graphql implementation. More about implementing graphql unions with pothos at [this](https://pothos-graphql.dev/docs/guide/unions) link.

# Conventions

The following coventions are to be followed within this directory: 

1. The sdl name of a graphql union must follow the `PascalCase` naming convention.

2. The file containing the pothos schema definition for a graphql union must be named the same as the sdl name of that graphql union and it must be imported in the `./index.ts` file in the same directory for pothos's executable schema builder to work.

3. The object reference to the pothos schema definition for a graphql union must be a named export named the same as the sdl name of that graphql union.

Here's an example depicting these rules: 

```typescript
// ~/src/graphql/unions/CreatePostResult.ts
import { builder } from "~/src/graphql/builder";

const UserRef = builder.objectRef<{ age: number; }>("User");
const ErrorRef = buidler.objectRef<{ message: string; }>("Error");

export const CreateUserResult = builder.unionType("CreateUserResult", {
    types: [UserRef, ErrorRef],
    resolveType: (parent) => {
        if ("age" in parent) {
            return UserRef;
        } else {
            return ErrorRef;
        }
    }
});
```
```typescript
// ~/src/graphql/unions/index.ts
import "./CreatePostResult";
```
In this example: 

1. The sdl name of the graphql union is `CreateUserResult` which follows the `PascalCase` naming convention.

2. The file containing the pothos schema definition of the graphql union is named `CreatePostResult.ts` which is the same as the sdl name of that graphql union and it is imported in the `./index.ts` file in the same directory.

3. The object reference to the pothos schema definition for the graphql union is a named export named `CreateUserResult` which is the same as the sdl name of that graphql union.