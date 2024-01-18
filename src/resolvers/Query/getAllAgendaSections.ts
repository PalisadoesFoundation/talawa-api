import { Types } from "mongoose";
import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { AGENDA_SECTION_NOT_FOUND_ERROR } from "../../constants";
import { AgendaSectionModel, User } from "../../models";
import { errors, requestContext } from "../../libraries";

export const getAllAgendaSections: QueryResolvers["getAllAgendaSections"] =
  async () => {
    try {
      const agendaSections = await AgendaSectionModel.find().lean();
      return agendaSections;
    } catch (error) {
      console.error(error);
      throw new errors.InternalServerError(
        "An error occurred while fetching all agenda sections"
      );
    }
  };
