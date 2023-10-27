import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { Advertisement } from "../../models";
//eslint-disable-next-line @typescript-eslint/naming-convention
const { ObjectId } = require("mongodb");
// @ts-ignore
export const createAdvertisement: MutationResolvers["createAdvertisement"] =
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async (_parent, args, _context) => {
    // Creates new Ad.
    args.orgId = ObjectId(args.orgId);
    args.startDate = new Date(args.startDate);
    args.endDate = new Date(args.endDate);
    const createdAd = await Advertisement.create({
      ...args,
    });
    // Returns createdAd.
    return createdAd.toObject();
  };
