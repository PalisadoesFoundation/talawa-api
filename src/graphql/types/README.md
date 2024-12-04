# About this directory

This directory is intended for storing the pothos schema definitions for the graphql types used in talawa api's graphql implementation. More about implementing graphql types with pothos at [this](https://pothos-graphql.dev/docs/guide/objects) link.

# Conventions

The following coventions are to be followed within this directory: 

1. The sdl name of a graphql type must follow the `PascalCase` naming convention.

2. The file containing the pothos schema definition for a graphql type must be named the same as the sdl name for that graphql type and it must be imported in the `./index.ts` file in the same directory for pothos's executable schema builder to work.

3. All the fields of a graphql type must follow the `camelCase` naming convention.

4. The object reference to the pothos schema definition for a graphql type must be a pothos `objectRef` named export named the same as the sdl name of that graphql type suffixed with the keyword `Ref`.

5. If a single file for a graphql type gets enormous in size, create a directory that is named the same as the sdl name of that graphql type and within it follow all the previous steps.

Here's an example depicting these rules: 

```typescript
// ~/src/graphql/types/User/User.ts
import { builder } from "~/src/graphql/builder";

type User = {
	age: number;
    name: string;
};

export const UserRef = builder.objectRef<User>("User");

UserRef.implement({
	fields: (t) => ({
		age: t.exposeInt("age"),
        name: t.exposeString("name")
	}),
});
```
```typescript
// ~/src/graphql/types/User/index.ts
import "./User";
```
```typescript
// ~/src/graphql/types/Post/Post.ts
import { builder } from "~/src/graphql/builder";

type Post = {
	body: string;
    creatorId: string;
    title: string;
};

export const PostRef = builder.objectRef<Post>("Post");

PostRef.implement({
	fields: (t) => ({
		body: t.exposeInt("body"),
        title: t.exposeString("title")
	}),
});
```
```typescript
// ~/src/graphql/types/Post/creator.ts
import { builder } from "~/src/graphql/builder";
import { UserRef } from "~/src/graphql/types/User/User";
import { PostRef } from "./Post";

PostRef.implement({
	fields: (t) => ({
		creator: t.expose({
            resolve: (parent, args, ctx) => {
                return await ctx.drizzleClient.query.user.findFirst({
                    where: (fields, operators) => {
                        return operators.eq(fields.id, parent.creatorId);
                    }
                })
            },
            type: UserRef
        }),
	}),
});
```
```typescript
// ~/src/graphql/types/Post/index.ts
import "./Post";
import "./creator";
```
```typescript
// ~/src/graphql/types/index.ts
import "./Post/index";
import "./User/index";
```
In this example: 

1. The sdl name of the graphql type is `User` which follows the `PascalCase` naming convention.

2. The file containing the pothos schema definition of the graphql type is named `User.ts` which is the same as the sdl name `User` of that graphql type and it is imported in the `./index.ts` file in the same directory.

3. The fields of the graphql type are `age` and `name` which follow the `camelCase` naming convention.

4. The object reference to the pothos schema definition for the graphql type is a named export named `UserRef` which is the same as the sdl name of that graphql type suffixed with the keyword `Ref`.

5. A directory named `Post` is created for the graphql type `Post` and all the previous steps are followed in this directory.