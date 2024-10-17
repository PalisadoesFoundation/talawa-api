# About this directory

Talawa api's graphql implementation follows code-first approach using the pothos library. This directory is intended for storing all pothos schema definitions used for talawa api's graphql implementation.

# About pothos

Pothos is a code-first graphql schema builder written from the ground up to be fully compatible with typescript with an extensible plugin-based architecture. More about pothos can be found at [this](https://pothos-graphql.dev/) link. As far as we're aware it is currently the best typescript based graphql library for implementing graphql with the code-first approach.

# Pothos requirement

Pothos relies on the side-effect feature of javascript module imports for resolving pothos schema definitions at runtime to create the executable graphql schema for consumption by the graphql server. More about javascript's side-effect module imports can be found at [this](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/import#import_a_module_for_its_side_effects_only) link.

# Directory structure

There must be directories corresponding to each graphql data type where pothos schema definitions for that graphql data type are defined. To facilitate pothos's reliance on side-effect feature of javascript's module imports each one of those directories must define an `index.ts` file that imports the pothos schema definitions for the graphql data type they're meant to contain. The pothos schema definitions in the files listed below are imported into the execution context of the `./index.ts` file: 

1. `./enums/index.ts`
2. `./inputs/index.ts`
3. `./interfaces/index.ts`
4. `./scalars/index.ts`
5. `./types/index.ts`
6. `./unions/index.ts`

Other than this there aren't any strict directory structure requirements.