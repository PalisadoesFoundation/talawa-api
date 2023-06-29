import type { CheckInResolvers } from "../../types/generatedGraphQLTypes";
import { event } from "./event";
import { user } from "./user";

export const CheckIn: CheckInResolvers = {
  event,
  user,
};
