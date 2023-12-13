import { gql } from "graphql-tag";

// Place fields alphabetically to ensure easier lookup and navigation.
export const enums = gql`
  enum EventOrderByInput {
    id_ASC
    id_DESC
    title_ASC
    title_DESC
    description_ASC
    description_DESC
    startDate_ASC
    startDate_DESC
    endDate_ASC
    endDate_DESC
    allDay_ASC
    allDay_DESC
    startTime_ASC
    startTime_DESC
    endTime_ASC
    endTime_DESC
    recurrance_ASC
    recurrance_DESC
    location_ASC
    location_DESC
  }

  enum OrganizationOrderByInput {
    id_ASC
    id_DESC
    name_ASC
    name_DESC
    description_ASC
    description_DESC
    apiUrl_ASC
    apiUrl_DESC
    createdAt_ASC
    createdAt_DESC
  }

  enum PaginationDirection {
    BACKWARD
    FORWARD
  }

  enum PostOrderByInput {
    id_ASC
    id_DESC
    text_ASC
    text_DESC
    title_ASC
    title_DESC
    createdAt_ASC
    createdAt_DESC
    imageUrl_ASC
    imageUrl_DESC
    videoUrl_ASC
    videoUrl_DESC
    likeCount_ASC
    likeCount_DESC
    commentCount_ASC
    commentCount_DESC
  }

  enum Recurrance {
    DAILY
    WEEKLY
    MONTHLY
    YEARLY
    ONCE
  }

  enum Status {
    ACTIVE
    BLOCKED
    DELETED
  }

  enum TaskOrderByInput {
    id_ASC
    id_DESC
    title_ASC
    title_DESC
    description_ASC
    description_DESC
    createdAt_ASC
    createdAt_DESC
    deadline_ASC
    deadline_DESC
  }

  enum Type {
    UNIVERSAL
    PRIVATE
  }

  enum UserOrderByInput {
    id_ASC
    id_DESC
    firstName_ASC
    firstName_DESC
    lastName_ASC
    lastName_DESC
    email_ASC
    email_DESC
    appLanguageCode_ASC
    appLanguageCode_DESC
  }

  enum UserType {
    USER
    ADMIN
    SUPERADMIN
  }
`;
