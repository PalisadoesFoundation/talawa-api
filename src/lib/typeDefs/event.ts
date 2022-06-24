import { gql } from 'apollo-server-core';

export const event = gql`
  type Event {
    _id: ID!
    title: String!
    description: String!
    startDate: String!
    endDate: String!
    startTime: String
    endTime: String
    allDay: Boolean!
    recurring: Boolean!
    recurrance: Recurrance
    isPublic: Boolean!
    isRegisterable: Boolean!
    location: String
    organization: Organization
    creator: User!
    registrants: [UserAttende]
    admins(adminId: ID): [User]
    tasks: [Task]
    status: Status!
  }

  type EventRegistrants {
    event: Event!
    isRegistered: Boolean!
  }

  type UserAttende {
    _id: ID!
    userId: String!
    user: User!
    status: Status!
    createdAt: String
  }

  input EventInput {
    title: String!
    description: String!
    startDate: String!
    endDate: String
    startTime: String
    endTime: String
    allDay: Boolean!
    recurring: Boolean!
    recurrance: Recurrance
    isPublic: Boolean!
    isRegisterable: Boolean!
    location: String
    organizationId: ID!
  }

  # type EventProject {
  #     _id: ID!
  #     title:String!
  #     description: String!
  #     event: Event!
  #     tasks: [Task]
  # }

  type Task {
    _id: ID!
    title: String!
    description: String
    event: Event!
    creator: User!
    createdAt: String!
    deadline: String
  }

  input UpdateEventInput {
    title: String
    description: String
    recurring: Boolean
    recurrance: Recurrance
    isPublic: Boolean
    isRegisterable: Boolean
    startDate: String
    endDate: String
    location: String
    allDay: Boolean
    startTime: String
    endTime: String
  }

  input TaskInput {
    title: String!
    description: String
    deadline: String
  }

  input UpdateTaskInput {
    title: String
    description: String
    deadline: String
  }

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

  #     input EventProjectInput {
  #         title:String!
  #         description: String!
  #         eventId: String
  #     }

  #     input UpdateEventProjectInput {
  #         title:String
  #         description: String
  #     }
  #
`;
