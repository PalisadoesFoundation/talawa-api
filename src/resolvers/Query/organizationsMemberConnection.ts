import type { SortOrder } from "mongoose";
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
      lean?: boolean;
      sort?: object | string | [string, SortOrder][];
      pagination?: boolean;
      page?: number;
      limit?: number;
      populate?: {
        path: string;
        populate?: {
          path: string;
          model: string;
          select?: string[];
        };
        select?: string[];
      }[];
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
        populate: [
          {
            path: "appUserProfileId",
            populate: [
              {
                path: "adminFor",
                model: "Organization",
              },
              {
                path: "createdOrganizations",
                model: "Organization",
              },
              {
                path: "createdEvents",
                model: "Organization",
              },
              {
                path: "eventAdmin",
                model: "Organization",
              },
            ],
          },
          {
            path: "registeredEvents",
          },
          {
            path: "joinedOrganizations",
          },
          {
            path: "membershipRequests",
          },
          {
            path: "organizationsBlockedBy",
          },
        ],
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
      },
    );

    let users: InterfaceUser[] = []; // Change the type of users

    if (paginateOptions.pagination) {
      users = usersModel.docs.map((user) => ({
        _id: user._id,
        identifier: user.identifier,
        appUserProfileId: user.appUserProfileId,
        address: {
          city: user.address?.city,
          countryCode: user.address?.countryCode,
          postalCode: user.address?.postalCode,
          dependentLocality: user.address?.dependentLocality,
          sortingCode: user.address?.sortingCode,
          line1: user.address?.line1,
          line2: user.address?.line2,
          state: user.address?.state,
        },
        birthDate: user.birthDate,
        createdAt: user.createdAt,
        educationGrade: user.educationGrade,
        email: user.email,
        employmentStatus: user.employmentStatus,
        firstName: user.firstName,
        gender: user.gender,
        image: user.image ? `${context.apiRootUrl}${user.image}` : null,
        joinedOrganizations: user.joinedOrganizations,
        lastName: user.lastName,
        maritalStatus: user.maritalStatus,
        membershipRequests: user.membershipRequests,
        organizationsBlockedBy: user.organizationsBlockedBy,
        password: null,
        phone: user.phone,
        registeredEvents: user.registeredEvents,
        status: user.status,
        updatedAt: user.updatedAt,
        eventsAttended: user.eventsAttended,
      }));
    } else {
      users = usersModel.docs.map((user) => ({
        _id: user._id,
        identifier: user.identifier,
        appUserProfileId: user.appUserProfileId,
        address: {
          city: user.address?.city,
          countryCode: user.address?.countryCode,
          postalCode: user.address?.postalCode,
          dependentLocality: user.address?.dependentLocality,
          sortingCode: user.address?.sortingCode,
          line1: user.address?.line1,
          line2: user.address?.line2,
          state: user.address?.state,
        },
        birthDate: user.birthDate,
        createdAt: user.createdAt,
        educationGrade: user.educationGrade,
        email: user.email,
        employmentStatus: user.employmentStatus,
        firstName: user.firstName,
        gender: user.gender,
        image: user.image ? `${context.apiRootUrl}${user.image}` : null,
        joinedOrganizations: user.joinedOrganizations,
        lastName: user.lastName,
        maritalStatus: user.maritalStatus,
        membershipRequests: user.membershipRequests,
        organizationsBlockedBy: user.organizationsBlockedBy,
        password: null,
        phone: user.phone,
        registeredEvents: user.registeredEvents,
        status: user.status,
        updatedAt: user.updatedAt,
        eventsAttended: user.eventsAttended,
      }));
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
