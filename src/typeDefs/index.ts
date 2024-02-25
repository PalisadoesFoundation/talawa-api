import { directives } from "./directives";
import { enums } from "./enums";
import { errors } from "./errors";
import { inputs } from "./inputs";
import { interfaces } from "./interfaces";
import { mutations } from "./mutations";
import { queries } from "./queries";
import { scalars } from "./scalars";
import { subscriptions } from "./subscriptions";
import { types } from "./types";
// import { unions } from "./unions";

// 'gql' tag creates a value of type DocumentNode. Here typeDefs is an array of those DocumentNode type variables
// that can be directly consumed by apollo-server. This is done to have our type-defintions defined inside
// typescript files rather than .graphql files. Therefore, saving us the trouble of manually copying over those
// .graphql files to the build directory during build time and also providing the benefits of dynamically altering
// type-defintions using typescript.

export const typeDefs = [
  directives,
  enums,
  ...errors,
  inputs,
  interfaces,
  mutations,
  queries,
  scalars,
  subscriptions,
  types,
  // unions,
];
