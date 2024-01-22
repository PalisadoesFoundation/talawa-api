import type { FundResolvers } from "../../types/generatedGraphQLTypes";
import { creator } from "./creator";
import { organization } from "./organization";

export const Fund: FundResolvers = {
  creator,
  organization,
};
