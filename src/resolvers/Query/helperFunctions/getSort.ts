import type { SortOrder } from "mongoose";
import type {
  EventOrderByInput,
  InputMaybe,
  OrganizationOrderByInput,
  PostOrderByInput,
  UserOrderByInput,
  VenueOrderByInput,
  PledgeOrderByInput,
  CampaignOrderByInput,
  FundOrderByInput,
  ActionItemsOrderByInput,
} from "../../../types/generatedGraphQLTypes";

export const getSort = (
  orderBy:
    | InputMaybe<
        | EventOrderByInput
        | OrganizationOrderByInput
        | PostOrderByInput
        | UserOrderByInput
        | VenueOrderByInput
        | FundOrderByInput
        | CampaignOrderByInput
        | PledgeOrderByInput
        | ActionItemsOrderByInput
      >
    | undefined,
):
  | string
  | { [key: string]: SortOrder | { $meta: unknown } }
  | [string, SortOrder][]
  | null
  | undefined => {
  let sortPayload = {};

  switch (orderBy) {
    case "id_ASC":
      sortPayload = {
        _id: 1,
      };
      break;

    case "id_DESC":
      sortPayload = {
        _id: -1,
      };
      break;

    case "capacity_ASC":
      sortPayload = {
        capacity: 1,
      };
      break;

    case "capacity_DESC":
      sortPayload = {
        capacity: -1,
      };
      break;

    case "title_ASC":
      sortPayload = {
        title: 1,
      };
      break;

    case "title_DESC":
      sortPayload = {
        title: -1,
      };
      break;

    case "description_ASC":
      sortPayload = {
        description: 1,
      };
      break;

    case "description_DESC":
      sortPayload = {
        description: -1,
      };
      break;

    case "amount_ASC":
      sortPayload = {
        amount: 1,
      };
      break;

    case "amount_DESC":
      sortPayload = {
        amount: -1,
      };
      break;

    case "startDate_ASC":
      sortPayload = {
        startDate: 1,
      };
      break;

    case "startDate_DESC":
      sortPayload = {
        startDate: -1,
      };
      break;

    case "endDate_ASC":
      sortPayload = {
        endDate: 1,
      };
      break;

    case "endDate_DESC":
      sortPayload = {
        endDate: -1,
      };
      break;

    case "fundingGoal_ASC":
      sortPayload = {
        fundingGoal: 1,
      };
      break;

    case "fundingGoal_DESC":
      sortPayload = {
        fundingGoal: -1,
      };
      break;

    case "allDay_ASC":
      sortPayload = {
        allDay: 1,
      };
      break;

    case "allDay_DESC":
      sortPayload = {
        allDay: -1,
      };
      break;

    case "startTime_ASC":
      sortPayload = {
        startTime: 1,
      };
      break;

    case "startTime_DESC":
      sortPayload = {
        startTime: -1,
      };
      break;

    case "endTime_ASC":
      sortPayload = {
        endTime: 1,
      };
      break;

    case "endTime_DESC":
      sortPayload = {
        endTime: -1,
      };
      break;

    case "location_ASC":
      sortPayload = {
        location: 1,
      };
      break;

    case "location_DESC":
      sortPayload = {
        location: -1,
      };
      break;

    case "createdAt_ASC":
      sortPayload = {
        createdAt: 1,
      };
      break;

    case "createdAt_DESC":
      sortPayload = {
        createdAt: -1,
      };
      break;

    case "name_ASC":
      sortPayload = {
        name: 1,
      };
      break;

    case "name_DESC":
      sortPayload = {
        name: -1,
      };
      break;

    case "apiUrl_ASC":
      sortPayload = {
        apiUrl: 1,
      };
      break;

    case "apiUrl_DESC":
      sortPayload = {
        apiUrl: -1,
      };
      break;

    case "firstName_ASC":
      sortPayload = {
        firstName: 1,
      };
      break;

    case "firstName_DESC":
      sortPayload = {
        firstName: -1,
      };
      break;

    case "lastName_ASC":
      sortPayload = {
        lastName: 1,
      };
      break;

    case "lastName_DESC":
      sortPayload = {
        lastName: -1,
      };
      break;

    // case "appLanguageCode_ASC":
    //   sortPayload = {
    //     appLanguageCode: 1,
    //   };
    //   break;

    // case "appLanguageCode_DESC":
    //   sortPayload = {
    //     appLanguageCode: -1,
    //   };
    //   break;

    case "email_ASC":
      sortPayload = {
        email: 1,
      };
      break;

    case "email_DESC":
      sortPayload = {
        email: -1,
      };
      break;

    case "text_ASC":
      sortPayload = {
        text: 1,
      };
      break;

    case "text_DESC":
      sortPayload = {
        text: -1,
      };
      break;

    case "imageUrl_ASC":
      sortPayload = {
        imageUrl: 1,
      };
      break;

    case "imageUrl_DESC":
      sortPayload = {
        imageUrl: -1,
      };
      break;

    case "videoUrl_ASC":
      sortPayload = {
        videoUrl: 1,
      };
      break;

    case "videoUrl_DESC":
      sortPayload = {
        videoUrl: -1,
      };
      break;

    case "likeCount_ASC":
      sortPayload = {
        likeCount: 1,
      };
      break;

    case "likeCount_DESC":
      sortPayload = {
        likeCount: -1,
      };
      break;

    case "commentCount_ASC":
      sortPayload = {
        commentCount: 1,
      };
      break;

    case "commentCount_DESC":
      sortPayload = {
        commentCount: -1,
      };
      break;

    case "dueDate_ASC":
      sortPayload = {
        dueDate: 1,
      };
      break;

    case "dueDate_DESC":
      sortPayload = {
        dueDate: -1,
      };
      break;

    default:
      break;
  }

  return sortPayload;
};
