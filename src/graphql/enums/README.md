# About this directory

This directory is intended for storing the pothos schema definitions for the graphql enums used in the talawa api's graphql implementation. More about implementing graphql enums with pothos at [this](https://pothos-graphql.dev/docs/guide/enums) link.

# Conventions

The following coventions are to be followed within this directory: 

1. The sdl name of a graphql enum must follow the `PascalCase` naming convention consisting of a base keyword that represents the entity to which the enum is associated with and a suffix keyword that represents which aspect of that entity the enum contains the variants of.

2. The file containing the pothos schema definition for a graphql enum must be named the same as the sdl name of that graphql enum and it must be imported in the `./index.ts` file in the same directory for pothos's executable schema builder to work.

3. All the variants of a graphql enum must follow the `snake_case` naming convention.

4. The object reference to the pothos schema definition for a graphql enum must be a named export named the same as the sdl name of that graphql enum.

Here's an example depicting these rules: 

```typescript
// ~/src/graphql/enums/IceCreamFlavour.ts
import { builder } from "~/src/graphql/builder";

export const IceCreamFlavour = builder.enumType("IceCreamFlavour", {
	values: ["butter_pecan", "chocolate", "mint_chocolate_chip"] as const,
});
```
```typescript
// ~/src/graphql/enums/index.ts
import "./IceCreamFlavour";
```
In this example: 

1. The sdl name of the graphql enum is `IceCreamFlavour` which follows the `PascalCase` naming convention consisting of the base keyword `IceCream` and the suffix keyword `Flavour`.

2. The file containing the pothos schema definition of the graphql enum is named `IceCreamFlavour.ts` which is the same as the sdl name of that graphql enum and it is imported in the `./index.ts` file in the same directory.

3. The variants of the graphql enum are `butter_pecan`, `chocolate` and `mint_chocolate_chip` respectively which follow the `snake_case` naming convention.

4. The object reference to the pothos schema definition for the graphql enum is a named export named `IceCreamFlavour` which is the same as the sdl name of that graphql enum.