# About this directory

This directory is intended for storing the pothos schema definitions for the graphql scalars used in talawa api's graphql implementation. More about implementing graphql scalars with pothos at [this](https://pothos-graphql.dev/docs/guide/scalars) link.

# Conventions

The following coventions are to be followed within this directory:-

1. The sdl name of a graphql type must follow the `PascalCase` naming convention.

2. The file containing the pothos schema definition of a graphql scalar must be named the same as the sdl name of that graphql scalar and it must be imported in the `./index.ts` file in the same directory for pothos's executable schema builder to work.

3. The file must also export a typescript type named the same as the sdl name of that graphql scalar and satisfying the type `Record<"Input" | "Output", unknown>`(where `unknown` corresponds to any valid javascript data type). This type must be imported in the `./index.ts` file in the same directory and then re-exported as a field of a type named `PothosScalars` under a namespace which is named the same as the sdl name of that graphql scalar.

4. The exported scalar typescript type conflicting with javascript global variables must be prefixed with an underscore `_` or a viable alternative if necessary.

Here's an example depicting these rules: 

```typescript
// DateTime.ts
import { DateResolver } from "graphql-scalars";
import { builder } from "~/src/graphql/builder";

/**
 * More information at this link: {@link https://the-guild.dev/graphql/scalars/docs/scalars/date}
 */
builder.addScalarType("Date", DateResolver);

/**
 * `Date` scalar type for pothos schema.
 */
export type _Date = {
	Input: Date;
	Output: Date;
};
```
```typescript
// ~/src/graphql/unions/index.ts
import "./Date";
import { _Date } from "./Date"

export type Scalars = {
	Date: _Date
}
```
In this example: 

1. The sdl name of the graphql scalar is `Date` which follows the `PascalCase` naming convention.

2. The file containing the pothos schema definition of the graphql scalar is named `Date.ts` which is the same as the sdl name `Date` of that graphql scalar and it is imported in the `./index.ts` file in the same directory.

3. The file exports the `_Date` typescript type named the same as the sdl name of that graphql scalar satisfying the type `Record<"INPUT" | "OUTPUT", unknown>` and that type is imported in the `./index.ts` file in the same directory and then re-exported as a field of type `PothosScalars` under the namespace `Date` which is named the same as the sdl name of that graphql scalar.

4. The exported typescript type `_Date` is prefixed with an underscore `_` to prevent conflicts with the javascript global variable `Date`.