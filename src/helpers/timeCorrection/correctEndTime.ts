import {
  MutationCreateEventArgs,
  QueryCheckVenueArgs,
} from "./../../types/generatedGraphQLTypes";

export function correct(
  args: Partial<MutationCreateEventArgs | QueryCheckVenueArgs>
): Date {
  const endTimeObject = args.data?.endTime;
  const endDateObject = args.data?.endDate;
  const endDate = new Date(endDateObject);
  const endTime = new Date(endTimeObject);

  endTime.setFullYear(
    endDate.getFullYear(),
    endDate.getMonth(),
    endDate.getDate()
  );
  return endTime;
}
