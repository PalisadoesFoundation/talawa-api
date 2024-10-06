import type { FilterQuery } from "mongoose";
import type {
  ActionItemWhereInput,
  DonationWhereInput,
  EventWhereInput,
  EventVolunteerGroupWhereInput,
  FundWhereInput,
  InputMaybe,
  OrganizationWhereInput,
  PostWhereInput,
  UserWhereInput,
  VenueWhereInput,
  CampaignWhereInput,
  PledgeWhereInput,
  ActionItemCategoryWhereInput,
} from "../../../types/generatedGraphQLTypes";

/**
 * This function returns FilterQuery object which can be used to find out documents matching specific args as mentioned in `where`.
 * When modifying this function, check if the arg to be added isn't present before, and place `where` argument
 * type if not present before in the intersection type.
 * @typeParam T - used to return an object of a generic type `FilterQuery<T>`
 * @param where - an object that contains properties that can be used to filter out documents.
 * @returns a FilterQuery object to filter out documents
 * @remarks You can learn about Generics {@link https://www.typescriptlang.org/docs/handbook/2/generics.html | here}.
 * @example Here's an example showing how `getWhere()` can be used to get a FilterQuery object matching certain args mentioned in `where`
 * ```
 * const inputArgs = getWhere<InterfaceEvent>(args.where);
 * ```
 */
