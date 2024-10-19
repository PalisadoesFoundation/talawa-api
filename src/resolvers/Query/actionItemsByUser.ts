import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import type {
  InterfaceActionItem,
  InterfaceActionItemCategory,
  InterfaceEventVolunteer,
  InterfaceUser,
} from "../../models";
import { EventVolunteer } from "../../models";

/**
 * This query will fetch all action items for an organization from database.
 * @param _parent-
 * @param args - An object that contains `organizationId` which is the _id of the Organization.
 * @returns An `actionItems` object that holds all action items for the Event.
 */
export const actionItemsByUser: QueryResolvers["actionItemsByUser"] = async (
  _parent,
  args,
) => {
  const volunteerObjects = await EventVolunteer.find({
    user: args.userId,
  })
    .populate({
      path: "assignments",
      populate: [
        { path: "creator" },
        {
          path: "assignee",
          populate: { path: "user" },
        },
        { path: "assigneeGroup" },
        { path: "assigner" },
        { path: "actionItemCategory" },
        { path: "organization" },
        { path: "event" },
      ],
    })
    .lean();

  let actionItems: InterfaceActionItem[] = [];
  volunteerObjects.forEach((volunteer) => {
    actionItems = actionItems.concat(volunteer.assignments);
  });

  let filteredActionItems: InterfaceActionItem[] = actionItems;

  // filtering based on category name
  if (args.where?.categoryName) {
    const categoryName = args.where.categoryName.toLowerCase();
    filteredActionItems = filteredActionItems.filter((item) => {
      const category = item.actionItemCategory as InterfaceActionItemCategory;
      return category.name.toLowerCase().includes(categoryName);
    });
  }

  // filtering based on assignee name
  if (args.where?.assigneeName) {
    const assigneeName = args.where.assigneeName.toLowerCase();

    filteredActionItems = filteredActionItems.filter((item) => {
      const assigneeType = item.assigneeType;

      if (assigneeType === "EventVolunteer") {
        const assignee = item.assignee as InterfaceEventVolunteer;
        const assigneeUser = assignee.user as InterfaceUser;

        return assigneeUser.firstName.toLowerCase().includes(assigneeName);
      } else if (assigneeType === "EventVolunteerGroup") {
        return item.assigneeGroup.name.toLowerCase().includes(assigneeName);
      }

      return false;
    });
  }

  if (args.orderBy === "dueDate_DESC") {
    filteredActionItems.sort((a, b) => {
      return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
    });
  } else if (args.orderBy === "dueDate_ASC") {
    filteredActionItems.sort((a, b) => {
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });
  }

  return filteredActionItems as InterfaceActionItem[];
};
