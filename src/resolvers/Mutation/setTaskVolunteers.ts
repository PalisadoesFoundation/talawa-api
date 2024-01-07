import {
  TASK_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
  VOLUNTEER_NOT_FOUND_ERROR,
  VOLUNTEER_NOT_MEMBER_ERROR,
} from "../../constants";
import type { MutationResolvers } from "../../types/generatedGraphQLTypes";
import { errors, requestContext } from "../../libraries";
import { User, Task, TaskVolunteer } from "../../models";
import { type ObjectId } from "mongoose";

const verifyUser = async (
  userId: string,
  memberIds: string[]
): Promise<void> => {
  const user = await User.findOne({
    _id: userId,
  });

  if (user === null) {
    throw new errors.NotFoundError(
      requestContext.translate(VOLUNTEER_NOT_FOUND_ERROR.MESSAGE),
      VOLUNTEER_NOT_FOUND_ERROR.CODE,
      VOLUNTEER_NOT_FOUND_ERROR.PARAM
    );
  }

  const isOrgMember = memberIds.some(
    (memberId) => memberId.toString() == userId.toString()
  );

  if (!isOrgMember) {
    throw new errors.NotFoundError(
      requestContext.translate(VOLUNTEER_NOT_MEMBER_ERROR.MESSAGE),
      VOLUNTEER_NOT_MEMBER_ERROR.CODE,
      VOLUNTEER_NOT_MEMBER_ERROR.PARAM
    );
  }
};

export const setTaskVolunteers: MutationResolvers["setTaskVolunteers"] = async (
  _parent,
  args,
  context
) => {
  const currentUser = await User.findOne({
    _id: context.userId,
  });

  if (currentUser === null) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM
    );
  }

  const task = await Task.findOne({
    _id: args.id,
  })
    .populate({
      path: "eventProjectId",
      populate: {
        path: "event",
        populate: {
          path: "organization",
        },
      },
    })
    .lean();

  if (!task) {
    throw new errors.NotFoundError(
      requestContext.translate(TASK_NOT_FOUND_ERROR.MESSAGE),
      TASK_NOT_FOUND_ERROR.CODE,
      TASK_NOT_FOUND_ERROR.PARAM
    );
  }

  if (
    task.creatorId.toString() !== context.userId.toString() &&
    currentUser.userType !== "SUPERADMIN"
  ) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM
    );
  }

  // Filter the volunteer list to only contain unique ids
  const volunteerIds = Array.from(new Set(args.volunteers));

  const orgMemberIds = task.eventProjectId.event.organization.members.map(
    (member: ObjectId) => member.toString()
  );

  // Verify that each of the volunteer id exist and they are an organization member
  for (let i = 0; i < volunteerIds.length; i++)
    await verifyUser(volunteerIds[i]!, orgMemberIds);

  // Delete all the exisiting volunteers
  await TaskVolunteer.deleteMany({
    taskId: args.id,
  });

  // Add the new volunteers
  await TaskVolunteer.create(
    volunteerIds.map((volunteerId) => ({
      taskId: args.id,
      userId: volunteerId,
    }))
  );

  return task;
};
