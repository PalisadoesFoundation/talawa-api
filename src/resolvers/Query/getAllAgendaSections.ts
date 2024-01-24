import type { QueryResolvers } from "../../types/generatedGraphQLTypes";

import { AgendaSectionModel } from "../../models";

export const getAllAgendaSections: QueryResolvers["getAllAgendaSections"] =
  async () => {
    const agendaSections = await AgendaSectionModel.find().lean();
    return agendaSections;
  };
