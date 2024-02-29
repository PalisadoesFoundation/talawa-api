// import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
// import { Advertisement } from "../../models";

// /**
//  * This function returns list of Advertisement from the database.
//  * @returns An object that contains a list of Ads.
//  */
// export const advertisementsConnection: QueryResolvers["advertisementsConnection"] =
//   async (_parent, _args, context) => {
//     const advertisements = await Advertisement.find().lean();
//     const advertisementsWithMediaURLResolved = advertisements.map(
//       (advertisement) => ({
//         ...advertisement,
//         mediaUrl: `${context.apiRootUrl}${advertisement.mediaUrl}`,
//         organization: {
//           _id: advertisement.organizationId,
//         },
//       }),
//     );

//     return advertisementsWithMediaURLResolved;
//   };

import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import type { InterfaceAdvertisement } from "../../models";
import { Advertisement } from "../../models";
import {
  getCommonGraphQLConnectionFilter,
  getCommonGraphQLConnectionSort,
  parseGraphQLConnectionArguments,
  transformToDefaultGraphQLConnection,
  type DefaultGraphQLArgumentError,
  type ParseGraphQLConnectionCursorArguments,
  type ParseGraphQLConnectionCursorResult,
} from "../../utilities/graphQLConnection";
import { GraphQLError } from "graphql";
import { MAXIMUM_FETCH_LIMIT } from "../../constants";

export const advertisementsConnection: QueryResolvers["advertisementsConnection"] =
  async (_parent, args, context) => {
    const parseGraphQLConnectionArgumentsResult =
      await parseGraphQLConnectionArguments({
        args,
        parseCursor: (args) =>
          parseCursor({
            ...args,
          }),
        maximumLimit: MAXIMUM_FETCH_LIMIT,
      });

    if (!parseGraphQLConnectionArgumentsResult.isSuccessful) {
      throw new GraphQLError("Invalid arguments provided.", {
        extensions: {
          code: "INVALID_ARGUMENTS",
          errors: parseGraphQLConnectionArgumentsResult.errors,
        },
      });
    }

    const { parsedArgs } = parseGraphQLConnectionArgumentsResult;

    const filter = getCommonGraphQLConnectionFilter({
      cursor: parsedArgs.cursor,
      direction: parsedArgs.direction,
    });

    const sort = getCommonGraphQLConnectionSort({
      direction: parsedArgs.direction,
    });

    const [objectList, totalCount] = await Promise.all([
      Advertisement.find({
        ...filter,
      })
        .sort(sort)
        .limit(parsedArgs.limit)
        .lean()
        .exec(),
      Advertisement.find().countDocuments().exec(),
    ]);

    objectList.map((advertisement: InterfaceAdvertisement) => ({
      ...advertisement,
      mediaUrl: `${context.apiRootUrl}${advertisement.mediaUrl}`,
      organization: {
        _id: advertisement.organizationId,
      },
    }));

    return transformToDefaultGraphQLConnection<
      ParsedCursor,
      InterfaceAdvertisement,
      InterfaceAdvertisement
    >({
      objectList,
      parsedArgs,
      totalCount,
    });
  };

/*
This is typescript type of the parsed cursor for this connection resolver.
*/
type ParsedCursor = string;

/*
This function is used to validate and transform the cursor passed to this connnection
resolver.
*/
export const parseCursor = async ({
  cursorValue,
  cursorName,
  cursorPath,
}: ParseGraphQLConnectionCursorArguments): ParseGraphQLConnectionCursorResult<ParsedCursor> => {
  const errors: DefaultGraphQLArgumentError[] = [];
  const advertisement = await Advertisement.findOne({
    _id: cursorValue,
  });

  if (!advertisement) {
    errors.push({
      message: `Argument ${cursorName} is an invalid cursor.`,
      path: cursorPath,
    });
  }

  if (errors.length !== 0) {
    return {
      errors,
      isSuccessful: false,
    };
  }

  return {
    isSuccessful: true,
    parsedCursor: cursorValue,
  };
};
