import type { FundResolvers } from "../../types/generatedGraphQLTypes";
import { campaigns } from "./campaigns";
import { creator } from "./creator";
export const Fund: FundResolvers = {
  campaigns,
  creator,
};
