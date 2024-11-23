# About this directory

This directory is intended for storing the pothos schema definitions for the graphql inputs used in the talawa api's graphql implementation. More about implementing graphql inputs with pothos at [this](https://pothos-graphql.dev/docs/guide/inputs) link.

# Conventions

The following coventions are to be followed within this directory: 

1. The sdl name of a graphql input must follow the `PascalCase` naming convention consisting of a base keyword suffixed with the keyword `Input`.

2. The file containing the pothos schema definition for a graphql input must be named the same as the sdl name of that graphql input and it must be imported in the `./index.ts` file in the same directory for pothos's executable schema builder to work.

3. All the fields of a graphql input must follow the `camelCase` naming convention.

4. The object reference to the pothos schema definition for a graphql input must either be a pothos `inputRef` or `inputType` named export named the same as the sdl name of that graphql input.

Here's an example depicting these rules: 

```typescript
// ~/src/graphql/input/CreatePostInput.ts
type CreatePostInput = {
	body: string;
	title: string;
};

export const CreatePostInput = builder
	.inputRef<CreatePostInput>("CreatePostInput")
	.implement({
		fields: (t) => ({
			body: t.string({
				required: true,
			}),
			title: t.string({
				required: true,
			}),
		}),
	});
```
```typescript
// ~/src/graphql/input/DeleteAccountInput.ts
export const DeleteAccountInput = builder.inputType("DeleteAccountInput", {
	fields: (t) => {
		id: t.id({
			required: true,
		});
		reasonForDeletion: t.string();
	},
});
```
```typescript
// ~/src/graphql/input/index.ts
import "./CreatePostInput";
import "./DeleteAccountInput";
```
In this example: 

1. The sdl names of the graphql inputs are `CreatePostInput` and `DeleteAccountInput` which follow the `PascalCase` naming convention consisting of the base keywords `CreatePost` and `DeleteAccount` and both suffixed with the keyword `Input`.

2. The file containing the pothos schema definition for the graphql inputs are named `CreateMessageInput.ts` and `DeleteAccountInput.ts` which are the same as the sdl names those graphql inputs and it is imported in the `./index.ts` file in the same directory.

3. All the fields of the graphql inputs are following the `camelCase` naming convention.

4. The object references to the pothos schema definitions for the graphql inputs are named exports named `CreatePostInputRef` and `DeleteAccountInput` which are the same as the sdl names of those graphql inputs.