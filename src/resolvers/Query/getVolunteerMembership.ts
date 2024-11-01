import type {
  InputMaybe,
  QueryResolvers,
  VolunteerMembershipOrderByInput,
} from "../../types/generatedGraphQLTypes";
import type { InterfaceVolunteerMembership } from "../../models";
import { EventVolunteer, VolunteerMembership } from "../../models";
import { getSort } from "./helperFunctions/getSort";

/**
 * Helper function to fetch volunteer memberships by userId
 */
const getVolunteerMembershipsByUserId = async (
  userId: string,
  orderBy: InputMaybe<VolunteerMembershipOrderByInput> | undefined,
  status?: string,
): Promise<InterfaceVolunteerMembership[]> => {
  const sort = getSort(orderBy);
  const volunteerInstance = await EventVolunteer.find({ user: userId }).lean();
  const volunteerIds = volunteerInstance.map((volunteer) => volunteer._id);

  return await VolunteerMembership.find({
    volunteer: { $in: volunteerIds },
    ...(status && { status }),
  })
    .sort(sort)
    .populate("event")
    .populate("group")
    .populate({
      path: "volunteer",
      populate: {
        path: "user",
      },
    })
    .lean();
};

/**
 * Helper function to fetch volunteer memberships by eventId
 */
const getVolunteerMembershipsByEventId = async (
  eventId: string,
  orderBy: InputMaybe<VolunteerMembershipOrderByInput> | undefined,
  status?: string,
  group?: string,
): Promise<InterfaceVolunteerMembership[]> => {
  const sort = getSort(orderBy);

  return await VolunteerMembership.find({
    event: eventId,
    ...(status && { status }),
    ...(group && { group: group }),
  })
    .sort(sort)
    .populate("event")
    .populate("group")
    .populate({
      path: "volunteer",
      populate: {
        path: "user",
      },
    })
    .lean();
};

/**
 * Helper function to filter memberships based on various criteria
 */
const filterMemberships = (
  memberships: InterfaceVolunteerMembership[],
  filter?: string,
  eventTitle?: string,
  userName?: string,
): InterfaceVolunteerMembership[] => {
  return memberships.filter((membership) => {
    const filterCondition = filter
      ? filter === "group"
        ? !!membership.group
        : !membership.group
      : true;

    const eventTitleCondition = eventTitle
      ? membership.event.title.includes(eventTitle)
      : true;

    const userNameCondition = userName
      ? (
          membership.volunteer.user.firstName +
          membership.volunteer.user.lastName
        ).includes(userName)
      : true;

    return filterCondition && eventTitleCondition && userNameCondition;
  });
};

export const getVolunteerMembership: QueryResolvers["getVolunteerMembership"] =
  async (_parent, args) => {
    const { status, userId, filter, eventTitle, eventId, userName, groupId } =
      args.where;

    let volunteerMemberships: InterfaceVolunteerMembership[] = [];

    if (userId) {
      volunteerMemberships = await getVolunteerMembershipsByUserId(
        userId,
        args.orderBy,
        status ?? undefined,
      );
    } else if (eventId) {
      volunteerMemberships = await getVolunteerMembershipsByEventId(
        eventId,
        args.orderBy,
        status ?? undefined,
        groupId ?? undefined,
      );
    }

    if (filter || eventTitle || userName) {
      return filterMemberships(
        volunteerMemberships,
        filter ?? undefined,
        eventTitle ?? undefined,
        userName ?? undefined,
      );
    }

    return volunteerMemberships;
  };
