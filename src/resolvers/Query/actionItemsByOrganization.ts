import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import type {
  InterfaceActionItem,
  InterfaceActionItemCategory,
  InterfaceUser,
} from "../../models";
import { ActionItem } from "../../models";
import { getWhere } from "./helperFunctions/getWhere";
import { getSort } from "./helperFunctions/getSort";
/**
 * This query will fetch all action items for an organization from database.
 * @param _parent-
 * @param args - An object that contains `organizationId` which is the _id of the Organization.
 * @returns An `actionItems` object that holds all action items for the Event.
 */
export const actionItemsByOrganization: QueryResolvers["actionItemsByOrganization"] =
  async (_parent, args) => {
    const sort = getSort(args.orderBy);
    const where = getWhere(args.where);

    const actionItems = await ActionItem.find({
      organization: args.organizationId,
      event: args.eventId,
      ...where,
    })
      .populate("creator")
      .populate("assignee")
      .populate("assigner")
      .populate("actionItemCategory")
      .populate("organization")
      .populate("event")
      .sort(sort)
      .lean();

    let filteredActionItems: InterfaceActionItem[] = actionItems;

    // Filter the action items based on category name
    if (args.where?.categoryName) {
      filteredActionItems = filteredActionItems.filter((item) => {
        const tempItem = item as InterfaceActionItem;
        const category =
          tempItem.actionItemCategory as InterfaceActionItemCategory;
        return category.name.includes(args?.where?.categoryName as string);
      });
    }

    // Filter the action items based on assignee name
    if (args.where?.assigneeName) {
      filteredActionItems = filteredActionItems.filter((item) => {
        const tempItem = item as InterfaceActionItem;
        const assignee = tempItem.assignee as InterfaceUser;
        return assignee.firstName.includes(args?.where?.assigneeName as string);
      });
    }

    return filteredActionItems;
  };
