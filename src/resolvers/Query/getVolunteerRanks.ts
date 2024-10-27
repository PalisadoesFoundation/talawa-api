import { startOfWeek, startOfMonth, startOfYear, endOfDay } from "date-fns";
import type { QueryResolvers } from "../../types/generatedGraphQLTypes";
import type { InterfaceEvent, InterfaceUser } from "../../models";
import { Event, EventVolunteer } from "../../models";

/**
 * This query will fetch volunteer ranks based on the provided time frame (allTime, weekly, monthly, yearly),
 * and it will filter the results based on an array of volunteer IDs.
 * @param _parent - parent of the current request
 * @param args - An object that contains where object for volunteer ranks.
 *
 * @returns An array of `VolunteerRank` object.
 */
export const getVolunteerRanks: QueryResolvers["getVolunteerRanks"] = async (
  _parent,
  args,
) => {
  const { orgId } = args;
  const { timeFrame, orderBy, nameContains, limit } = args.where;

  const volunteerIds: string[] = [];
  const events = (await Event.find({
    organization: orgId,
  }).lean()) as InterfaceEvent[];

  // Get all volunteer IDs from the events
  events.forEach((event) => {
    volunteerIds.push(
      ...event.volunteers.map((volunteer) => volunteer.toString()),
    );
  });

  // Fetch all volunteers
  const volunteers = await EventVolunteer.find({
    _id: { $in: volunteerIds },
  })
    .populate("user")
    .lean();

  const now = new Date();
  let startDate: Date | null = null;
  let endDate: Date | null = null;

  // Determine the date range based on the timeframe
  switch (timeFrame) {
    case "weekly":
      startDate = startOfWeek(now);
      endDate = endOfDay(now);
      break;
    case "monthly":
      startDate = startOfMonth(now);
      endDate = endOfDay(now);
      break;
    case "yearly":
      startDate = startOfYear(now);
      endDate = endOfDay(now);
      break;
    case "allTime":
    default:
      startDate = null; // No filtering for "allTime"
      endDate = null;
      break;
  }

  // Accumulate total hours per user
  const userHoursMap = new Map<
    string,
    { hoursVolunteered: number; user: InterfaceUser }
  >();

  volunteers.forEach((volunteer) => {
    const userId = volunteer.user._id.toString();
    let totalHours = 0;

    // Filter hoursHistory based on the time frame
    if (startDate && endDate) {
      totalHours = volunteer.hoursHistory.reduce((sum, record) => {
        const recordDate = new Date(record.date);
        // Check if the record date is within the specified range
        if (recordDate >= startDate && recordDate <= endDate) {
          return sum + record.hours;
        }
        return sum;
      }, 0);
    } else {
      // If "allTime", use hoursVolunteered
      totalHours = volunteer.hoursVolunteered;
    }

    // Accumulate hours for each user
    /* c8 ignore start */
    const existingRecord = userHoursMap.get(userId);
    if (existingRecord) {
      existingRecord.hoursVolunteered += totalHours;
    } else {
      userHoursMap.set(userId, {
        hoursVolunteered: totalHours,
        user: volunteer.user,
      });
    }
    /* c8 ignore stop */
  });

  // Convert the accumulated map to an array
  const volunteerRanks = Array.from(userHoursMap.values());

  volunteerRanks.sort((a, b) => b.hoursVolunteered - a.hoursVolunteered);

  // Assign ranks, accounting for ties
  const rankedVolunteers = [];
  let currentRank = 1;
  let lastHours = -1;

  for (const volunteer of volunteerRanks) {
    if (volunteer.hoursVolunteered !== lastHours) {
      currentRank = rankedVolunteers.length + 1; // New rank
    }

    rankedVolunteers.push({
      rank: currentRank,
      user: volunteer.user,
      hoursVolunteered: volunteer.hoursVolunteered,
    });

    lastHours = volunteer.hoursVolunteered; // Update lastHours
  }

  // Sort the ranked volunteers based on the orderBy field

  if (orderBy === "hours_ASC") {
    rankedVolunteers.sort((a, b) => a.hoursVolunteered - b.hoursVolunteered);
  } else if (orderBy === "hours_DESC") {
    rankedVolunteers.sort((a, b) => b.hoursVolunteered - a.hoursVolunteered);
  }

  // Filter by name
  if (nameContains) {
    return rankedVolunteers.filter((volunteer) => {
      const fullName =
        `${volunteer.user.firstName} ${volunteer.user.lastName}`.toLowerCase();
      return fullName.includes(nameContains.toLowerCase());
    });
  }

  return limit ? rankedVolunteers.slice(0, limit) : rankedVolunteers;
};
