import {
  MutationCreateEventArgs,
  QueryCheckVenueArgs,
} from "./../../types/generatedGraphQLTypes";

export function correct(
  args: Partial<MutationCreateEventArgs | QueryCheckVenueArgs>
): Date {
  const startTimeObject = args.data?.startTime;
  const startDateObject = args.data?.startDate;
  const startDate = new Date(startDateObject);
  const startTime = new Date(startTimeObject);

  startTime.setFullYear(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate()
  );
  return startTime;
}
