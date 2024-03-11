import type { InterfaceUser } from "../../models";
import { User } from "../../models";
import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import { getSort } from "./helperFunctions/getSort";
import { getWhere } from "./helperFunctions/getWhere";

/**
 * This query will retrieve from the database a list of members
 * in the organisation under the specified limit for the specified page in the pagination.
 * @param _parent-
 * @param args - An object holds the data required to execute the query.
 * `args.first` specifies the number of members to retrieve, and `args.after` specifies
 * the unique identification for each item in the returned list.
 * @returns An object containing the list of members and pagination information.
 * @remarks Connection in graphQL means pagination,
 * learn more about Connection {@link https://relay.dev/graphql/connections.htm | here}.
 */
export const organizationsMemberConnection: QueryResolvers["organizationsMemberConnection"] =
  async (_parent, args, context) => {
    const where = getWhere<InterfaceUser>(args.where);
    const sort = getSort(args.orderBy);

    // Pagination based Options
    interface InterfacePaginateOptions {
      lean?: boolean | undefined;
      sort?: object | string | undefined;
      pagination?: boolean | undefined;
      page?: number | undefined;
      limit?: number | undefined;
    }
    let paginateOptions: InterfacePaginateOptions =
      {} as InterfacePaginateOptions;

    if (args.first) {
      if (args.skip === null) {
        throw "Missing Skip parameter. Set it to either 0 or some other value";
      }
      paginateOptions = {
        lean: true,
        sort: sort,
        pagination: true,
        page: args.skip,
        limit: args.first,
      } as InterfacePaginateOptions;
    } else {
      paginateOptions = {
        sort: sort,
        pagination: false,
      } as InterfacePaginateOptions;
    }

    const usersModel = await User.paginate(
      {
        joinedOrganizations: {
          _id: args.orgId,
        },
        ...where,
      },
      {
        ...paginateOptions,
        populate: ["registeredEvents"],
        select: ["-password"],
      },
    );

    let users: InterfaceUser[] = []; // Change the type of users

    if (paginateOptions.pagination) {
      //@ts-expect-error - type error
      users = usersModel.docs.map((user) => {
        return {
          ...user,
          image: user.image ? `${context.apiRootUrl}${user.image}` : null,
          password: null,
        };
      });
    } else {
      //@ts-expect-error - type error
      users = usersModel.docs.map((user) => {
        return {
          ...user,
          image: user.image ? `${context.apiRootUrl}${user.image}` : null,
          password: null,
        };
      });
    }

    return {
      pageInfo: {
        hasNextPage: usersModel.hasNextPage,
        hasPreviousPage: usersModel.hasPrevPage,
        totalPages: usersModel.totalPages,
        nextPageNo: usersModel.nextPage,
        prevPageNo: usersModel.prevPage,
        currPageNo: usersModel.page,
      },
      edges: users,
      aggregate: {
        count: usersModel.totalDocs,
      },
    };
  };
