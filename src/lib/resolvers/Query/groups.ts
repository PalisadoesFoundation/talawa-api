import { QueryResolvers } from "../../../generated/graphqlCodegen";
import { Group } from "../../models";

export const groups: QueryResolvers["groups"] = async () => {
  return await Group.find().lean();
};