export const getWhere = <T = unknown>(
  where:
    | InputMaybe<
        Partial<
          EventWhereInput &
            EventVolunteerGroupWhereInput &
            OrganizationWhereInput &
            PostWhereInput &
            UserWhereInput &
            DonationWhereInput &
            ActionItemWhereInput &
            ActionItemCategoryWhereInput &
            CampaignWhereInput &
            FundWhereInput &
            PledgeWhereInput &
            VenueWhereInput
        >
      >
    | undefined,
): FilterQuery<T> => {
  let wherePayload: FilterQuery<T> = {};

  if (!where) {
    return wherePayload;
  }

  if (where.id) {
    wherePayload = {
      ...wherePayload,
      _id: where.id,
    };
  }

  // Returns all objects other than provided id
  if (where.id_not) {
    wherePayload = {
      ...wherePayload,
      _id: { $ne: where.id_not },
    };
  }

  // Return objects with id in the provided list
  if (where.id_in) {
    wherePayload = {
      ...wherePayload,
      _id: { $in: where.id_in },
    };
  }

  // Returns objects not included in provided id list
  if (where.id_not_in) {
    wherePayload = {
      ...wherePayload,
      _id: { $nin: where.id_not_in },
    };
  }

  // Returns provided title objects
  if (where.title) {
    wherePayload = {
      ...wherePayload,
      title: where.title,
    };
  }

  // Returns objects with not that title
  if (where.title_not) {
    wherePayload = {
      ...wherePayload,
      title: { $ne: where.title_not },
    };
  }

  // Return objects with the given list title
  if (where.title_in) {
    wherePayload = {
      ...wherePayload,
      title: { $in: where.title_in },
    };
  }

  // Returns objects with title not in the provided list
  if (where.title_not_in) {
    wherePayload = {
      ...wherePayload,
      title: { $nin: where.title_not_in },
    };
  }

  // Returns objects with title containing provided string
  if (where.title_contains) {
    wherePayload = {
      ...wherePayload,
      title: { $regex: where.title_contains, $options: "i" },
    };
  }

  // Returns objects with title starts with that provided string
  if (where.title_starts_with) {
    const regexp = new RegExp("^" + where.title_starts_with);
    wherePayload = {
      ...wherePayload,
      title: regexp,
    };
  }

  // Returns provided description objects
  if (where.description) {
    wherePayload = {
      ...wherePayload,
      description: where.description,
    };
  }

  // Returns objects with not that description
  if (where.description_not) {
    wherePayload = {
      ...wherePayload,
      description: { $ne: where.description_not },
    };
  }

  // Return objects with description in provided list
  if (where.description_in) {
    wherePayload = {
      ...wherePayload,
      description: { $in: where.description_in },
    };
  }

  // Return objects with description not in provided list
  if (where.description_not_in) {
    wherePayload = {
      ...wherePayload,
      description: { $nin: where.description_not_in },
    };
  }

  // Return objects with description should containing provided string
  if (where.description_contains) {
    wherePayload = {
      ...wherePayload,
      description: {
        $regex: where.description_contains,
        $options: "i",
      },
    };
  }

  // Returns objects with description starting with provided string
  if (where.description_starts_with) {
    const regexp = new RegExp("^" + where.description_starts_with);
    wherePayload = {
      ...wherePayload,
      description: regexp,
    };
  }

  // Returns objects of a specific organization
  if (where.organization_id) {
    wherePayload = {
      ...wherePayload,
      organization: where.organization_id,
    };
  }

  // Returns action items belonging to a specific category
  if (where.actionItemCategory_id) {
    wherePayload = {
      ...wherePayload,
      actionItemCategoryId: where.actionItemCategory_id,
    };
  }

  // Return action items that are completed
  if (where.is_completed !== undefined) {
    wherePayload = {
      ...wherePayload,
      isCompleted: where.is_completed,
    };
  }

  // Return action items belonging to a specific event
  if (where.event_id || where.eventId) {
    wherePayload = {
      ...wherePayload,
      eventId: where.event_id || where.eventId,
    };
  }

  // Returns provided location objects
  if (where.location) {
    wherePayload = {
      ...wherePayload,
      location: where.location,
    };
  }

  // Returns objects with not that location
  if (where.location_not) {
    wherePayload = {
      ...wherePayload,
      location: { $ne: where.location_not },
    };
  }

  // Return objects with location in provided list
  if (where.location_in) {
    wherePayload = {
      ...wherePayload,
      location: { $in: where.location_in },
    };
  }

  // Return objects with location not in provided list
  if (where.location_not_in) {
    wherePayload = {
      ...wherePayload,
      location: { $nin: where.location_not_in },
    };
  }

  // Return objects with location should containing provided string
  if (where.location_contains) {
    wherePayload = {
      ...wherePayload,
      location: {
        $regex: where.location_contains,
        $options: "i",
      },
    };
  }

  // Returns provided name donations
  if (where.name_of_user) {
    wherePayload = {
      ...wherePayload,
      nameOfUser: where.name_of_user,
    };
  }

  // Returns donations with not that name_of_user
  if (where.name_of_user_not) {
    wherePayload = {
      ...wherePayload,
      nameOfUser: { $ne: where.name_of_user_not },
    };
  }

  // Return donations with the given list name_of_user
  if (where.name_of_user_in) {
    wherePayload = {
      ...wherePayload,
      nameOfUser: { $in: where.name_of_user_in },
    };
  }

  // Returns donations with name_of_user not in the provided list
  if (where.name_of_user_not_in) {
    wherePayload = {
      ...wherePayload,
      nameOfUser: { $nin: where.name_of_user_not_in },
    };
  }

  // Returns donations with name_of_user containing provided string
  if (where.name_of_user_contains) {
    wherePayload = {
      ...wherePayload,
      nameOfUser: { $regex: where.name_of_user_contains, $options: "i" },
    };
  }

  // Returns donations with name_of_user starts with that provided string
  if (where.name_of_user_starts_with) {
    const regexp = new RegExp("^" + where.name_of_user_starts_with);
    wherePayload = {
      ...wherePayload,
      nameOfUser: regexp,
    };
  }

  // Returns provided name organization
  if (where.name) {
    wherePayload = {
      ...wherePayload,
      name: where.name,
    };
  }

  // Returns organizations with not that name
  if (where.name_not) {
    wherePayload = {
      ...wherePayload,
      name: { $ne: where.name_not },
    };
  }

  // Return organizations with the given list name
  if (where.name_in) {
    wherePayload = {
      ...wherePayload,
      name: { $in: where.name_in },
    };
  }

  // Returns organizations with name not in the provided list
  if (where.name_not_in) {
    wherePayload = {
      ...wherePayload,
      name: { $nin: where.name_not_in },
    };
  }

  // Returns objects with name containing provided string
  if (where.name_contains) {
    wherePayload = {
      ...wherePayload,
      name: { $regex: where.name_contains, $options: "i" },
    };
  }

  // Returns objects where name starts with provided string
  if (where.name_starts_with) {
    const regexp = new RegExp("^" + where.name_starts_with);
    wherePayload = {
      ...wherePayload,
      name: regexp,
    };
  }

  // Returns events of a specific organization
  if (where.organization_id) {
    wherePayload = {
      ...wherePayload,
      organization: where.organization_id,
    };
  }

  // Returns provided apiUrl organizations
  if (where.apiUrl) {
    wherePayload = {
      ...wherePayload,
      apiUrl: where.apiUrl,
    };
  }

  // Returns organizations with not that provided apiUrl
  if (where.apiUrl_not) {
    wherePayload = {
      ...wherePayload,
      apiUrl: { $ne: where.apiUrl_not },
    };
  }

  // Organizations apiUrl falls in provided list
  if (where.apiUrl_in) {
    wherePayload = {
      ...wherePayload,
      apiUrl: { $in: where.apiUrl_in },
    };
  }

  // Return organizations apiUrl not falls in the list
  if (where.apiUrl_not_in) {
    wherePayload = {
      ...wherePayload,
      apiUrl: { $nin: where.apiUrl_not_in },
    };
  }

  // Return organizations with apiUrl containing provided string
  if (where.apiUrl_contains) {
    wherePayload = {
      ...wherePayload,
      apiUrl: { $regex: where.apiUrl_contains, $options: "i" },
    };
  }

  // Returns organizations with apiUrl starts with provided string
  if (where.apiUrl_starts_with) {
    const regexp = new RegExp("^" + where.apiUrl_starts_with);
    wherePayload = {
      ...wherePayload,
      apiUrl: regexp,
    };
  }
  // Returns organizations with provided visibleInSearch condition
  if (where.visibleInSearch !== undefined) {
    wherePayload = {
      ...wherePayload,
      visibleInSearch: where.visibleInSearch,
    };
  }
  // Returns organizations with provided userRegistrationRequired condition
  if (where.userRegistrationRequired !== undefined) {
    wherePayload = {
      ...wherePayload,
      isPublic: where.userRegistrationRequired,
    };
  }

  //Returns provided firstName user
  if (where.firstName) {
    wherePayload = {
      ...wherePayload,
      firstName: where.firstName,
    };
  }

  //Returns user with not that firstName
  if (where.firstName_not) {
    wherePayload = {
      ...wherePayload,
      firstName: {
        $ne: where.firstName_not,
      },
    };
  }

  //Return users with the given list firstName
  if (where.firstName_in) {
    wherePayload = {
      ...wherePayload,
      firstName: {
        $in: where.firstName_in,
      },
    };
  }

  //Returns users with firstName not in the provided list
  if (where.firstName_not_in) {
    wherePayload = {
      ...wherePayload,
      firstName: {
        $nin: where.firstName_not_in,
      },
    };
  }

  //Returns users with first name containing provided string
  if (where.firstName_contains) {
    wherePayload = {
      ...wherePayload,
      firstName: {
        $regex: where.firstName_contains,
        $options: "i",
      },
    };
  }

  //Returns users with firstName starts with that provided string
  if (where.firstName_starts_with) {
    const regexp = new RegExp("^" + where.firstName_starts_with);
    wherePayload = {
      ...wherePayload,
      firstName: regexp,
    };
  }

  //Returns lastName user
  if (where.lastName) {
    wherePayload = {
      ...wherePayload,
      lastName: where.lastName,
    };
  }

  //Returns user with not that lastName
  if (where.lastName_not) {
    wherePayload = {
      ...wherePayload,
      lastName: {
        $ne: where.lastName_not,
      },
    };
  }

  //Return users with lastName in provided list
  if (where.lastName_in) {
    wherePayload = {
      ...wherePayload,
      lastName: {
        $in: where.lastName_in,
      },
    };
  }

  //Return users with lastName not in provided list
  if (where.lastName_not_in) {
    wherePayload = {
      ...wherePayload,
      lastName: {
        $nin: where.lastName_not_in,
      },
    };
  }

  //Return users with lastName should containing provided string
  if (where.lastName_contains) {
    wherePayload = {
      ...wherePayload,
      lastName: {
        $regex: where.lastName_contains,
        $options: "i",
      },
    };
  }

  //Returns users with LastName starting with provided string
  if (where.lastName_starts_with) {
    const regexp = new RegExp("^" + where.lastName_starts_with);
    wherePayload = {
      ...wherePayload,
      lastName: regexp,
    };
  }

  //Returns provided email user
  if (where.email) {
    wherePayload = {
      ...wherePayload,
      email: where.email,
    };
  }

  //Returns user with not that provided email
  if (where.email_not) {
    wherePayload = {
      ...wherePayload,
      email: {
        $ne: where.email_not,
      },
    };
  }

  //User email falls in provided list
  if (where.email_in) {
    wherePayload = {
      ...wherePayload,
      email: {
        $in: where.email_in,
      },
    };
  }

  //Return User email not falls in the list
  if (where.email_not_in) {
    wherePayload = {
      ...wherePayload,
      email: {
        $nin: where.email_not_in,
      },
    };
  }

  //Return users with email containing provided string
  if (where.email_contains) {
    wherePayload = {
      ...wherePayload,
      email: {
        $regex: where.email_contains,
        $options: "i",
      },
    };
  }

  //Returns user with email starts with provided string
  if (where.email_starts_with) {
    const regexp = new RegExp("^" + where.email_starts_with);
    wherePayload = {
      ...wherePayload,
      email: regexp,
    };
  }

  //Returns provided appLanguageCode user
  // if (where.appLanguageCode) {
  //   wherePayload = {
  //     ...wherePayload,
  //     appLanguageCode: where.appLanguageCode,
  //   };
  // }

  // //Returns user with not that provided appLanguageCode
  // if (where.appLanguageCode_not) {
  //   wherePayload = {
  //     ...wherePayload,
  //     appLanguageCode: {
  //       $ne: where.appLanguageCode_not,
  //     },
  //   };
  // }

  // Objects appLanguageCode falls in provided list
  // if (where.appLanguageCode_in) {
  //   wherePayload = {
  //     ...wherePayload,
  //     appLanguageCode: {
  //       $in: where.appLanguageCode_in,
  //     },
  //   };
  // }

  // // Return objects appLanguageCode not falls in the list
  // if (where.appLanguageCode_not_in) {
  //   wherePayload = {
  //     ...wherePayload,
  //     appLanguageCode: {
  //       $nin: where.appLanguageCode_not_in,
  //     },
  //   };
  // }

  // // Return objects with appLanguageCode containing provided string
  // if (where.appLanguageCode_contains) {
  //   wherePayload = {
  //     ...wherePayload,
  //     appLanguageCode: {
  //       $regex: where.appLanguageCode_contains,
  //       $options: "i",
  //     },
  //   };
  // }

  // // Returns objects with appLanguageCode starts with provided string
  // if (where.appLanguageCode_starts_with) {
  //   const regexp = new RegExp("^" + where.appLanguageCode_starts_with);
  //   wherePayload = {
  //     ...wherePayload,
  //     appLanguageCode: regexp,
  //   };
  // }

  // // Return users with admin for provided organizationId
  // if (where.admin_for) {
  //   wherePayload = {
  //     ...wherePayload,
  //     adminFor: {
  //       _id: where.admin_for,
  //     },
  //   };
  // }

  if (where.event_title_contains) {
    wherePayload = {
      ...wherePayload,
      "registeredEvents.title": {
        $regex: where.event_title_contains,
        $options: "i",
      },
    };
  }

  //Returns provided text objects
  if (where.text) {
    wherePayload = {
      ...wherePayload,
      text: where.text,
    };
  }

  //Returns objects with not the provided text
  if (where.text_not) {
    wherePayload = {
      ...wherePayload,
      text: {
        $ne: where.text_not,
      },
    };
  }

  //Return objects with the given list text
  if (where.text_in) {
    wherePayload = {
      ...wherePayload,
      text: {
        $in: where.text_in,
      },
    };
  }

  //Returns objects with text not in the provided list
  if (where.text_not_in) {
    wherePayload = {
      ...wherePayload,
      text: {
        $nin: where.text_not_in,
      },
    };
  }

  //Returns objects with text containing provided string
  if (where.text_contains) {
    wherePayload = {
      ...wherePayload,
      text: {
        $regex: where.text_contains,
        $options: "i",
      },
    };
  }

  //Returns objects with text starts with that provided string
  if (where.text_starts_with) {
    const regexp = new RegExp("^" + where.text_starts_with);
    wherePayload = {
      ...wherePayload,
      text: regexp,
    };
  }

  // Returns objects with provided fundId condition
  if (where.fundId) {
    wherePayload = {
      ...wherePayload,
      fundId: where.fundId,
    };
  }

  // Returns object with provided organizationId condition
  if (where.organizationId) {
    wherePayload = {
      ...wherePayload,
      organizationId: where.organizationId,
    };
  }

  // Returns object with provided campaignId condition
  if (where.campaignId) {
    wherePayload = {
      ...wherePayload,
      _id: where.campaignId,
    };
  }

  // Returns objects where volunteerId is present in volunteers list
  if (where.volunteerId) {
    wherePayload = {
      ...wherePayload,
      volunteers: {
        $in: [where.volunteerId],
      },
    };
  }

  // Returns object with provided is_disabled condition
  if (where.is_disabled !== undefined) {
    wherePayload = {
      ...wherePayload,
      isDisabled: where.is_disabled,
    };
  }

  return wherePayload;
};
