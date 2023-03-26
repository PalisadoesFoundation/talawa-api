import { FilterQuery } from "mongoose";
import {
  Interface_Donation,
  Interface_Event,
  Interface_Organization,
  Interface_Post,
  Interface_User,
} from "../../../models";
import {
  DonationWhereInput,
  EventWhereInput,
  InputMaybe,
  OrganizationWhereInput,
  PostWhereInput,
  UserWhereInput,
} from "../../../types/generatedGraphQLTypes";

type returnType<T> = T extends EventWhereInput
  ? FilterQuery<Interface_Event>
  : T extends OrganizationWhereInput
  ? FilterQuery<Interface_Organization>
  : T extends DonationWhereInput
  ? FilterQuery<Interface_Donation>
  : T extends PostWhereInput
  ? FilterQuery<Interface_Post>
  : FilterQuery<Interface_User>;

export const getInputArgs = <
  T extends EventWhereInput &
    OrganizationWhereInput &
    DonationWhereInput &
    PostWhereInput &
    UserWhereInput
>(
  where: InputMaybe<T> | undefined
): returnType<T> => {
  let inputArgsPayload = {} as returnType<T>;

  if (!where) {
    return inputArgsPayload;
  }

  if (where.id) {
    inputArgsPayload = {
      ...inputArgsPayload,
      _id: where.id,
    };
  }

  // Returns all objects other than provided id
  if (where.id_not) {
    inputArgsPayload = {
      ...inputArgsPayload,
      _id: { $ne: where.id_not },
    };
  }

  // Return objects with id in the provided list
  if (where.id_in) {
    inputArgsPayload = {
      ...inputArgsPayload,
      _id: { $in: where.id_in },
    };
  }

  // Returns objects not included in provided id list
  if (where.id_not_in) {
    inputArgsPayload = {
      ...inputArgsPayload,
      _id: { $nin: where.id_not_in },
    };
  }

  // Returns provided title objects
  if (where.title) {
    inputArgsPayload = {
      ...inputArgsPayload,
      title: where.title,
    };
  }

  // Returns objects with not that title
  if (where.title_not) {
    inputArgsPayload = {
      ...inputArgsPayload,
      title: { $ne: where.title_not },
    };
  }

  // Return objects with the given list title
  if (where.title_in) {
    inputArgsPayload = {
      ...inputArgsPayload,
      title: { $in: where.title_in },
    };
  }

  // Returns objects with title not in the provided list
  if (where.title_not_in) {
    inputArgsPayload = {
      ...inputArgsPayload,
      title: { $nin: where.title_not_in },
    };
  }

  // Returns objects with title containing provided string
  if (where.title_contains) {
    inputArgsPayload = {
      ...inputArgsPayload,
      title: { $regex: where.title_contains, $options: "i" },
    };
  }

  // Returns objects with title starts with that provided string
  if (where.title_starts_with) {
    const regexp = new RegExp("^" + where.title_starts_with);
    inputArgsPayload = {
      ...inputArgsPayload,
      title: regexp,
    };
  }

  // Returns provided description objects
  if (where.description) {
    inputArgsPayload = {
      ...inputArgsPayload,
      description: where.description,
    };
  }

  // Returns objects with not that description
  if (where.description_not) {
    inputArgsPayload = {
      ...inputArgsPayload,
      description: { $ne: where.description_not },
    };
  }

  // Return objects with description in provided list
  if (where.description_in) {
    inputArgsPayload = {
      ...inputArgsPayload,
      description: { $in: where.description_in },
    };
  }

  // Return objects with description not in provided list
  if (where.description_not_in) {
    inputArgsPayload = {
      ...inputArgsPayload,
      description: { $nin: where.description_not_in },
    };
  }

  // Return objects with description should containing provided string
  if (where.description_contains) {
    inputArgsPayload = {
      ...inputArgsPayload,
      description: {
        $regex: where.description_contains,
        $options: "i",
      },
    };
  }

  // Returns objects with description starting with provided string
  if (where.description_starts_with) {
    const regexp = new RegExp("^" + where.description_starts_with);
    inputArgsPayload = {
      ...inputArgsPayload,
      description: regexp,
    };
  }

  // Returns objects of a specific organization
  if (where.organization_id) {
    inputArgsPayload = {
      ...inputArgsPayload,
      organization: where.organization_id,
    };
  }

  // Returns provided location objects
  if (where.location) {
    inputArgsPayload = {
      ...inputArgsPayload,
      location: where.location,
    };
  }

  // Returns objects with not that location
  if (where.location_not) {
    inputArgsPayload = {
      ...inputArgsPayload,
      location: { $ne: where.location_not },
    };
  }

  // Return objects with location in provided list
  if (where.location_in) {
    inputArgsPayload = {
      ...inputArgsPayload,
      location: { $in: where.location_in },
    };
  }

  // Return objects with location not in provided list
  if (where.location_not_in) {
    inputArgsPayload = {
      ...inputArgsPayload,
      location: { $nin: where.location_not_in },
    };
  }

  // Return objects with location should containing provided string
  if (where.location_contains) {
    inputArgsPayload = {
      ...inputArgsPayload,
      location: {
        $regex: where.location_contains,
        $options: "i",
      },
    };
  }

  // Returns provided name donations
  if (where.name_of_user) {
    inputArgsPayload = {
      ...inputArgsPayload,
      nameOfUser: where.name_of_user,
    };
  }

  // Returns donations with not that name_of_user
  if (where.name_of_user_not) {
    inputArgsPayload = {
      ...inputArgsPayload,
      nameOfUser: { $ne: where.name_of_user_not },
    };
  }

  // Return donations with the given list name_of_user
  if (where.name_of_user_in) {
    inputArgsPayload = {
      ...inputArgsPayload,
      nameOfUser: { $in: where.name_of_user_in },
    };
  }

  // Returns donations with name_of_user not in the provided list
  if (where.name_of_user_not_in) {
    inputArgsPayload = {
      ...inputArgsPayload,
      nameOfUser: { $nin: where.name_of_user_not_in },
    };
  }

  // Returns donations with name_of_user containing provided string
  if (where.name_of_user_contains) {
    inputArgsPayload = {
      ...inputArgsPayload,
      nameOfUser: { $regex: where.name_of_user_contains, $options: "i" },
    };
  }

  // Returns donations with name_of_user starts with that provided string
  if (where.name_of_user_starts_with) {
    const regexp = new RegExp("^" + where.name_of_user_starts_with);
    inputArgsPayload = {
      ...inputArgsPayload,
      nameOfUser: regexp,
    };
  }

  // Returns provided name organization
  if (where.name) {
    inputArgsPayload = {
      ...inputArgsPayload,
      name: where.name,
    };
  }

  // Returns organizations with not that name
  if (where.name_not) {
    inputArgsPayload = {
      ...inputArgsPayload,
      name: { $ne: where.name_not },
    };
  }

  // Return organizations with the given list name
  if (where.name_in) {
    inputArgsPayload = {
      ...inputArgsPayload,
      name: { $in: where.name_in },
    };
  }

  // Returns organizations with name not in the provided list
  if (where.name_not_in) {
    inputArgsPayload = {
      ...inputArgsPayload,
      name: { $nin: where.name_not_in },
    };
  }

  // Returns organizations with name containing provided string
  if (where.name_contains) {
    inputArgsPayload = {
      ...inputArgsPayload,
      name: { $regex: where.name_contains, $options: "i" },
    };
  }

  // Returns organizations with name starts with that provided string
  if (where.name_starts_with) {
    const regexp = new RegExp("^" + where.name_starts_with);
    inputArgsPayload = {
      ...inputArgsPayload,
      name: regexp,
    };
  }

  // Returns events of a specific organization
  if (where.organization_id) {
    inputArgsPayload = {
      ...inputArgsPayload,
      organization: where.organization_id,
    };
  }

  // Returns provided apiUrl organizations
  if (where.apiUrl) {
    inputArgsPayload = {
      ...inputArgsPayload,
      apiUrl: where.apiUrl,
    };
  }

  // Returns organizations with not that provided apiUrl
  if (where.apiUrl_not) {
    inputArgsPayload = {
      ...inputArgsPayload,
      apiUrl: { $ne: where.apiUrl_not },
    };
  }

  // Organizations apiUrl falls in provided list
  if (where.apiUrl_in) {
    inputArgsPayload = {
      ...inputArgsPayload,
      apiUrl: { $in: where.apiUrl_in },
    };
  }

  // Return organizations apiUrl not falls in the list
  if (where.apiUrl_not_in) {
    inputArgsPayload = {
      ...inputArgsPayload,
      apiUrl: { $nin: where.apiUrl_not_in },
    };
  }

  // Return organizations with apiUrl containing provided string
  if (where.apiUrl_contains) {
    inputArgsPayload = {
      ...inputArgsPayload,
      apiUrl: { $regex: where.apiUrl_contains, $options: "i" },
    };
  }

  // Returns organizations with apiUrl starts with provided string
  if (where.apiUrl_starts_with) {
    const regexp = new RegExp("^" + where.apiUrl_starts_with);
    inputArgsPayload = {
      ...inputArgsPayload,
      apiUrl: regexp,
    };
  }

  // Returns organizations with provided visibleInSearch condition
  if (where.visibleInSearch !== undefined) {
    inputArgsPayload = {
      ...inputArgsPayload,
      visibleInSearch: where.visibleInSearch,
    };
  }

  // Returns organizations with provided isPublic condition
  if (where.isPublic !== undefined) {
    inputArgsPayload = {
      ...inputArgsPayload,
      isPublic: where.isPublic,
    };
  }

  //Returns provided firstName user
  if (where.firstName) {
    inputArgsPayload = {
      ...inputArgsPayload,
      firstName: where.firstName,
    };
  }

  //Returns user with not that firstName
  if (where.firstName_not) {
    inputArgsPayload = {
      ...inputArgsPayload,
      firstName: {
        $ne: where.firstName_not,
      },
    };
  }

  //Return users with the given list firstName
  if (where.firstName_in) {
    inputArgsPayload = {
      ...inputArgsPayload,
      firstName: {
        $in: where.firstName_in,
      },
    };
  }

  //Returns users with firstName not in the provided list
  if (where.firstName_not_in) {
    inputArgsPayload = {
      ...inputArgsPayload,
      firstName: {
        $nin: where.firstName_not_in,
      },
    };
  }

  //Returns users with first name containing provided string
  if (where.firstName_contains) {
    inputArgsPayload = {
      ...inputArgsPayload,
      firstName: {
        $regex: where.firstName_contains,
        $options: "i",
      },
    };
  }

  //Returns users with firstName starts with that provided string
  if (where.firstName_starts_with) {
    const regexp = new RegExp("^" + where.firstName_starts_with);
    inputArgsPayload = {
      ...inputArgsPayload,
      firstName: regexp,
    };
  }

  //Returns lastName user
  if (where.lastName) {
    inputArgsPayload = {
      ...inputArgsPayload,
      lastName: where.lastName,
    };
  }

  //Returns user with not that lastName
  if (where.lastName_not) {
    inputArgsPayload = {
      ...inputArgsPayload,
      lastName: {
        $ne: where.lastName_not,
      },
    };
  }

  //Return users with lastName in provided list
  if (where.lastName_in) {
    inputArgsPayload = {
      ...inputArgsPayload,
      lastName: {
        $in: where.lastName_in,
      },
    };
  }

  //Return users with lastName not in provided list
  if (where.lastName_not_in) {
    inputArgsPayload = {
      ...inputArgsPayload,
      lastName: {
        $nin: where.lastName_not_in,
      },
    };
  }

  //Return users with lastName should containing provided string
  if (where.lastName_contains) {
    inputArgsPayload = {
      ...inputArgsPayload,
      lastName: {
        $regex: where.lastName_contains,
        $options: "i",
      },
    };
  }

  //Returns users with LastName starting with provided string
  if (where.lastName_starts_with) {
    const regexp = new RegExp("^" + where.lastName_starts_with);
    inputArgsPayload = {
      ...inputArgsPayload,
      lastName: regexp,
    };
  }

  //Returns provided email user
  if (where.email) {
    inputArgsPayload = {
      ...inputArgsPayload,
      email: where.email,
    };
  }

  //Returns user with not that provided email
  if (where.email_not) {
    inputArgsPayload = {
      ...inputArgsPayload,
      email: {
        $ne: where.email_not,
      },
    };
  }

  //User email falls in provided list
  if (where.email_in) {
    inputArgsPayload = {
      ...inputArgsPayload,
      email: {
        $in: where.email_in,
      },
    };
  }

  //Return User email not falls in the list
  if (where.email_not_in) {
    inputArgsPayload = {
      ...inputArgsPayload,
      email: {
        $nin: where.email_not_in,
      },
    };
  }

  //Return users with email containing provided string
  if (where.email_contains) {
    inputArgsPayload = {
      ...inputArgsPayload,
      email: {
        $regex: where.email_contains,
        $options: "i",
      },
    };
  }

  //Returns user with email starts with provided string
  if (where.email_starts_with) {
    const regexp = new RegExp("^" + where.email_starts_with);
    inputArgsPayload = {
      ...inputArgsPayload,
      email: regexp,
    };
  }

  //Returns provided appLanguageCode user
  if (where.appLanguageCode) {
    inputArgsPayload = {
      ...inputArgsPayload,
      appLanguageCode: where.appLanguageCode,
    };
  }

  //Returns user with not that provided appLanguageCode
  if (where.appLanguageCode_not) {
    inputArgsPayload = {
      ...inputArgsPayload,
      appLanguageCode: {
        $ne: where.appLanguageCode_not,
      },
    };
  }

  // Objects appLanguageCode falls in provided list
  if (where.appLanguageCode_in) {
    inputArgsPayload = {
      ...inputArgsPayload,
      appLanguageCode: {
        $in: where.appLanguageCode_in,
      },
    };
  }

  // Return objects appLanguageCode not falls in the list
  if (where.appLanguageCode_not_in) {
    inputArgsPayload = {
      ...inputArgsPayload,
      appLanguageCode: {
        $nin: where.appLanguageCode_not_in,
      },
    };
  }

  // Return objects with appLanguageCode containing provided string
  if (where.appLanguageCode_contains) {
    inputArgsPayload = {
      ...inputArgsPayload,
      appLanguageCode: {
        $regex: where.appLanguageCode_contains,
        $options: "i",
      },
    };
  }

  // Returns objects with appLanguageCode starts with provided string
  if (where.appLanguageCode_starts_with) {
    const regexp = new RegExp("^" + where.appLanguageCode_starts_with);
    inputArgsPayload = {
      ...inputArgsPayload,
      appLanguageCode: regexp,
    };
  }

  // Return users with admin for provided organizationId
  if (where.admin_for) {
    inputArgsPayload = {
      ...inputArgsPayload,
      adminFor: {
        _id: where.admin_for,
      },
    };
  }

  if (where.event_title_contains) {
    inputArgsPayload = {
      ...inputArgsPayload,
      "registeredEvents.title": {
        $regex: where.event_title_contains,
        $options: "i",
      },
    };
  }

  //Returns provided text objects
  if (where.text) {
    inputArgsPayload = {
      ...inputArgsPayload,
      text: where.text,
    };
  }

  //Returns objects with not the provided text
  if (where.text_not) {
    inputArgsPayload = {
      ...inputArgsPayload,
      text: {
        $ne: where.text_not,
      },
    };
  }

  //Return objects with the given list text
  if (where.text_in) {
    inputArgsPayload = {
      ...inputArgsPayload,
      text: {
        $in: where.text_in,
      },
    };
  }

  //Returns objects with text not in the provided list
  if (where.text_not_in) {
    inputArgsPayload = {
      ...inputArgsPayload,
      text: {
        $nin: where.text_not_in,
      },
    };
  }

  //Returns objects with text containing provided string
  if (where.text_contains) {
    inputArgsPayload = {
      ...inputArgsPayload,
      text: {
        $regex: where.text_contains,
        $options: "i",
      },
    };
  }

  //Returns objects with text starts with that provided string
  if (where.text_starts_with) {
    const regexp = new RegExp("^" + where.text_starts_with);
    inputArgsPayload = {
      ...inputArgsPayload,
      text: regexp,
    };
  }

  return inputArgsPayload;
};
