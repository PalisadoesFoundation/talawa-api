import type { InterfaceAdvertisement } from "../../models";
import { Advertisement } from "../../models";
import type { OrganizationResolvers } from "../../types/generatedGraphQLTypes";
import { graphqlConnectionFactory } from "../../utilities/graphqlConnectionFactory";
import { parseRelayConnectionArguments } from "../../utilities/parseRelayConnectionArguments";

/**
 * Resolver function to fetch and return posts created by a user from the database.
 * @param parent - An object that is the return value of the resolver for this field's parent.
 * @param args - Arguments passed to the resolver.
 * @returns An object containing an array of posts,totalCount of post and pagination information.
 */
export const advertisements: OrganizationResolvers["advertisements"] = async (
  parent,
  args,
  context,
) => {
  const paginationArgs = parseRelayConnectionArguments(args, 10);

  // If the cursor is not a valid database object, return default GraphQL connection.

  const advertisementConnection =
    graphqlConnectionFactory<InterfaceAdvertisement>();

  const filter: Record<string, unknown> = {
    organizationId: parent._id,
  };

  // Set filter conditions based on pagination direction.
  if (paginationArgs.cursor) {
    if (paginationArgs.direction == "FORWARD") {
      filter._id = { $lt: paginationArgs.cursor };
    } else if (paginationArgs.direction == "BACKWARD") {
      filter._id = { $gt: paginationArgs.cursor };
    }
  }

  const totalCount = await Advertisement.countDocuments(filter);
  // Fetch advertisements from the database.
  const advertisements = await Advertisement.find(filter)
    .sort({ _id: paginationArgs.direction == "BACKWARD" ? 1 : -1 })
    .limit(paginationArgs.limit + 1)
    .lean();
  //if no advertisements found then return default graphqlConnection
  if (!advertisements || advertisements.length == 0) {
    return advertisementConnection;
  }
  // Check if there are more advertisements beyond the limit.
  if (advertisements.length > paginationArgs.limit) {
    if (paginationArgs.direction == "FORWARD") {
      advertisementConnection.pageInfo.hasNextPage = true;
    } else {
      advertisementConnection.pageInfo.hasPreviousPage = true;
    }
    advertisements.pop(); // Remove the extra post beyond the limit.
  }

  // Reverse advertisements if fetching in backward direction.
  if (paginationArgs.direction == "BACKWARD") {
    advertisements.reverse();
  }

  // Map advertisements to edges format.
  advertisementConnection.edges = advertisements.map((advertisement) => {
    advertisement = {
      ...advertisement,
      mediaUrl: `${context.apiRootUrl}${advertisement.mediaUrl}`,
    };
    return {
      node: advertisement,
      cursor: advertisement._id.toString(),
    };
  });
  advertisementConnection.totalCount = totalCount;

  // Set startCursor and endCursor in pageInfo.
  advertisementConnection.pageInfo.startCursor =
    advertisementConnection.edges[0]?.cursor;
  advertisementConnection.pageInfo.endCursor =
    advertisementConnection.edges[
      advertisementConnection.edges.length - 1
    ]?.cursor;

  return {
    edges: advertisementConnection.edges,
    pageInfo: advertisementConnection.pageInfo,
    totalCount: advertisementConnection.totalCount,
  };
};
