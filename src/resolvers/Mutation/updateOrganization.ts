import { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { Organization } from "../../models";
import { ORGANIZATION_NOT_FOUND_ERROR } from "../../constants";
import { adminCheck } from "../../utilities";

export const updateOrganization: MutationResolvers["updateOrganization"] =
  async (_parent, args, context) => {
    const organization = await Organization.findOne({
      _id: args.id,
    }).lean();

    // Checks if organization with _id === args.id exists.
    if (!organization) {
      throw new errors.NotFoundError(
        requestContext.translate(ORGANIZATION_NOT_FOUND_ERROR.MESSAGE),
        ORGANIZATION_NOT_FOUND_ERROR.CODE,
        ORGANIZATION_NOT_FOUND_ERROR.PARAM
      );
    }

    // checks if the current user is an admin of the organization
    await adminCheck(context.userId, organization);

    return await Organization.findOneAndUpdate(
      {
        _id: organization._id,
      },
      {
        $set: {
          ...args.data,
        },
      },
      {
        new: true,
      }
    ).lean();
  };
