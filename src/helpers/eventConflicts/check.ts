import { Event, InterfaceEvent } from "../../models";
import {
  MutationCreateEventArgs,
  QueryCheckVenueArgs,
} from "./../../types/generatedGraphQLTypes";
export async function check(
  args: Partial<MutationCreateEventArgs>
): Promise<InterfaceEvent[]> {
  const conflictingEvents = await Event.find({
    organization: args.data?.organizationId,
    venue: args.data?.venue ?? "",
    $or: [
      {
        $and: [
          { startDate: { $lte: args.data?.startDate } },
          { endDate: { $gte: args.data?.startDate } },
        ],
      },
      {
        $and: [
          { startDate: { $lte: args.data?.endDate } },
          { endDate: { $gte: args.data?.endDate } },
        ],
      },
      {
        $and: [
          { startDate: { $gte: args.data?.startDate } },
          { endDate: { $lte: args.data?.endDate } },
        ],
      },
      {
        $and: [
          { startDate: { $lte: args.data?.startDate } },
          { endDate: { $gte: args.data?.endDate } },
        ],
      },
    ],
    $and: [
      // If the requested event is allDay then only date checks is sufficient
      args.data?.allDay === true
        ? {}
        : {
            $or: [
              {
                allDay: true,
              },
              {
                $and: [
                  { startTime: { $lte: args.data?.startTime } },
                  { endTime: { $gte: args.data?.startTime } },
                ],
              },
              {
                $and: [
                  { startTime: { $lte: args.data?.endTime } },
                  { endTime: { $gte: args.data?.endTime } },
                ],
              },
              {
                $and: [
                  { startTime: { $gte: args.data?.startTime } },
                  { endTime: { $lte: args.data?.endTime } },
                ],
              },
              {
                $and: [
                  { startTime: { $lte: args.data?.startTime } },
                  { endTime: { $gte: args.data?.endTime } },
                ],
              },
            ],
          },
    ],
  })
  return Array.isArray(conflictingEvents)
    ? conflictingEvents
    : [conflictingEvents];
}
