import {
  EVENT_VOLUNTEER_GROUP_NOT_FOUND_ERROR,
  EVENT_VOLUNTEER_MEMBERSHIP_NOT_FOUND_ERROR,
  EVENT_VOLUNTEER_NOT_FOUND_ERROR,
  USER_NOT_AUTHORIZED_ERROR,
  USER_NOT_FOUND_ERROR,
} from "../constants";
import { errors, requestContext } from "../libraries";
import type {
  InterfaceAppUserProfile,
  InterfaceEventVolunteer,
  InterfaceEventVolunteerGroup,
  InterfaceUser,
  InterfaceVolunteerMembership,
} from "../models";
import {
  AppUserProfile,
  EventVolunteer,
  EventVolunteerGroup,
  User,
  VolunteerMembership,
} from "../models";
import { cacheAppUserProfile } from "../services/AppUserProfileCache/cacheAppUserProfile";
import { findAppUserProfileCache } from "../services/AppUserProfileCache/findAppUserProfileCache";
import { cacheUsers } from "../services/UserCache/cacheUser";
import { findUserInCache } from "../services/UserCache/findUserInCache";

/**
 * This function checks if the user exists.
 * @param userId - user id
 * @returns User
 */

export const checkUserExists = async (
  userId: string,
): Promise<InterfaceUser> => {
  let currentUser: InterfaceUser | null;
  const userFoundInCache = await findUserInCache([userId]);
  currentUser = userFoundInCache[0];

  if (currentUser === null) {
    currentUser = await User.findById(userId).lean();
    if (currentUser !== null) await cacheUsers([currentUser]);
  }

  if (!currentUser) {
    throw new errors.NotFoundError(
      requestContext.translate(USER_NOT_FOUND_ERROR.MESSAGE),
      USER_NOT_FOUND_ERROR.CODE,
      USER_NOT_FOUND_ERROR.PARAM,
    );
  }
  return currentUser;
};

/**
 * This function checks if the user has an app profile.
 * @param user - user object
 * @returns AppUserProfile
 */
export const checkAppUserProfileExists = async (
  user: InterfaceUser,
): Promise<InterfaceAppUserProfile> => {
  let currentUserAppProfile: InterfaceAppUserProfile | null;
  const appUserProfileFoundInCache = await findAppUserProfileCache([
    user.appUserProfileId?.toString(),
  ]);
  currentUserAppProfile = appUserProfileFoundInCache[0];
  if (currentUserAppProfile === null) {
    currentUserAppProfile = await AppUserProfile.findOne({
      userId: user._id,
    }).lean();
    if (currentUserAppProfile !== null) {
      await cacheAppUserProfile([currentUserAppProfile]);
    }
  }
  if (!currentUserAppProfile) {
    throw new errors.UnauthorizedError(
      requestContext.translate(USER_NOT_AUTHORIZED_ERROR.MESSAGE),
      USER_NOT_AUTHORIZED_ERROR.CODE,
      USER_NOT_AUTHORIZED_ERROR.PARAM,
    );
  }
  return currentUserAppProfile;
};

/**
 * This function checks if the event volunteer exists.
 * @param volunteerId - event volunteer id
 * @returns EventVolunteer
 */
export const checkEventVolunteerExists = async (
  volunteerId: string,
): Promise<InterfaceEventVolunteer> => {
  const volunteer = await EventVolunteer.findById(volunteerId);

  if (!volunteer) {
    throw new errors.NotFoundError(
      requestContext.translate(EVENT_VOLUNTEER_NOT_FOUND_ERROR.MESSAGE),
      EVENT_VOLUNTEER_NOT_FOUND_ERROR.CODE,
      EVENT_VOLUNTEER_NOT_FOUND_ERROR.PARAM,
    );
  }

  return volunteer;
};

/**
 * This function checks if the volunteer group exists.
 * @param groupId - event volunteer group id
 * @returns EventVolunteerGroup
 */

export const checkVolunteerGroupExists = async (
  groupId: string,
): Promise<InterfaceEventVolunteerGroup> => {
  const volunteerGroup = await EventVolunteerGroup.findOne({
    _id: groupId,
  });

  if (!volunteerGroup) {
    throw new errors.NotFoundError(
      requestContext.translate(EVENT_VOLUNTEER_GROUP_NOT_FOUND_ERROR.MESSAGE),
      EVENT_VOLUNTEER_GROUP_NOT_FOUND_ERROR.CODE,
      EVENT_VOLUNTEER_GROUP_NOT_FOUND_ERROR.PARAM,
    );
  }
  return volunteerGroup;
};

/**
 * This function checks if the volunteerMembership exists.
 * @param membershipId - id
 * @returns VolunteerMembership
 */
export const checkVolunteerMembershipExists = async (
  membershipId: string,
): Promise<InterfaceVolunteerMembership> => {
  const volunteerMembership = await VolunteerMembership.findOne({
    _id: membershipId,
  });

  if (!volunteerMembership) {
    throw new errors.NotFoundError(
      requestContext.translate(
        EVENT_VOLUNTEER_MEMBERSHIP_NOT_FOUND_ERROR.MESSAGE,
      ),
      EVENT_VOLUNTEER_MEMBERSHIP_NOT_FOUND_ERROR.CODE,
      EVENT_VOLUNTEER_MEMBERSHIP_NOT_FOUND_ERROR.PARAM,
    );
  }
  return volunteerMembership;
};
