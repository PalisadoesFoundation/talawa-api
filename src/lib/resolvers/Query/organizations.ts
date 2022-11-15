import {
  InputMaybe,
  OrganizationOrderByInput,
  QueryResolvers,
} from "../../../generated/graphqlCodegen";
import { Organization } from "../../models";
import { errors, requestContext } from "../../libraries";
import {
  IN_PRODUCTION,
  ORGANIZATION_NOT_FOUND,
  ORGANIZATION_NOT_FOUND_CODE,
  ORGANIZATION_NOT_FOUND_MESSAGE,
  ORGANIZATION_NOT_FOUND_PARAM,
} from "../../../constants";

/**
 * If a 'id' is specified, this query will return an organisation;
 * otherwise, it will return all organisations with a size of limit 100.
 * @param _parent 
 * @param args - An object containing `orderBy` and `id` of the Organization.
 * @returns The organization if valid `id` is provided else return organizations with size limit 100.
 * @remarks `id` in the args is optional.
 */
export const organizations: QueryResolvers["organizations"] = async (
  _parent,
  args
) => {
  const sort = getSort(args.orderBy);

  if (args.id) {
    const organizationFound = await Organization.find({
      _id: args.id,
    })
      .sort(sort)
      .lean();

    if (!organizationFound[0]) {
      throw new errors.NotFoundError(
        IN_PRODUCTION !== true
          ? ORGANIZATION_NOT_FOUND
          : requestContext.translate(ORGANIZATION_NOT_FOUND_MESSAGE),
        ORGANIZATION_NOT_FOUND_CODE,
        ORGANIZATION_NOT_FOUND_PARAM
      );
    }

    return organizationFound;
  } else {
    return await Organization.find().sort(sort).limit(100).lean();
  }
};

const getSort = (orderBy: InputMaybe<OrganizationOrderByInput> | undefined) => {
  if (orderBy !== null) {
    if (orderBy === "id_ASC") {
      return { _id: 1 };
    } else if (orderBy === "id_DESC") {
      return { _id: -1 };
    } else if (orderBy === "name_ASC") {
      return { name: 1 };
    } else if (orderBy === "name_DESC") {
      return { name: -1 };
    } else if (orderBy === "description_ASC") {
      return { description: 1 };
    } else if (orderBy === "description_DESC") {
      return { description: -1 };
    } else if (orderBy === "apiUrl_ASC") {
      return { apiUrl: 1 };
    } else {
      return { apiUrl: -1 };
    }
  }

  return {};
};
