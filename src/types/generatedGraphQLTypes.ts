import type { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import type { InterfaceActionItem as InterfaceActionItemModel } from '../models/ActionItem';
import type { InterfaceActionItemCategory as InterfaceActionItemCategoryModel } from '../models/ActionItemCategory';
import type { InterfaceAdvertisement as InterfaceAdvertisementModel } from '../models/Advertisement';
import type { InterfaceAgendaCategory as InterfaceAgendaCategoryModel } from '../models/AgendaCategory';
import type { InterfaceAgendaItem as InterfaceAgendaItemModel } from '../models/AgendaItem';
import type { InterfaceCheckIn as InterfaceCheckInModel } from '../models/CheckIn';
import type { InterfaceMessageChat as InterfaceMessageChatModel } from '../models/MessageChat';
import type { InterfaceComment as InterfaceCommentModel } from '../models/Comment';
import type { InterfaceDirectChat as InterfaceDirectChatModel } from '../models/DirectChat';
import type { InterfaceDirectChatMessage as InterfaceDirectChatMessageModel } from '../models/DirectChatMessage';
import type { InterfaceDonation as InterfaceDonationModel } from '../models/Donation';
import type { InterfaceEvent as InterfaceEventModel } from '../models/Event';
import type { InterfaceEventAttendee as InterfaceEventAttendeeModel } from '../models/EventAttendee';
import type { InterfaceUserFamily as InterfaceUserFamilyModel } from '../models/userFamily';
import type { InterfaceEventVolunteer as InterfaceEventVolunteerModel } from '../models/EventVolunteer';
import type { InterfaceFeedback as InterfaceFeedbackModel } from '../models/Feedback';
import type { InterfaceFund as InterfaceFundModel } from '../models/Fund';
import type { InterfaceFundraisingCampaign as InterfaceFundraisingCampaignModel } from '../models/FundraisingCampaign';
import type { InterfaceFundraisingCampaignPledges as InterfaceFundraisingCampaignPledgesModel } from '../models/FundraisingCampaignPledge';
import type { InterfaceGroup as InterfaceGroupModel } from '../models/Group';
import type { InterfaceGroupChat as InterfaceGroupChatModel } from '../models/GroupChat';
import type { InterfaceGroupChatMessage as InterfaceGroupChatMessageModel } from '../models/GroupChatMessage';
import type { InterfaceLanguage as InterfaceLanguageModel } from '../models/Language';
import type { InterfaceMembershipRequest as InterfaceMembershipRequestModel } from '../models/MembershipRequest';
import type { InterfaceMessage as InterfaceMessageModel } from '../models/Message';
import type { InterfaceOrganization as InterfaceOrganizationModel } from '../models/Organization';
import type { InterfacePlugin as InterfacePluginModel } from '../models/Plugin';
import type { InterfacePluginField as InterfacePluginFieldModel } from '../models/PluginField';
import type { InterfacePost as InterfacePostModel } from '../models/Post';
import type { InterfaceOrganizationTagUser as InterfaceOrganizationTagUserModel } from '../models/OrganizationTagUser';
import type { InterfaceUser as InterfaceUserModel } from '../models/User';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  Any: { input: any; output: any; }
  CountryCode: { input: any; output: any; }
  Date: { input: any; output: any; }
  DateTime: { input: any; output: any; }
  EmailAddress: { input: any; output: any; }
  JSON: { input: any; output: any; }
  Latitude: { input: any; output: any; }
  Longitude: { input: any; output: any; }
  PhoneNumber: { input: any; output: any; }
  PositiveInt: { input: any; output: any; }
  Time: { input: any; output: any; }
  URL: { input: any; output: any; }
  Upload: { input: any; output: any; }
};

export type ActionItem = {
  __typename?: 'ActionItem';
  _id: Scalars['ID']['output'];
  actionItemCategory?: Maybe<ActionItemCategory>;
  assignee?: Maybe<User>;
  assigner?: Maybe<User>;
  assignmentDate: Scalars['Date']['output'];
  completionDate: Scalars['Date']['output'];
  createdAt: Scalars['Date']['output'];
  creator?: Maybe<User>;
  dueDate: Scalars['Date']['output'];
  event?: Maybe<Event>;
  isCompleted: Scalars['Boolean']['output'];
  postCompletionNotes?: Maybe<Scalars['String']['output']>;
  preCompletionNotes?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['Date']['output'];
};

export type ActionItemCategory = {
  __typename?: 'ActionItemCategory';
  _id: Scalars['ID']['output'];
  createdAt: Scalars['Date']['output'];
  creator?: Maybe<User>;
  isDisabled: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  organization?: Maybe<Organization>;
  updatedAt: Scalars['Date']['output'];
};

export type ActionItemWhereInput = {
  actionItemCategory_id?: InputMaybe<Scalars['ID']['input']>;
  event_id?: InputMaybe<Scalars['ID']['input']>;
  is_active?: InputMaybe<Scalars['Boolean']['input']>;
  is_completed?: InputMaybe<Scalars['Boolean']['input']>;
};

export type ActionItemsOrderByInput =
  | 'createdAt_ASC'
  | 'createdAt_DESC';

export type Address = {
  __typename?: 'Address';
  city?: Maybe<Scalars['String']['output']>;
  countryCode?: Maybe<Scalars['String']['output']>;
  dependentLocality?: Maybe<Scalars['String']['output']>;
  line1?: Maybe<Scalars['String']['output']>;
  line2?: Maybe<Scalars['String']['output']>;
  postalCode?: Maybe<Scalars['String']['output']>;
  sortingCode?: Maybe<Scalars['String']['output']>;
  state?: Maybe<Scalars['String']['output']>;
};

export type AddressInput = {
  city?: InputMaybe<Scalars['String']['input']>;
  countryCode?: InputMaybe<Scalars['String']['input']>;
  dependentLocality?: InputMaybe<Scalars['String']['input']>;
  line1?: InputMaybe<Scalars['String']['input']>;
  line2?: InputMaybe<Scalars['String']['input']>;
  postalCode?: InputMaybe<Scalars['String']['input']>;
  sortingCode?: InputMaybe<Scalars['String']['input']>;
  state?: InputMaybe<Scalars['String']['input']>;
};

export type Advertisement = {
  __typename?: 'Advertisement';
  _id: Scalars['ID']['output'];
  createdAt: Scalars['DateTime']['output'];
  creator?: Maybe<User>;
  endDate: Scalars['Date']['output'];
  mediaUrl: Scalars['URL']['output'];
  name: Scalars['String']['output'];
  organization?: Maybe<Organization>;
  startDate: Scalars['Date']['output'];
  type: AdvertisementType;
  updatedAt: Scalars['DateTime']['output'];
};

export type AdvertisementEdge = {
  __typename?: 'AdvertisementEdge';
  cursor?: Maybe<Scalars['String']['output']>;
  node?: Maybe<Advertisement>;
};

export type AdvertisementType =
  | 'BANNER'
  | 'MENU'
  | 'POPUP';

export type AdvertisementsConnection = {
  __typename?: 'AdvertisementsConnection';
  edges?: Maybe<Array<Maybe<AdvertisementEdge>>>;
  pageInfo?: Maybe<ConnectionPageInfo>;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type AgendaCategory = {
  __typename?: 'AgendaCategory';
  _id: Scalars['ID']['output'];
  createdAt: Scalars['Date']['output'];
  createdBy: User;
  description?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  organization: Organization;
  updatedAt?: Maybe<Scalars['Date']['output']>;
  updatedBy?: Maybe<User>;
};

export type AgendaItem = {
  __typename?: 'AgendaItem';
  _id: Scalars['ID']['output'];
  attachments?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  categories?: Maybe<Array<Maybe<AgendaCategory>>>;
  createdAt: Scalars['Date']['output'];
  createdBy: User;
  description?: Maybe<Scalars['String']['output']>;
  duration: Scalars['String']['output'];
  isNote: Scalars['Boolean']['output'];
  itemType: ItemType;
  organization: Organization;
  relatedEvent?: Maybe<Event>;
  sequence: Scalars['Int']['output'];
  title: Scalars['String']['output'];
  updatedAt: Scalars['Date']['output'];
  updatedBy: User;
  urls?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  user: Scalars['String']['output'];
};

export type AggregatePost = {
  __typename?: 'AggregatePost';
  count: Scalars['Int']['output'];
};

export type AggregateUser = {
  __typename?: 'AggregateUser';
  count: Scalars['Int']['output'];
};

export type AuthData = {
  __typename?: 'AuthData';
  accessToken: Scalars['String']['output'];
  refreshToken: Scalars['String']['output'];
  user: User;
};

export type CheckIn = {
  __typename?: 'CheckIn';
  _id: Scalars['ID']['output'];
  createdAt: Scalars['DateTime']['output'];
  event: Event;
  feedbackSubmitted: Scalars['Boolean']['output'];
  time: Scalars['DateTime']['output'];
  updatedAt: Scalars['DateTime']['output'];
  user: User;
};

export type CheckInInput = {
  eventId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};

export type CheckInStatus = {
  __typename?: 'CheckInStatus';
  _id: Scalars['ID']['output'];
  checkIn?: Maybe<CheckIn>;
  user: User;
};

export type Comment = {
  __typename?: 'Comment';
  _id: Scalars['ID']['output'];
  createdAt: Scalars['DateTime']['output'];
  creator?: Maybe<User>;
  likeCount?: Maybe<Scalars['Int']['output']>;
  likedBy?: Maybe<Array<Maybe<User>>>;
  post: Post;
  text: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type CommentInput = {
  text: Scalars['String']['input'];
};

export type ConnectionError = InvalidCursor | MaximumValueError;

/**
 * The standard graphQL connection page info that contains metadata about a
 * particular instance of a connection. ALl other custom connection page info
 * types must implement this interface.
 */
export type ConnectionPageInfo = {
  /**
   * A field to tell the value of cursor for the last edge of a particular instance of a
   * connection.
   */
  endCursor?: Maybe<Scalars['String']['output']>;
  /**
   * A field to tell whether the connection has additional edges after the
   * edge with endCursor as its cursor.
   */
  hasNextPage: Scalars['Boolean']['output'];
  /**
   * A field to tell whether the connection has additional edges
   * before the edge with startCursor as its cursor.
   */
  hasPreviousPage: Scalars['Boolean']['output'];
  /**
   * A field to tell the value of cursor for the first edge of a particular instance of a
   * connection.
   */
  startCursor?: Maybe<Scalars['String']['output']>;
};

export type CreateActionItemInput = {
  assigneeId: Scalars['ID']['input'];
  dueDate?: InputMaybe<Scalars['Date']['input']>;
  eventId?: InputMaybe<Scalars['ID']['input']>;
  preCompletionNotes?: InputMaybe<Scalars['String']['input']>;
};

export type CreateAdvertisementInput = {
  endDate: Scalars['Date']['input'];
  mediaFile: Scalars['String']['input'];
  name: Scalars['String']['input'];
  organizationId: Scalars['ID']['input'];
  startDate: Scalars['Date']['input'];
  type: AdvertisementType;
};

export type CreateAdvertisementPayload = {
  __typename?: 'CreateAdvertisementPayload';
  advertisement?: Maybe<Advertisement>;
};

export type CreateAgendaCategoryInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  organizationId: Scalars['ID']['input'];
};

export type CreateAgendaItemInput = {
  attachments?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  categories?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  description?: InputMaybe<Scalars['String']['input']>;
  duration: Scalars['String']['input'];
  isNote: Scalars['Boolean']['input'];
  itemType: ItemType;
  organizationId: Scalars['ID']['input'];
  relatedEventId?: InputMaybe<Scalars['ID']['input']>;
  sequence: Scalars['Int']['input'];
  title: Scalars['String']['input'];
  urls?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  user?: InputMaybe<Scalars['String']['input']>;
};

export type CreateUserTagInput = {
  name: Scalars['String']['input'];
  organizationId: Scalars['ID']['input'];
  parentTagId?: InputMaybe<Scalars['ID']['input']>;
};

export type Currency =
  | 'AED'
  | 'AFN'
  | 'ALL'
  | 'AMD'
  | 'ANG'
  | 'AOA'
  | 'ARS'
  | 'AUD'
  | 'AWG'
  | 'AZN'
  | 'BAM'
  | 'BBD'
  | 'BDT'
  | 'BGN'
  | 'BHD'
  | 'BIF'
  | 'BMD'
  | 'BND'
  | 'BOB'
  | 'BRL'
  | 'BSD'
  | 'BTN'
  | 'BWP'
  | 'BYN'
  | 'BZD'
  | 'CAD'
  | 'CDF'
  | 'CHF'
  | 'CLP'
  | 'CNY'
  | 'COP'
  | 'CRC'
  | 'CUP'
  | 'CVE'
  | 'CZK'
  | 'DJF'
  | 'DKK'
  | 'DOP'
  | 'DZD'
  | 'EGP'
  | 'ERN'
  | 'ETB'
  | 'EUR'
  | 'FJD'
  | 'FKP'
  | 'FOK'
  | 'FRO'
  | 'GBP'
  | 'GEL'
  | 'GGP'
  | 'GHS'
  | 'GIP'
  | 'GMD'
  | 'GNF'
  | 'GTQ'
  | 'GYD'
  | 'HKD'
  | 'HNL'
  | 'HRK'
  | 'HTG'
  | 'HUF'
  | 'IDR'
  | 'ILS'
  | 'IMP'
  | 'INR'
  | 'IQD'
  | 'IRR'
  | 'ISK'
  | 'JEP'
  | 'JMD'
  | 'JOD'
  | 'JPY'
  | 'KES'
  | 'KGS'
  | 'KHR'
  | 'KID'
  | 'KMF'
  | 'KRW'
  | 'KWD'
  | 'KYD'
  | 'KZT'
  | 'LAK'
  | 'LBP'
  | 'LKR'
  | 'LRD'
  | 'LSL'
  | 'LYD'
  | 'MAD'
  | 'MDL'
  | 'MGA'
  | 'MKD'
  | 'MMK'
  | 'MNT'
  | 'MOP'
  | 'MRU'
  | 'MUR'
  | 'MVR'
  | 'MWK'
  | 'MXN'
  | 'MYR'
  | 'MZN'
  | 'NAD'
  | 'NGN'
  | 'NIO'
  | 'NOK'
  | 'NPR'
  | 'NZD'
  | 'OMR'
  | 'PAB'
  | 'PEN'
  | 'PGK'
  | 'PHP'
  | 'PKR'
  | 'PLN'
  | 'PYG'
  | 'QAR'
  | 'RON'
  | 'RSD'
  | 'RUB'
  | 'RWF'
  | 'SAR'
  | 'SBD'
  | 'SCR'
  | 'SDG'
  | 'SEK'
  | 'SGD'
  | 'SHP'
  | 'SLL'
  | 'SOS'
  | 'SPL'
  | 'SRD'
  | 'STN'
  | 'SVC'
  | 'SYP'
  | 'SZL'
  | 'THB'
  | 'TJS'
  | 'TMT'
  | 'TND'
  | 'TOP'
  | 'TRY'
  | 'TTD'
  | 'TVD'
  | 'TWD'
  | 'TZS'
  | 'UAH'
  | 'UGX'
  | 'USD'
  | 'UYU'
  | 'UZS'
  | 'VEF'
  | 'VND'
  | 'VUV'
  | 'WST'
  | 'XAF'
  | 'XCD'
  | 'XDR'
  | 'XOF'
  | 'XPF'
  | 'YER'
  | 'ZAR'
  | 'ZMW'
  | 'ZWD';

export type CursorPaginationInput = {
  cursor?: InputMaybe<Scalars['String']['input']>;
  direction: PaginationDirection;
  limit: Scalars['PositiveInt']['input'];
};

/**
 * Default connection page info for containing the metadata for a connection
 * instance.
 */
export type DefaultConnectionPageInfo = ConnectionPageInfo & {
  __typename?: 'DefaultConnectionPageInfo';
  endCursor?: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  startCursor?: Maybe<Scalars['String']['output']>;
};

export type DeleteAdvertisementPayload = {
  __typename?: 'DeleteAdvertisementPayload';
  advertisement?: Maybe<Advertisement>;
};

export type DeletePayload = {
  __typename?: 'DeletePayload';
  success: Scalars['Boolean']['output'];
};

export type DirectChat = {
  __typename?: 'DirectChat';
  _id: Scalars['ID']['output'];
  createdAt: Scalars['DateTime']['output'];
  creator?: Maybe<User>;
  messages?: Maybe<Array<Maybe<DirectChatMessage>>>;
  organization: Organization;
  updatedAt: Scalars['DateTime']['output'];
  users: Array<User>;
};

export type DirectChatMessage = {
  __typename?: 'DirectChatMessage';
  _id: Scalars['ID']['output'];
  createdAt: Scalars['DateTime']['output'];
  directChatMessageBelongsTo: DirectChat;
  messageContent: Scalars['String']['output'];
  receiver: User;
  sender: User;
  updatedAt: Scalars['DateTime']['output'];
};

export type Donation = {
  __typename?: 'Donation';
  _id: Scalars['ID']['output'];
  amount: Scalars['Float']['output'];
  createdAt: Scalars['DateTime']['output'];
  nameOfOrg: Scalars['String']['output'];
  nameOfUser: Scalars['String']['output'];
  orgId: Scalars['ID']['output'];
  payPalId: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  userId: Scalars['ID']['output'];
};

export type DonationWhereInput = {
  id?: InputMaybe<Scalars['ID']['input']>;
  id_contains?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_starts_with?: InputMaybe<Scalars['ID']['input']>;
  name_of_user?: InputMaybe<Scalars['String']['input']>;
  name_of_user_contains?: InputMaybe<Scalars['String']['input']>;
  name_of_user_in?: InputMaybe<Array<Scalars['String']['input']>>;
  name_of_user_not?: InputMaybe<Scalars['String']['input']>;
  name_of_user_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  name_of_user_starts_with?: InputMaybe<Scalars['String']['input']>;
};

export type EditVenueInput = {
  capacity?: InputMaybe<Scalars['Int']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  file?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
};

export type EducationGrade =
  | 'GRADE_1'
  | 'GRADE_2'
  | 'GRADE_3'
  | 'GRADE_4'
  | 'GRADE_5'
  | 'GRADE_6'
  | 'GRADE_7'
  | 'GRADE_8'
  | 'GRADE_9'
  | 'GRADE_10'
  | 'GRADE_11'
  | 'GRADE_12'
  | 'GRADUATE'
  | 'KG'
  | 'NO_GRADE'
  | 'PRE_KG';

export type EmploymentStatus =
  | 'FULL_TIME'
  | 'PART_TIME'
  | 'UNEMPLOYED';

export type Error = {
  message: Scalars['String']['output'];
};

export type Event = {
  __typename?: 'Event';
  _id: Scalars['ID']['output'];
  actionItems?: Maybe<Array<Maybe<ActionItem>>>;
  admins?: Maybe<Array<User>>;
  agendaItems?: Maybe<Array<Maybe<AgendaItem>>>;
  allDay: Scalars['Boolean']['output'];
  attendees?: Maybe<Array<Maybe<User>>>;
  attendeesCheckInStatus: Array<CheckInStatus>;
  averageFeedbackScore?: Maybe<Scalars['Float']['output']>;
  createdAt: Scalars['DateTime']['output'];
  creator?: Maybe<User>;
  description: Scalars['String']['output'];
  endDate?: Maybe<Scalars['Date']['output']>;
  endTime?: Maybe<Scalars['Time']['output']>;
  feedback: Array<Feedback>;
  images?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  isPublic: Scalars['Boolean']['output'];
  isRegisterable: Scalars['Boolean']['output'];
  latitude?: Maybe<Scalars['Latitude']['output']>;
  location?: Maybe<Scalars['String']['output']>;
  longitude?: Maybe<Scalars['Longitude']['output']>;
  organization?: Maybe<Organization>;
  recurrance?: Maybe<Recurrance>;
  recurring: Scalars['Boolean']['output'];
  startDate: Scalars['Date']['output'];
  startTime?: Maybe<Scalars['Time']['output']>;
  status: Status;
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};


export type EventAdminsArgs = {
  adminId?: InputMaybe<Scalars['ID']['input']>;
};

export type EventAttendee = {
  __typename?: 'EventAttendee';
  _id: Scalars['ID']['output'];
  checkInId?: Maybe<Scalars['ID']['output']>;
  createdAt: Scalars['DateTime']['output'];
  eventId: Scalars['ID']['output'];
  isCheckedIn: Scalars['Boolean']['output'];
  isCheckedOut: Scalars['Boolean']['output'];
  isInvited: Scalars['Boolean']['output'];
  isRegistered: Scalars['Boolean']['output'];
  updatedAt: Scalars['DateTime']['output'];
  userId: Scalars['ID']['output'];
};

export type EventAttendeeInput = {
  eventId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};

export type EventInput = {
  allDay: Scalars['Boolean']['input'];
  description: Scalars['String']['input'];
  endDate?: InputMaybe<Scalars['Date']['input']>;
  endTime?: InputMaybe<Scalars['Time']['input']>;
  images?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  isPublic: Scalars['Boolean']['input'];
  isRegisterable: Scalars['Boolean']['input'];
  latitude?: InputMaybe<Scalars['Latitude']['input']>;
  location?: InputMaybe<Scalars['String']['input']>;
  longitude?: InputMaybe<Scalars['Longitude']['input']>;
  organizationId: Scalars['ID']['input'];
  recurrance?: InputMaybe<Recurrance>;
  recurring: Scalars['Boolean']['input'];
  startDate: Scalars['Date']['input'];
  startTime?: InputMaybe<Scalars['Time']['input']>;
  title: Scalars['String']['input'];
};

export type EventOrderByInput =
  | 'allDay_ASC'
  | 'allDay_DESC'
  | 'description_ASC'
  | 'description_DESC'
  | 'endDate_ASC'
  | 'endDate_DESC'
  | 'endTime_ASC'
  | 'endTime_DESC'
  | 'id_ASC'
  | 'id_DESC'
  | 'location_ASC'
  | 'location_DESC'
  | 'recurrance_ASC'
  | 'recurrance_DESC'
  | 'startDate_ASC'
  | 'startDate_DESC'
  | 'startTime_ASC'
  | 'startTime_DESC'
  | 'title_ASC'
  | 'title_DESC';

export type EventVolunteer = {
  __typename?: 'EventVolunteer';
  _id: Scalars['ID']['output'];
  createdAt: Scalars['DateTime']['output'];
  creator?: Maybe<User>;
  event?: Maybe<Event>;
  isAssigned?: Maybe<Scalars['Boolean']['output']>;
  isInvited?: Maybe<Scalars['Boolean']['output']>;
  response?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  user: User;
};

export type EventVolunteerInput = {
  eventId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};

export type EventVolunteerResponse =
  | 'NO'
  | 'YES';

export type EventWhereInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  description_contains?: InputMaybe<Scalars['String']['input']>;
  description_in?: InputMaybe<Array<Scalars['String']['input']>>;
  description_not?: InputMaybe<Scalars['String']['input']>;
  description_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  description_starts_with?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_contains?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_starts_with?: InputMaybe<Scalars['ID']['input']>;
  location?: InputMaybe<Scalars['String']['input']>;
  location_contains?: InputMaybe<Scalars['String']['input']>;
  location_in?: InputMaybe<Array<Scalars['String']['input']>>;
  location_not?: InputMaybe<Scalars['String']['input']>;
  location_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  location_starts_with?: InputMaybe<Scalars['String']['input']>;
  organization_id?: InputMaybe<Scalars['ID']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  title_contains?: InputMaybe<Scalars['String']['input']>;
  title_in?: InputMaybe<Array<Scalars['String']['input']>>;
  title_not?: InputMaybe<Scalars['String']['input']>;
  title_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  title_starts_with?: InputMaybe<Scalars['String']['input']>;
};

export type ExtendSession = {
  __typename?: 'ExtendSession';
  accessToken: Scalars['String']['output'];
  refreshToken: Scalars['String']['output'];
};

export type Feedback = {
  __typename?: 'Feedback';
  _id: Scalars['ID']['output'];
  createdAt: Scalars['DateTime']['output'];
  event: Event;
  rating: Scalars['Int']['output'];
  review?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
};

export type FeedbackInput = {
  eventId: Scalars['ID']['input'];
  rating: Scalars['Int']['input'];
  review?: InputMaybe<Scalars['String']['input']>;
};

export type FieldError = {
  message: Scalars['String']['output'];
  path: Array<Scalars['String']['output']>;
};

export type ForgotPasswordData = {
  newPassword: Scalars['String']['input'];
  otpToken: Scalars['String']['input'];
  userOtp: Scalars['String']['input'];
};

export type Frequency =
  | 'DAILY'
  | 'MONTHLY'
  | 'WEEKLY'
  | 'YEARLY';

export type Fund = {
  __typename?: 'Fund';
  _id: Scalars['ID']['output'];
  campaigns?: Maybe<Array<FundraisingCampaign>>;
  createdAt: Scalars['DateTime']['output'];
  isArchived: Scalars['Boolean']['output'];
  isDefault: Scalars['Boolean']['output'];
  name: Scalars['String']['output'];
  organizationId: Scalars['ID']['output'];
  refrenceNumber?: Maybe<Scalars['String']['output']>;
  taxDeductible: Scalars['Boolean']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type FundCampaignInput = {
  currency: Currency;
  endDate: Scalars['Date']['input'];
  fundId: Scalars['ID']['input'];
  fundingGoal: Scalars['Float']['input'];
  name: Scalars['String']['input'];
  startDate: Scalars['Date']['input'];
};

export type FundCampaignPledgeInput = {
  amount: Scalars['Float']['input'];
  campaignId: Scalars['ID']['input'];
  currency: Currency;
  endDate?: InputMaybe<Scalars['Date']['input']>;
  startDate?: InputMaybe<Scalars['Date']['input']>;
  userIds: Array<Scalars['ID']['input']>;
};

export type FundInput = {
  isArchived: Scalars['Boolean']['input'];
  isDefault: Scalars['Boolean']['input'];
  name: Scalars['String']['input'];
  organizationId: Scalars['ID']['input'];
  refrenceNumber?: InputMaybe<Scalars['String']['input']>;
  taxDeductible: Scalars['Boolean']['input'];
};

export type FundraisingCampaign = {
  __typename?: 'FundraisingCampaign';
  _id: Scalars['ID']['output'];
  createdAt: Scalars['DateTime']['output'];
  currency: Currency;
  endDate: Scalars['Date']['output'];
  fundId: Fund;
  fundingGoal: Scalars['Float']['output'];
  name: Scalars['String']['output'];
  pledges?: Maybe<Array<Maybe<FundraisingCampaignPledge>>>;
  startDate: Scalars['Date']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type FundraisingCampaignPledge = {
  __typename?: 'FundraisingCampaignPledge';
  _id: Scalars['ID']['output'];
  amount: Scalars['Float']['output'];
  campaigns: Array<Maybe<FundraisingCampaign>>;
  currency: Currency;
  endDate?: Maybe<Scalars['Date']['output']>;
  startDate?: Maybe<Scalars['Date']['output']>;
  users: Array<Maybe<User>>;
};

export type Gender =
  | 'FEMALE'
  | 'MALE'
  | 'OTHER';

export type Group = {
  __typename?: 'Group';
  _id: Scalars['ID']['output'];
  admins: Array<User>;
  createdAt: Scalars['DateTime']['output'];
  description?: Maybe<Scalars['String']['output']>;
  organization: Organization;
  title: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
};

export type GroupChat = {
  __typename?: 'GroupChat';
  _id: Scalars['ID']['output'];
  createdAt: Scalars['DateTime']['output'];
  creator?: Maybe<User>;
  messages?: Maybe<Array<Maybe<GroupChatMessage>>>;
  organization: Organization;
  updatedAt: Scalars['DateTime']['output'];
  users: Array<User>;
};

export type GroupChatMessage = {
  __typename?: 'GroupChatMessage';
  _id: Scalars['ID']['output'];
  createdAt: Scalars['DateTime']['output'];
  groupChatMessageBelongsTo: GroupChat;
  messageContent: Scalars['String']['output'];
  sender: User;
  updatedAt: Scalars['DateTime']['output'];
};

export type InvalidCursor = FieldError & {
  __typename?: 'InvalidCursor';
  message: Scalars['String']['output'];
  path: Array<Scalars['String']['output']>;
};

export type ItemType =
  | 'Note'
  | 'Regular';

export type Language = {
  __typename?: 'Language';
  _id: Scalars['ID']['output'];
  createdAt: Scalars['String']['output'];
  en: Scalars['String']['output'];
  translation?: Maybe<Array<Maybe<LanguageModel>>>;
};

export type LanguageInput = {
  en_value: Scalars['String']['input'];
  translation_lang_code: Scalars['String']['input'];
  translation_value: Scalars['String']['input'];
};

export type LanguageModel = {
  __typename?: 'LanguageModel';
  _id: Scalars['ID']['output'];
  createdAt: Scalars['DateTime']['output'];
  lang_code: Scalars['String']['output'];
  value: Scalars['String']['output'];
  verified: Scalars['Boolean']['output'];
};

export type LoginInput = {
  email: Scalars['EmailAddress']['input'];
  password: Scalars['String']['input'];
};

export type MaritalStatus =
  | 'DIVORCED'
  | 'ENGAGED'
  | 'MARRIED'
  | 'SEPERATED'
  | 'SINGLE'
  | 'WIDOWED';

export type MaximumLengthError = FieldError & {
  __typename?: 'MaximumLengthError';
  message: Scalars['String']['output'];
  path: Array<Scalars['String']['output']>;
};

export type MaximumValueError = FieldError & {
  __typename?: 'MaximumValueError';
  limit: Scalars['Int']['output'];
  message: Scalars['String']['output'];
  path: Array<Scalars['String']['output']>;
};

export type MembershipRequest = {
  __typename?: 'MembershipRequest';
  _id: Scalars['ID']['output'];
  organization: Organization;
  user: User;
};

export type Message = {
  __typename?: 'Message';
  _id: Scalars['ID']['output'];
  createdAt: Scalars['DateTime']['output'];
  creator?: Maybe<User>;
  imageUrl?: Maybe<Scalars['URL']['output']>;
  text: Scalars['String']['output'];
  updatedAt: Scalars['DateTime']['output'];
  videoUrl?: Maybe<Scalars['URL']['output']>;
};

export type MessageChat = {
  __typename?: 'MessageChat';
  _id: Scalars['ID']['output'];
  createdAt: Scalars['DateTime']['output'];
  languageBarrier?: Maybe<Scalars['Boolean']['output']>;
  message: Scalars['String']['output'];
  receiver: User;
  sender: User;
  updatedAt: Scalars['DateTime']['output'];
};

export type MessageChatInput = {
  message: Scalars['String']['input'];
  receiver: Scalars['ID']['input'];
};

export type MinimumLengthError = FieldError & {
  __typename?: 'MinimumLengthError';
  limit: Scalars['Int']['output'];
  message: Scalars['String']['output'];
  path: Array<Scalars['String']['output']>;
};

export type MinimumValueError = FieldError & {
  __typename?: 'MinimumValueError';
  message: Scalars['String']['output'];
  path: Array<Scalars['String']['output']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  acceptAdmin: Scalars['Boolean']['output'];
  acceptMembershipRequest: MembershipRequest;
  addEventAttendee: User;
  addFeedback: Feedback;
  addLanguageTranslation: Language;
  addOrganizationCustomField: OrganizationCustomField;
  addOrganizationImage: Organization;
  addPledgeToFundraisingCampaign: FundraisingCampaignPledge;
  addUserCustomData: UserCustomData;
  addUserImage: User;
  addUserToGroupChat: GroupChat;
  addUserToUserFamily: UserFamily;
  adminRemoveEvent: Event;
  adminRemoveGroup: GroupChat;
  assignUserTag?: Maybe<User>;
  blockPluginCreationBySuperadmin: User;
  blockUser: User;
  cancelMembershipRequest: MembershipRequest;
  checkIn: CheckIn;
  checkInEventAttendee: EventAttendee;
  checkOutEventAttendee: EventAttendee;
  createActionItem: ActionItem;
  createActionItemCategory: ActionItemCategory;
  createAdmin: User;
  createAdvertisement?: Maybe<CreateAdvertisementPayload>;
  createAgendaCategory: AgendaCategory;
  createAgendaItem: AgendaItem;
  createComment?: Maybe<Comment>;
  createDirectChat: DirectChat;
  createDonation: Donation;
  createEvent: Event;
  createEventVolunteer: EventVolunteer;
  createFund: Fund;
  createFundraisingCampaign: FundraisingCampaign;
  createFundraisingCampaignPledge: FundraisingCampaignPledge;
  createGroupChat: GroupChat;
  createMember: Organization;
  createMessageChat: MessageChat;
  createOrganization: Organization;
  createPlugin: Plugin;
  createPost?: Maybe<Post>;
  createSampleOrganization: Scalars['Boolean']['output'];
  createUserFamily: UserFamily;
  createUserTag?: Maybe<UserTag>;
  createVenue?: Maybe<Venue>;
  deleteAdvertisement?: Maybe<DeleteAdvertisementPayload>;
  deleteAgendaCategory: Scalars['ID']['output'];
  deleteDonationById: DeletePayload;
  deleteVenue?: Maybe<Venue>;
  editVenue?: Maybe<Venue>;
  forgotPassword: Scalars['Boolean']['output'];
  inviteEventAttendee: EventAttendee;
  joinPublicOrganization: User;
  leaveOrganization: User;
  likeComment?: Maybe<Comment>;
  likePost?: Maybe<Post>;
  login: AuthData;
  logout: Scalars['Boolean']['output'];
  otp: OtpData;
  recaptcha: Scalars['Boolean']['output'];
  refreshToken: ExtendSession;
  registerEventAttendee: EventAttendee;
  registerForEvent: EventAttendee;
  rejectAdmin: Scalars['Boolean']['output'];
  rejectMembershipRequest: MembershipRequest;
  removeActionItem: ActionItem;
  removeAdmin: User;
  removeAdvertisement?: Maybe<Advertisement>;
  removeAgendaItem: AgendaItem;
  removeComment?: Maybe<Comment>;
  removeDirectChat: DirectChat;
  removeEvent: Event;
  removeEventAttendee: User;
  removeEventVolunteer: EventVolunteer;
  removeFund: Fund;
  removeFundraisingCampaign: FundraisingCampaign;
  removeFundraisingCampaignPledge: FundraisingCampaignPledge;
  removeGroupChat: GroupChat;
  removeMember: Organization;
  removeOrganization: User;
  removeOrganizationCustomField: OrganizationCustomField;
  removeOrganizationImage: Organization;
  removePost?: Maybe<Post>;
  removeSampleOrganization: Scalars['Boolean']['output'];
  removeUserCustomData: UserCustomData;
  removeUserFamily: UserFamily;
  removeUserFromGroupChat: GroupChat;
  removeUserFromUserFamily: UserFamily;
  removeUserImage: User;
  removeUserTag?: Maybe<UserTag>;
  revokeRefreshTokenForUser: Scalars['Boolean']['output'];
  saveFcmToken: Scalars['Boolean']['output'];
  sendMembershipRequest: MembershipRequest;
  sendMessageToDirectChat: DirectChatMessage;
  sendMessageToGroupChat: GroupChatMessage;
  signUp: AuthData;
  togglePostPin: Post;
  unassignUserTag?: Maybe<User>;
  unblockUser: User;
  unlikeComment?: Maybe<Comment>;
  unlikePost?: Maybe<Post>;
  unregisterForEventByUser: Event;
  updateActionItem?: Maybe<ActionItem>;
  updateActionItemCategory?: Maybe<ActionItemCategory>;
  updateAdvertisement?: Maybe<UpdateAdvertisementPayload>;
  updateAgendaCategory?: Maybe<AgendaCategory>;
  updateAgendaItem?: Maybe<AgendaItem>;
  updateEvent: Event;
  updateEventVolunteer: EventVolunteer;
  updateFund: Fund;
  updateFundraisingCampaign: FundraisingCampaign;
  updateFundraisingCampaignPledge: FundraisingCampaignPledge;
  updateLanguage: User;
  updateOrganization: Organization;
  updatePluginStatus: Plugin;
  updatePost: Post;
  updateUserPassword: User;
  updateUserProfile: User;
  updateUserRoleInOrganization: Organization;
  updateUserTag?: Maybe<UserTag>;
  updateUserType: Scalars['Boolean']['output'];
};


export type MutationAcceptAdminArgs = {
  id: Scalars['ID']['input'];
};


export type MutationAcceptMembershipRequestArgs = {
  membershipRequestId: Scalars['ID']['input'];
};


export type MutationAddEventAttendeeArgs = {
  data: EventAttendeeInput;
};


export type MutationAddFeedbackArgs = {
  data: FeedbackInput;
};


export type MutationAddLanguageTranslationArgs = {
  data: LanguageInput;
};


export type MutationAddOrganizationCustomFieldArgs = {
  name: Scalars['String']['input'];
  organizationId: Scalars['ID']['input'];
  type: Scalars['String']['input'];
};


export type MutationAddOrganizationImageArgs = {
  file: Scalars['String']['input'];
  organizationId: Scalars['String']['input'];
};


export type MutationAddPledgeToFundraisingCampaignArgs = {
  campaignId: Scalars['ID']['input'];
  pledgeId: Scalars['ID']['input'];
};


export type MutationAddUserCustomDataArgs = {
  dataName: Scalars['String']['input'];
  dataValue: Scalars['Any']['input'];
  organizationId: Scalars['ID']['input'];
};


export type MutationAddUserImageArgs = {
  file: Scalars['String']['input'];
};


export type MutationAddUserToGroupChatArgs = {
  chatId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};


export type MutationAddUserToUserFamilyArgs = {
  familyId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};


export type MutationAdminRemoveEventArgs = {
  eventId: Scalars['ID']['input'];
};


export type MutationAdminRemoveGroupArgs = {
  groupId: Scalars['ID']['input'];
};


export type MutationAssignUserTagArgs = {
  input: ToggleUserTagAssignInput;
};


export type MutationBlockPluginCreationBySuperadminArgs = {
  blockUser: Scalars['Boolean']['input'];
  userId: Scalars['ID']['input'];
};


export type MutationBlockUserArgs = {
  organizationId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};


export type MutationCancelMembershipRequestArgs = {
  membershipRequestId: Scalars['ID']['input'];
};


export type MutationCheckInArgs = {
  data: CheckInInput;
};


export type MutationCheckInEventAttendeeArgs = {
  data: EventAttendeeInput;
};


export type MutationCheckOutEventAttendeeArgs = {
  data: EventAttendeeInput;
};


export type MutationCreateActionItemArgs = {
  actionItemCategoryId: Scalars['ID']['input'];
  data: CreateActionItemInput;
};


export type MutationCreateActionItemCategoryArgs = {
  name: Scalars['String']['input'];
  organizationId: Scalars['ID']['input'];
};


export type MutationCreateAdminArgs = {
  data: UserAndOrganizationInput;
};


export type MutationCreateAdvertisementArgs = {
  input: CreateAdvertisementInput;
};


export type MutationCreateAgendaCategoryArgs = {
  input: CreateAgendaCategoryInput;
};


export type MutationCreateAgendaItemArgs = {
  input: CreateAgendaItemInput;
};


export type MutationCreateCommentArgs = {
  data: CommentInput;
  postId: Scalars['ID']['input'];
};


export type MutationCreateDirectChatArgs = {
  data: CreateChatInput;
};


export type MutationCreateDonationArgs = {
  amount: Scalars['Float']['input'];
  nameOfOrg: Scalars['String']['input'];
  nameOfUser: Scalars['String']['input'];
  orgId: Scalars['ID']['input'];
  payPalId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};


export type MutationCreateEventArgs = {
  data: EventInput;
  recurrenceRuleData?: InputMaybe<RecurrenceRuleInput>;
};


export type MutationCreateEventVolunteerArgs = {
  data: EventVolunteerInput;
};


export type MutationCreateFundArgs = {
  data: FundInput;
};


export type MutationCreateFundraisingCampaignArgs = {
  data: FundCampaignInput;
};


export type MutationCreateFundraisingCampaignPledgeArgs = {
  data: FundCampaignPledgeInput;
};


export type MutationCreateGroupChatArgs = {
  data: CreateGroupChatInput;
};


export type MutationCreateMemberArgs = {
  input: UserAndOrganizationInput;
};


export type MutationCreateMessageChatArgs = {
  data: MessageChatInput;
};


export type MutationCreateOrganizationArgs = {
  data?: InputMaybe<OrganizationInput>;
  file?: InputMaybe<Scalars['String']['input']>;
};


export type MutationCreatePluginArgs = {
  pluginCreatedBy: Scalars['String']['input'];
  pluginDesc: Scalars['String']['input'];
  pluginName: Scalars['String']['input'];
  uninstalledOrgs?: InputMaybe<Array<Scalars['ID']['input']>>;
};


export type MutationCreatePostArgs = {
  data: PostInput;
  file?: InputMaybe<Scalars['String']['input']>;
};


export type MutationCreateUserFamilyArgs = {
  data: CreateUserFamilyInput;
};


export type MutationCreateUserTagArgs = {
  input: CreateUserTagInput;
};


export type MutationCreateVenueArgs = {
  data: VenueInput;
};


export type MutationDeleteAdvertisementArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteAgendaCategoryArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteDonationByIdArgs = {
  id: Scalars['ID']['input'];
};


export type MutationDeleteVenueArgs = {
  id: Scalars['ID']['input'];
};


export type MutationEditVenueArgs = {
  data: EditVenueInput;
};


export type MutationForgotPasswordArgs = {
  data: ForgotPasswordData;
};


export type MutationInviteEventAttendeeArgs = {
  data: EventAttendeeInput;
};


export type MutationJoinPublicOrganizationArgs = {
  organizationId: Scalars['ID']['input'];
};


export type MutationLeaveOrganizationArgs = {
  organizationId: Scalars['ID']['input'];
};


export type MutationLikeCommentArgs = {
  id: Scalars['ID']['input'];
};


export type MutationLikePostArgs = {
  id: Scalars['ID']['input'];
};


export type MutationLoginArgs = {
  data: LoginInput;
};


export type MutationOtpArgs = {
  data: OtpInput;
};


export type MutationRecaptchaArgs = {
  data: RecaptchaVerification;
};


export type MutationRefreshTokenArgs = {
  refreshToken: Scalars['String']['input'];
};


export type MutationRegisterEventAttendeeArgs = {
  data: EventAttendeeInput;
};


export type MutationRegisterForEventArgs = {
  id: Scalars['ID']['input'];
};


export type MutationRejectAdminArgs = {
  id: Scalars['ID']['input'];
};


export type MutationRejectMembershipRequestArgs = {
  membershipRequestId: Scalars['ID']['input'];
};


export type MutationRemoveActionItemArgs = {
  id: Scalars['ID']['input'];
};


export type MutationRemoveAdminArgs = {
  data: UserAndOrganizationInput;
};


export type MutationRemoveAdvertisementArgs = {
  id: Scalars['ID']['input'];
};


export type MutationRemoveAgendaItemArgs = {
  id: Scalars['ID']['input'];
};


export type MutationRemoveCommentArgs = {
  id: Scalars['ID']['input'];
};


export type MutationRemoveDirectChatArgs = {
  chatId: Scalars['ID']['input'];
  organizationId: Scalars['ID']['input'];
};


export type MutationRemoveEventArgs = {
  id: Scalars['ID']['input'];
  recurringEventDeleteType?: InputMaybe<RecurringEventMutationType>;
};


export type MutationRemoveEventAttendeeArgs = {
  data: EventAttendeeInput;
};


export type MutationRemoveEventVolunteerArgs = {
  id: Scalars['ID']['input'];
};


export type MutationRemoveFundArgs = {
  id: Scalars['ID']['input'];
};


export type MutationRemoveFundraisingCampaignArgs = {
  id: Scalars['ID']['input'];
};


export type MutationRemoveFundraisingCampaignPledgeArgs = {
  id: Scalars['ID']['input'];
};


export type MutationRemoveGroupChatArgs = {
  chatId: Scalars['ID']['input'];
};


export type MutationRemoveMemberArgs = {
  data: UserAndOrganizationInput;
};


export type MutationRemoveOrganizationArgs = {
  id: Scalars['ID']['input'];
};


export type MutationRemoveOrganizationCustomFieldArgs = {
  customFieldId: Scalars['ID']['input'];
  organizationId: Scalars['ID']['input'];
};


export type MutationRemoveOrganizationImageArgs = {
  organizationId: Scalars['String']['input'];
};


export type MutationRemovePostArgs = {
  id: Scalars['ID']['input'];
};


export type MutationRemoveUserCustomDataArgs = {
  organizationId: Scalars['ID']['input'];
};


export type MutationRemoveUserFamilyArgs = {
  familyId: Scalars['ID']['input'];
};


export type MutationRemoveUserFromGroupChatArgs = {
  chatId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};


export type MutationRemoveUserFromUserFamilyArgs = {
  familyId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};


export type MutationRemoveUserTagArgs = {
  id: Scalars['ID']['input'];
};


export type MutationSaveFcmTokenArgs = {
  token?: InputMaybe<Scalars['String']['input']>;
};


export type MutationSendMembershipRequestArgs = {
  organizationId: Scalars['ID']['input'];
};


export type MutationSendMessageToDirectChatArgs = {
  chatId: Scalars['ID']['input'];
  messageContent: Scalars['String']['input'];
};


export type MutationSendMessageToGroupChatArgs = {
  chatId: Scalars['ID']['input'];
  messageContent: Scalars['String']['input'];
};


export type MutationSignUpArgs = {
  data: UserInput;
  file?: InputMaybe<Scalars['String']['input']>;
};


export type MutationTogglePostPinArgs = {
  id: Scalars['ID']['input'];
  title?: InputMaybe<Scalars['String']['input']>;
};


export type MutationUnassignUserTagArgs = {
  input: ToggleUserTagAssignInput;
};


export type MutationUnblockUserArgs = {
  organizationId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};


export type MutationUnlikeCommentArgs = {
  id: Scalars['ID']['input'];
};


export type MutationUnlikePostArgs = {
  id: Scalars['ID']['input'];
};


export type MutationUnregisterForEventByUserArgs = {
  id: Scalars['ID']['input'];
};


export type MutationUpdateActionItemArgs = {
  data: UpdateActionItemInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateActionItemCategoryArgs = {
  data: UpdateActionItemCategoryInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateAdvertisementArgs = {
  input: UpdateAdvertisementInput;
};


export type MutationUpdateAgendaCategoryArgs = {
  id: Scalars['ID']['input'];
  input: UpdateAgendaCategoryInput;
};


export type MutationUpdateAgendaItemArgs = {
  id: Scalars['ID']['input'];
  input: UpdateAgendaItemInput;
};


export type MutationUpdateEventArgs = {
  data?: InputMaybe<UpdateEventInput>;
  id: Scalars['ID']['input'];
  recurrenceRuleData?: InputMaybe<RecurrenceRuleInput>;
  recurringEventUpdateType?: InputMaybe<RecurringEventMutationType>;
};


export type MutationUpdateEventVolunteerArgs = {
  data?: InputMaybe<UpdateEventVolunteerInput>;
  id: Scalars['ID']['input'];
};


export type MutationUpdateFundArgs = {
  data: UpdateFundInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateFundraisingCampaignArgs = {
  data: UpdateFundCampaignInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateFundraisingCampaignPledgeArgs = {
  data: UpdateFundCampaignPledgeInput;
  id: Scalars['ID']['input'];
};


export type MutationUpdateLanguageArgs = {
  languageCode: Scalars['String']['input'];
};


export type MutationUpdateOrganizationArgs = {
  data?: InputMaybe<UpdateOrganizationInput>;
  file?: InputMaybe<Scalars['String']['input']>;
  id: Scalars['ID']['input'];
};


export type MutationUpdatePluginStatusArgs = {
  id: Scalars['ID']['input'];
  orgId: Scalars['ID']['input'];
};


export type MutationUpdatePostArgs = {
  data?: InputMaybe<PostUpdateInput>;
  id: Scalars['ID']['input'];
};


export type MutationUpdateUserPasswordArgs = {
  data: UpdateUserPasswordInput;
};


export type MutationUpdateUserProfileArgs = {
  data?: InputMaybe<UpdateUserInput>;
  file?: InputMaybe<Scalars['String']['input']>;
};


export type MutationUpdateUserRoleInOrganizationArgs = {
  organizationId: Scalars['ID']['input'];
  role: Scalars['String']['input'];
  userId: Scalars['ID']['input'];
};


export type MutationUpdateUserTagArgs = {
  input: UpdateUserTagInput;
};


export type MutationUpdateUserTypeArgs = {
  data: UpdateUserTypeInput;
};

export type OtpInput = {
  email: Scalars['EmailAddress']['input'];
};

export type Organization = {
  __typename?: 'Organization';
  _id: Scalars['ID']['output'];
  actionItemCategories?: Maybe<Array<Maybe<ActionItemCategory>>>;
  address?: Maybe<Address>;
  admins?: Maybe<Array<User>>;
  advertisements?: Maybe<AdvertisementsConnection>;
  agendaCategories?: Maybe<Array<Maybe<AgendaCategory>>>;
  apiUrl: Scalars['URL']['output'];
  blockedUsers?: Maybe<Array<Maybe<User>>>;
  createdAt: Scalars['DateTime']['output'];
  creator?: Maybe<User>;
  customFields: Array<OrganizationCustomField>;
  description: Scalars['String']['output'];
  funds?: Maybe<Array<Maybe<Fund>>>;
  image?: Maybe<Scalars['String']['output']>;
  members?: Maybe<Array<Maybe<User>>>;
  membershipRequests?: Maybe<Array<Maybe<MembershipRequest>>>;
  name: Scalars['String']['output'];
  pinnedPosts?: Maybe<Array<Maybe<Post>>>;
  posts?: Maybe<PostsConnection>;
  updatedAt: Scalars['DateTime']['output'];
  userRegistrationRequired: Scalars['Boolean']['output'];
  userTags?: Maybe<UserTagsConnection>;
  venues?: Maybe<Array<Maybe<Venue>>>;
  visibleInSearch: Scalars['Boolean']['output'];
};


export type OrganizationAdminsArgs = {
  adminId?: InputMaybe<Scalars['ID']['input']>;
};


export type OrganizationAdvertisementsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
};


export type OrganizationPostsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['PositiveInt']['input']>;
  last?: InputMaybe<Scalars['PositiveInt']['input']>;
};


export type OrganizationUserTagsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['PositiveInt']['input']>;
  last?: InputMaybe<Scalars['PositiveInt']['input']>;
};

export type OrganizationCustomField = {
  __typename?: 'OrganizationCustomField';
  _id: Scalars['ID']['output'];
  name: Scalars['String']['output'];
  organizationId: Scalars['String']['output'];
  type: Scalars['String']['output'];
};

export type OrganizationInfoNode = {
  __typename?: 'OrganizationInfoNode';
  _id: Scalars['ID']['output'];
  apiUrl: Scalars['URL']['output'];
  creator?: Maybe<User>;
  description: Scalars['String']['output'];
  image?: Maybe<Scalars['String']['output']>;
  name: Scalars['String']['output'];
  userRegistrationRequired: Scalars['Boolean']['output'];
  visibleInSearch: Scalars['Boolean']['output'];
};

export type OrganizationInput = {
  address: AddressInput;
  apiUrl?: InputMaybe<Scalars['URL']['input']>;
  attendees?: InputMaybe<Scalars['String']['input']>;
  description: Scalars['String']['input'];
  image?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  userRegistrationRequired?: InputMaybe<Scalars['Boolean']['input']>;
  visibleInSearch?: InputMaybe<Scalars['Boolean']['input']>;
};

export type OrganizationOrderByInput =
  | 'apiUrl_ASC'
  | 'apiUrl_DESC'
  | 'createdAt_ASC'
  | 'createdAt_DESC'
  | 'description_ASC'
  | 'description_DESC'
  | 'id_ASC'
  | 'id_DESC'
  | 'name_ASC'
  | 'name_DESC';

export type OrganizationWhereInput = {
  apiUrl?: InputMaybe<Scalars['URL']['input']>;
  apiUrl_contains?: InputMaybe<Scalars['URL']['input']>;
  apiUrl_in?: InputMaybe<Array<Scalars['URL']['input']>>;
  apiUrl_not?: InputMaybe<Scalars['URL']['input']>;
  apiUrl_not_in?: InputMaybe<Array<Scalars['URL']['input']>>;
  apiUrl_starts_with?: InputMaybe<Scalars['URL']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  description_contains?: InputMaybe<Scalars['String']['input']>;
  description_in?: InputMaybe<Array<Scalars['String']['input']>>;
  description_not?: InputMaybe<Scalars['String']['input']>;
  description_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  description_starts_with?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_contains?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_starts_with?: InputMaybe<Scalars['ID']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  name_contains?: InputMaybe<Scalars['String']['input']>;
  name_in?: InputMaybe<Array<Scalars['String']['input']>>;
  name_not?: InputMaybe<Scalars['String']['input']>;
  name_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  name_starts_with?: InputMaybe<Scalars['String']['input']>;
  userRegistrationRequired?: InputMaybe<Scalars['Boolean']['input']>;
  visibleInSearch?: InputMaybe<Scalars['Boolean']['input']>;
};

export type OtpData = {
  __typename?: 'OtpData';
  otpToken: Scalars['String']['output'];
};

/** Information about pagination in a connection. */
export type PageInfo = {
  __typename?: 'PageInfo';
  currPageNo?: Maybe<Scalars['Int']['output']>;
  /** When paginating forwards, are there more items? */
  hasNextPage: Scalars['Boolean']['output'];
  /** When paginating backwards, are there more items? */
  hasPreviousPage: Scalars['Boolean']['output'];
  nextPageNo?: Maybe<Scalars['Int']['output']>;
  prevPageNo?: Maybe<Scalars['Int']['output']>;
  totalPages?: Maybe<Scalars['Int']['output']>;
};

export type PaginationDirection =
  | 'BACKWARD'
  | 'FORWARD';

export type Plugin = {
  __typename?: 'Plugin';
  _id: Scalars['ID']['output'];
  pluginCreatedBy: Scalars['String']['output'];
  pluginDesc: Scalars['String']['output'];
  pluginName: Scalars['String']['output'];
  uninstalledOrgs?: Maybe<Array<Scalars['ID']['output']>>;
};

export type PluginField = {
  __typename?: 'PluginField';
  createdAt: Scalars['DateTime']['output'];
  key: Scalars['String']['output'];
  status: Status;
  value: Scalars['String']['output'];
};

export type PluginFieldInput = {
  key: Scalars['String']['input'];
  value: Scalars['String']['input'];
};

export type PluginInput = {
  fields?: InputMaybe<Array<InputMaybe<PluginFieldInput>>>;
  orgId: Scalars['ID']['input'];
  pluginKey?: InputMaybe<Scalars['String']['input']>;
  pluginName: Scalars['String']['input'];
  pluginType?: InputMaybe<Type>;
};

export type Post = {
  __typename?: 'Post';
  _id?: Maybe<Scalars['ID']['output']>;
  commentCount?: Maybe<Scalars['Int']['output']>;
  comments?: Maybe<Array<Maybe<Comment>>>;
  createdAt: Scalars['DateTime']['output'];
  creator?: Maybe<User>;
  imageUrl?: Maybe<Scalars['URL']['output']>;
  likeCount?: Maybe<Scalars['Int']['output']>;
  likedBy?: Maybe<Array<Maybe<User>>>;
  organization: Organization;
  pinned?: Maybe<Scalars['Boolean']['output']>;
  text: Scalars['String']['output'];
  title?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['DateTime']['output'];
  videoUrl?: Maybe<Scalars['URL']['output']>;
};

export type PostEdge = {
  __typename?: 'PostEdge';
  cursor: Scalars['String']['output'];
  node: Post;
};

export type PostInput = {
  _id?: InputMaybe<Scalars['ID']['input']>;
  imageUrl?: InputMaybe<Scalars['URL']['input']>;
  organizationId: Scalars['ID']['input'];
  pinned?: InputMaybe<Scalars['Boolean']['input']>;
  text: Scalars['String']['input'];
  title?: InputMaybe<Scalars['String']['input']>;
  videoUrl?: InputMaybe<Scalars['URL']['input']>;
};

export type PostOrderByInput =
  | 'commentCount_ASC'
  | 'commentCount_DESC'
  | 'createdAt_ASC'
  | 'createdAt_DESC'
  | 'id_ASC'
  | 'id_DESC'
  | 'imageUrl_ASC'
  | 'imageUrl_DESC'
  | 'likeCount_ASC'
  | 'likeCount_DESC'
  | 'text_ASC'
  | 'text_DESC'
  | 'title_ASC'
  | 'title_DESC'
  | 'videoUrl_ASC'
  | 'videoUrl_DESC';

export type PostUpdateInput = {
  imageUrl?: InputMaybe<Scalars['String']['input']>;
  text?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  videoUrl?: InputMaybe<Scalars['String']['input']>;
};

export type PostWhereInput = {
  id?: InputMaybe<Scalars['ID']['input']>;
  id_contains?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_starts_with?: InputMaybe<Scalars['ID']['input']>;
  text?: InputMaybe<Scalars['String']['input']>;
  text_contains?: InputMaybe<Scalars['String']['input']>;
  text_in?: InputMaybe<Array<Scalars['String']['input']>>;
  text_not?: InputMaybe<Scalars['String']['input']>;
  text_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  text_starts_with?: InputMaybe<Scalars['String']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  title_contains?: InputMaybe<Scalars['String']['input']>;
  title_in?: InputMaybe<Array<Scalars['String']['input']>>;
  title_not?: InputMaybe<Scalars['String']['input']>;
  title_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  title_starts_with?: InputMaybe<Scalars['String']['input']>;
};

export type PostsConnection = {
  __typename?: 'PostsConnection';
  edges: Array<PostEdge>;
  pageInfo: DefaultConnectionPageInfo;
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type Query = {
  __typename?: 'Query';
  actionItem?: Maybe<ActionItem>;
  actionItemCategoriesByOrganization?: Maybe<Array<Maybe<ActionItemCategory>>>;
  actionItemCategory?: Maybe<ActionItemCategory>;
  actionItemsByEvent?: Maybe<Array<Maybe<ActionItem>>>;
  actionItemsByOrganization?: Maybe<Array<Maybe<ActionItem>>>;
  adminPlugin?: Maybe<Array<Maybe<Plugin>>>;
  advertisementsConnection?: Maybe<AdvertisementsConnection>;
  agendaCategory: AgendaCategory;
  checkAuth: User;
  customDataByOrganization: Array<UserCustomData>;
  customFieldsByOrganization?: Maybe<Array<Maybe<OrganizationCustomField>>>;
  directChatsByUserID?: Maybe<Array<Maybe<DirectChat>>>;
  directChatsMessagesByChatID?: Maybe<Array<Maybe<DirectChatMessage>>>;
  event?: Maybe<Event>;
  eventVolunteersByEvent?: Maybe<Array<Maybe<EventVolunteer>>>;
  eventsByOrganization?: Maybe<Array<Maybe<Event>>>;
  eventsByOrganizationConnection: Array<Event>;
  getAgendaItem?: Maybe<AgendaItem>;
  getAllAgendaItems?: Maybe<Array<Maybe<AgendaItem>>>;
  getDonationById: Donation;
  getDonationByOrgId?: Maybe<Array<Maybe<Donation>>>;
  getDonationByOrgIdConnection: Array<Donation>;
  getEventAttendee?: Maybe<EventAttendee>;
  getEventAttendeesByEventId?: Maybe<Array<Maybe<EventAttendee>>>;
  getFundById: Fund;
  getFundraisingCampaignById: FundraisingCampaign;
  getFundraisingCampaignPledgeById: FundraisingCampaignPledge;
  getPlugins?: Maybe<Array<Maybe<Plugin>>>;
  getlanguage?: Maybe<Array<Maybe<Translation>>>;
  hasSubmittedFeedback?: Maybe<Scalars['Boolean']['output']>;
  isSampleOrganization: Scalars['Boolean']['output'];
  joinedOrganizations?: Maybe<Array<Maybe<Organization>>>;
  me: User;
  myLanguage?: Maybe<Scalars['String']['output']>;
  organizations?: Maybe<Array<Maybe<Organization>>>;
  organizationsConnection: Array<Maybe<Organization>>;
  organizationsMemberConnection: UserConnection;
  plugin?: Maybe<Array<Maybe<Plugin>>>;
  post?: Maybe<Post>;
  registeredEventsByUser?: Maybe<Array<Maybe<Event>>>;
  registrantsByEvent?: Maybe<Array<Maybe<User>>>;
  user: User;
  userLanguage?: Maybe<Scalars['String']['output']>;
  users?: Maybe<Array<Maybe<User>>>;
  usersConnection: Array<Maybe<User>>;
  venue?: Maybe<Venue>;
};


export type QueryActionItemArgs = {
  id: Scalars['ID']['input'];
};


export type QueryActionItemCategoriesByOrganizationArgs = {
  organizationId: Scalars['ID']['input'];
};


export type QueryActionItemCategoryArgs = {
  id: Scalars['ID']['input'];
};


export type QueryActionItemsByEventArgs = {
  eventId: Scalars['ID']['input'];
};


export type QueryActionItemsByOrganizationArgs = {
  orderBy?: InputMaybe<ActionItemsOrderByInput>;
  organizationId: Scalars['ID']['input'];
  where?: InputMaybe<ActionItemWhereInput>;
};


export type QueryAdminPluginArgs = {
  orgId: Scalars['ID']['input'];
};


export type QueryAdvertisementsConnectionArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['PositiveInt']['input']>;
  last?: InputMaybe<Scalars['PositiveInt']['input']>;
};


export type QueryAgendaCategoryArgs = {
  id: Scalars['ID']['input'];
};


export type QueryCustomDataByOrganizationArgs = {
  organizationId: Scalars['ID']['input'];
};


export type QueryCustomFieldsByOrganizationArgs = {
  id: Scalars['ID']['input'];
};


export type QueryDirectChatsByUserIdArgs = {
  id: Scalars['ID']['input'];
};


export type QueryDirectChatsMessagesByChatIdArgs = {
  id: Scalars['ID']['input'];
};


export type QueryEventArgs = {
  id: Scalars['ID']['input'];
};


export type QueryEventVolunteersByEventArgs = {
  id: Scalars['ID']['input'];
};


export type QueryEventsByOrganizationArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
  orderBy?: InputMaybe<EventOrderByInput>;
};


export type QueryEventsByOrganizationConnectionArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<EventOrderByInput>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<EventWhereInput>;
};


export type QueryGetAgendaItemArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetDonationByIdArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetDonationByOrgIdArgs = {
  orgId: Scalars['ID']['input'];
};


export type QueryGetDonationByOrgIdConnectionArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orgId: Scalars['ID']['input'];
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<DonationWhereInput>;
};


export type QueryGetEventAttendeeArgs = {
  eventId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};


export type QueryGetEventAttendeesByEventIdArgs = {
  eventId: Scalars['ID']['input'];
};


export type QueryGetFundByIdArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetFundraisingCampaignByIdArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetFundraisingCampaignPledgeByIdArgs = {
  id: Scalars['ID']['input'];
};


export type QueryGetlanguageArgs = {
  lang_code: Scalars['String']['input'];
};


export type QueryHasSubmittedFeedbackArgs = {
  eventId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};


export type QueryIsSampleOrganizationArgs = {
  id: Scalars['ID']['input'];
};


export type QueryJoinedOrganizationsArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
};


export type QueryOrganizationsArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
  orderBy?: InputMaybe<OrganizationOrderByInput>;
};


export type QueryOrganizationsConnectionArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<OrganizationOrderByInput>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<OrganizationWhereInput>;
};


export type QueryOrganizationsMemberConnectionArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<UserOrderByInput>;
  orgId: Scalars['ID']['input'];
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<UserWhereInput>;
};


export type QueryPluginArgs = {
  orgId: Scalars['ID']['input'];
};


export type QueryPostArgs = {
  id: Scalars['ID']['input'];
};


export type QueryRegisteredEventsByUserArgs = {
  id?: InputMaybe<Scalars['ID']['input']>;
  orderBy?: InputMaybe<EventOrderByInput>;
};


export type QueryRegistrantsByEventArgs = {
  id: Scalars['ID']['input'];
};


export type QueryUserArgs = {
  id: Scalars['ID']['input'];
};


export type QueryUserLanguageArgs = {
  userId: Scalars['ID']['input'];
};


export type QueryUsersArgs = {
  adminApproved?: InputMaybe<Scalars['Boolean']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<UserOrderByInput>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  userType?: InputMaybe<Scalars['String']['input']>;
  where?: InputMaybe<UserWhereInput>;
};


export type QueryUsersConnectionArgs = {
  first?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<UserOrderByInput>;
  skip?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<UserWhereInput>;
};


export type QueryVenueArgs = {
  id: Scalars['ID']['input'];
};

export type RecaptchaVerification = {
  recaptchaToken: Scalars['String']['input'];
};

export type Recurrance =
  | 'DAILY'
  | 'MONTHLY'
  | 'ONCE'
  | 'WEEKLY'
  | 'YEARLY';

export type RecurrenceRuleInput = {
  count?: InputMaybe<Scalars['Int']['input']>;
  frequency?: InputMaybe<Frequency>;
  weekDays?: InputMaybe<Array<InputMaybe<WeekDays>>>;
};

export type RecurringEventMutationType =
  | 'AllInstances'
  | 'ThisAndFollowingInstances'
  | 'ThisInstance';

/**
 * Possible variants of ordering in which sorting on a field should be
 * applied for a connection or other list type data structures.
 */
export type SortedByOrder =
  /**
   * When the sorting order should be from the smallest value to largest
   * value.
   */
  | 'ASCENDING'
  /**
   * When the sorting order should be from the largest value to the smallest
   * value.
   */
  | 'DESCENDING';

export type Status =
  | 'ACTIVE'
  | 'BLOCKED'
  | 'DELETED';

export type Subscription = {
  __typename?: 'Subscription';
  directMessageChat?: Maybe<MessageChat>;
  messageSentToDirectChat?: Maybe<DirectChatMessage>;
  messageSentToGroupChat?: Maybe<GroupChatMessage>;
  onPluginUpdate?: Maybe<Plugin>;
};

export type ToggleUserTagAssignInput = {
  tagId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};

export type Translation = {
  __typename?: 'Translation';
  en_value?: Maybe<Scalars['String']['output']>;
  lang_code?: Maybe<Scalars['String']['output']>;
  translation?: Maybe<Scalars['String']['output']>;
  verified?: Maybe<Scalars['Boolean']['output']>;
};

export type Type =
  | 'PRIVATE'
  | 'UNIVERSAL';

export type UnauthenticatedError = Error & {
  __typename?: 'UnauthenticatedError';
  message: Scalars['String']['output'];
};

export type UnauthorizedError = Error & {
  __typename?: 'UnauthorizedError';
  message: Scalars['String']['output'];
};

export type UpdateActionItemCategoryInput = {
  isDisabled?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateActionItemInput = {
  assigneeId?: InputMaybe<Scalars['ID']['input']>;
  completionDate?: InputMaybe<Scalars['Date']['input']>;
  dueDate?: InputMaybe<Scalars['Date']['input']>;
  isCompleted?: InputMaybe<Scalars['Boolean']['input']>;
  postCompletionNotes?: InputMaybe<Scalars['String']['input']>;
  preCompletionNotes?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateAdvertisementInput = {
  _id: Scalars['ID']['input'];
  endDate?: InputMaybe<Scalars['Date']['input']>;
  mediaFile?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['Date']['input']>;
  type?: InputMaybe<AdvertisementType>;
};

export type UpdateAdvertisementPayload = {
  __typename?: 'UpdateAdvertisementPayload';
  advertisement?: Maybe<Advertisement>;
};

export type UpdateAgendaCategoryInput = {
  description?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateAgendaItemInput = {
  attachments?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  categories?: InputMaybe<Array<InputMaybe<Scalars['ID']['input']>>>;
  description?: InputMaybe<Scalars['String']['input']>;
  duration?: InputMaybe<Scalars['String']['input']>;
  isNote?: InputMaybe<Scalars['Boolean']['input']>;
  itemType?: InputMaybe<ItemType>;
  relatedEvent?: InputMaybe<Scalars['ID']['input']>;
  sequence?: InputMaybe<Scalars['Int']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
  updatedBy: Scalars['ID']['input'];
  urls?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  user?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateEventInput = {
  allDay?: InputMaybe<Scalars['Boolean']['input']>;
  description?: InputMaybe<Scalars['String']['input']>;
  endDate?: InputMaybe<Scalars['Date']['input']>;
  endTime?: InputMaybe<Scalars['Time']['input']>;
  images?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  isPublic?: InputMaybe<Scalars['Boolean']['input']>;
  isRecurringEventException?: InputMaybe<Scalars['Boolean']['input']>;
  isRegisterable?: InputMaybe<Scalars['Boolean']['input']>;
  latitude?: InputMaybe<Scalars['Latitude']['input']>;
  location?: InputMaybe<Scalars['String']['input']>;
  longitude?: InputMaybe<Scalars['Longitude']['input']>;
  recurrance?: InputMaybe<Recurrance>;
  recurring?: InputMaybe<Scalars['Boolean']['input']>;
  startDate?: InputMaybe<Scalars['Date']['input']>;
  startTime?: InputMaybe<Scalars['Time']['input']>;
  title?: InputMaybe<Scalars['String']['input']>;
};

export type UpdateEventVolunteerInput = {
  eventId?: InputMaybe<Scalars['ID']['input']>;
  isAssigned?: InputMaybe<Scalars['Boolean']['input']>;
  isInvited?: InputMaybe<Scalars['Boolean']['input']>;
  response?: InputMaybe<EventVolunteerResponse>;
};

export type UpdateFundCampaignInput = {
  currency?: InputMaybe<Currency>;
  endDate?: InputMaybe<Scalars['Date']['input']>;
  fundingGoal?: InputMaybe<Scalars['Float']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  startDate?: InputMaybe<Scalars['Date']['input']>;
};

export type UpdateFundCampaignPledgeInput = {
  amount?: InputMaybe<Scalars['Float']['input']>;
  currency?: InputMaybe<Currency>;
  endDate?: InputMaybe<Scalars['Date']['input']>;
  startDate?: InputMaybe<Scalars['Date']['input']>;
};

export type UpdateFundInput = {
  isArchived?: InputMaybe<Scalars['Boolean']['input']>;
  isDefault?: InputMaybe<Scalars['Boolean']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  taxDeductible?: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdateOrganizationInput = {
  address?: InputMaybe<AddressInput>;
  description?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  userRegistrationRequired?: InputMaybe<Scalars['Boolean']['input']>;
  visibleInSearch?: InputMaybe<Scalars['Boolean']['input']>;
};

export type UpdateUserInput = {
  address?: InputMaybe<AddressInput>;
  birthDate?: InputMaybe<Scalars['Date']['input']>;
  educationGrade?: InputMaybe<EducationGrade>;
  email?: InputMaybe<Scalars['EmailAddress']['input']>;
  employmentStatus?: InputMaybe<EmploymentStatus>;
  firstName?: InputMaybe<Scalars['String']['input']>;
  gender?: InputMaybe<Gender>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  maritalStatus?: InputMaybe<MaritalStatus>;
  phone?: InputMaybe<UserPhoneInput>;
};

export type UpdateUserPasswordInput = {
  confirmNewPassword: Scalars['String']['input'];
  newPassword: Scalars['String']['input'];
  previousPassword: Scalars['String']['input'];
};

export type UpdateUserTagInput = {
  _id: Scalars['ID']['input'];
  name: Scalars['String']['input'];
};

export type UpdateUserTypeInput = {
  id?: InputMaybe<Scalars['ID']['input']>;
  userType?: InputMaybe<Scalars['String']['input']>;
};

export type User = {
  __typename?: 'User';
  _id: Scalars['ID']['output'];
  address?: Maybe<Address>;
  adminApproved?: Maybe<Scalars['Boolean']['output']>;
  adminFor?: Maybe<Array<Maybe<Organization>>>;
  appLanguageCode: Scalars['String']['output'];
  birthDate?: Maybe<Scalars['Date']['output']>;
  createdAt: Scalars['DateTime']['output'];
  createdEvents?: Maybe<Array<Maybe<Event>>>;
  createdOrganizations?: Maybe<Array<Maybe<Organization>>>;
  educationGrade?: Maybe<EducationGrade>;
  email: Scalars['EmailAddress']['output'];
  employmentStatus?: Maybe<EmploymentStatus>;
  eventAdmin?: Maybe<Array<Maybe<Event>>>;
  firstName: Scalars['String']['output'];
  gender?: Maybe<Gender>;
  image?: Maybe<Scalars['String']['output']>;
  joinedOrganizations?: Maybe<Array<Maybe<Organization>>>;
  lastName: Scalars['String']['output'];
  maritalStatus?: Maybe<MaritalStatus>;
  membershipRequests?: Maybe<Array<Maybe<MembershipRequest>>>;
  organizationsBlockedBy?: Maybe<Array<Maybe<Organization>>>;
  phone?: Maybe<UserPhone>;
  pluginCreationAllowed: Scalars['Boolean']['output'];
  posts?: Maybe<PostsConnection>;
  registeredEvents?: Maybe<Array<Maybe<Event>>>;
  tagsAssignedWith?: Maybe<UserTagsConnection>;
  tokenVersion: Scalars['Int']['output'];
  updatedAt: Scalars['DateTime']['output'];
  userType: UserType;
};


export type UserPostsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['PositiveInt']['input']>;
  last?: InputMaybe<Scalars['PositiveInt']['input']>;
};


export type UserTagsAssignedWithArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['PositiveInt']['input']>;
  last?: InputMaybe<Scalars['PositiveInt']['input']>;
  organizationId?: InputMaybe<Scalars['ID']['input']>;
};

export type UserAndOrganizationInput = {
  organizationId: Scalars['ID']['input'];
  userId: Scalars['ID']['input'];
};

export type UserConnection = {
  __typename?: 'UserConnection';
  aggregate: AggregateUser;
  edges: Array<Maybe<User>>;
  pageInfo: PageInfo;
};

export type UserCustomData = {
  __typename?: 'UserCustomData';
  _id: Scalars['ID']['output'];
  organizationId: Scalars['ID']['output'];
  userId: Scalars['ID']['output'];
  values: Scalars['JSON']['output'];
};

export type UserFamily = {
  __typename?: 'UserFamily';
  _id: Scalars['ID']['output'];
  admins: Array<User>;
  creator: User;
  title?: Maybe<Scalars['String']['output']>;
  users: Array<User>;
};

export type UserInput = {
  appLanguageCode?: InputMaybe<Scalars['String']['input']>;
  email: Scalars['EmailAddress']['input'];
  firstName: Scalars['String']['input'];
  lastName: Scalars['String']['input'];
  organizationUserBelongsToId?: InputMaybe<Scalars['ID']['input']>;
  password: Scalars['String']['input'];
};

export type UserOrderByInput =
  | 'appLanguageCode_ASC'
  | 'appLanguageCode_DESC'
  | 'email_ASC'
  | 'email_DESC'
  | 'firstName_ASC'
  | 'firstName_DESC'
  | 'id_ASC'
  | 'id_DESC'
  | 'lastName_ASC'
  | 'lastName_DESC';

export type UserPhone = {
  __typename?: 'UserPhone';
  home?: Maybe<Scalars['PhoneNumber']['output']>;
  mobile?: Maybe<Scalars['PhoneNumber']['output']>;
  work?: Maybe<Scalars['PhoneNumber']['output']>;
};

export type UserPhoneInput = {
  home?: InputMaybe<Scalars['PhoneNumber']['input']>;
  mobile?: InputMaybe<Scalars['PhoneNumber']['input']>;
  work?: InputMaybe<Scalars['PhoneNumber']['input']>;
};

export type UserTag = {
  __typename?: 'UserTag';
  /** A field to get the mongodb object id identifier for this UserTag. */
  _id: Scalars['ID']['output'];
  /**
   * A connection field to traverse a list of UserTag this UserTag is a
   * parent to.
   */
  childTags?: Maybe<UserTagsConnection>;
  /** A field to get the name of this UserTag. */
  name: Scalars['String']['output'];
  /** A field to traverse the Organization that created this UserTag. */
  organization?: Maybe<Organization>;
  /** A field to traverse the parent UserTag of this UserTag. */
  parentTag?: Maybe<UserTag>;
  /**
   * A connection field to traverse a list of User this UserTag is assigned
   * to.
   */
  usersAssignedTo?: Maybe<UsersConnection>;
};


export type UserTagChildTagsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['PositiveInt']['input']>;
  last?: InputMaybe<Scalars['PositiveInt']['input']>;
};


export type UserTagUsersAssignedToArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['PositiveInt']['input']>;
  last?: InputMaybe<Scalars['PositiveInt']['input']>;
};

/** A default connection on the UserTag type. */
export type UserTagsConnection = {
  __typename?: 'UserTagsConnection';
  edges: Array<UserTagsConnectionEdge>;
  pageInfo: DefaultConnectionPageInfo;
};

/** A default connection edge on the UserTag type for UserTagsConnection. */
export type UserTagsConnectionEdge = {
  __typename?: 'UserTagsConnectionEdge';
  cursor: Scalars['String']['output'];
  node: UserTag;
};

export type UserType =
  | 'ADMIN'
  | 'NON_USER'
  | 'SUPERADMIN'
  | 'USER';

export type UserWhereInput = {
  admin_for?: InputMaybe<Scalars['ID']['input']>;
  appLanguageCode?: InputMaybe<Scalars['String']['input']>;
  appLanguageCode_contains?: InputMaybe<Scalars['String']['input']>;
  appLanguageCode_in?: InputMaybe<Array<Scalars['String']['input']>>;
  appLanguageCode_not?: InputMaybe<Scalars['String']['input']>;
  appLanguageCode_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  appLanguageCode_starts_with?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['EmailAddress']['input']>;
  email_contains?: InputMaybe<Scalars['EmailAddress']['input']>;
  email_in?: InputMaybe<Array<Scalars['EmailAddress']['input']>>;
  email_not?: InputMaybe<Scalars['EmailAddress']['input']>;
  email_not_in?: InputMaybe<Array<Scalars['EmailAddress']['input']>>;
  email_starts_with?: InputMaybe<Scalars['EmailAddress']['input']>;
  event_title_contains?: InputMaybe<Scalars['String']['input']>;
  firstName?: InputMaybe<Scalars['String']['input']>;
  firstName_contains?: InputMaybe<Scalars['String']['input']>;
  firstName_in?: InputMaybe<Array<Scalars['String']['input']>>;
  firstName_not?: InputMaybe<Scalars['String']['input']>;
  firstName_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  firstName_starts_with?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['ID']['input']>;
  id_contains?: InputMaybe<Scalars['ID']['input']>;
  id_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_not?: InputMaybe<Scalars['ID']['input']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']['input']>>;
  id_starts_with?: InputMaybe<Scalars['ID']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  lastName_contains?: InputMaybe<Scalars['String']['input']>;
  lastName_in?: InputMaybe<Array<Scalars['String']['input']>>;
  lastName_not?: InputMaybe<Scalars['String']['input']>;
  lastName_not_in?: InputMaybe<Array<Scalars['String']['input']>>;
  lastName_starts_with?: InputMaybe<Scalars['String']['input']>;
};

/** A default connection on the User type. */
export type UsersConnection = {
  __typename?: 'UsersConnection';
  edges: Array<UsersConnectionEdge>;
  pageInfo: DefaultConnectionPageInfo;
};

/** A default connection edge on the User type for UsersConnection. */
export type UsersConnectionEdge = {
  __typename?: 'UsersConnectionEdge';
  cursor: Scalars['String']['output'];
  node: User;
};

export type Venue = {
  __typename?: 'Venue';
  _id: Scalars['ID']['output'];
  capacity: Scalars['Int']['output'];
  description?: Maybe<Scalars['String']['output']>;
  imageUrl?: Maybe<Scalars['URL']['output']>;
  name: Scalars['String']['output'];
  organization: Organization;
};

export type VenueInput = {
  capacity: Scalars['Int']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  file?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  organizationId: Scalars['ID']['input'];
};

export type WeekDays =
  | 'FR'
  | 'MO'
  | 'SA'
  | 'SU'
  | 'TH'
  | 'TU'
  | 'WE';

export type CreateChatInput = {
  organizationId: Scalars['ID']['input'];
  userIds: Array<Scalars['ID']['input']>;
};

export type CreateGroupChatInput = {
  organizationId: Scalars['ID']['input'];
  title: Scalars['String']['input'];
  userIds: Array<Scalars['ID']['input']>;
};

export type CreateUserFamilyInput = {
  title: Scalars['String']['input'];
  userIds: Array<Scalars['ID']['input']>;
};



export type ResolverTypeWrapper<T> = Promise<T> | T;

export type Resolver<TResult, TParent = {}, TContext = {}, TArgs = {}> = ResolverFn<TResult, TParent, TContext, TArgs>;

export type ResolverFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info?: GraphQLResolveInfo
) => Promise<TResult> | TResult;

export type SubscriptionSubscribeFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info?: GraphQLResolveInfo
) => AsyncIterable<TResult> | Promise<AsyncIterable<TResult>>;

export type SubscriptionResolveFn<TResult, TParent, TContext, TArgs> = (
  parent: TParent,
  args: TArgs,
  context: TContext,
  info?: GraphQLResolveInfo
) => TResult | Promise<TResult>;

export interface SubscriptionSubscriberObject<TResult, TKey extends string, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<{ [key in TKey]: TResult }, TParent, TContext, TArgs>;
  resolve?: SubscriptionResolveFn<TResult, { [key in TKey]: TResult }, TContext, TArgs>;
}

export interface SubscriptionResolverObject<TResult, TParent, TContext, TArgs> {
  subscribe: SubscriptionSubscribeFn<any, TParent, TContext, TArgs>;
  resolve: SubscriptionResolveFn<TResult, any, TContext, TArgs>;
}

export type SubscriptionObject<TResult, TKey extends string, TParent, TContext, TArgs> =
  | SubscriptionSubscriberObject<TResult, TKey, TParent, TContext, TArgs>
  | SubscriptionResolverObject<TResult, TParent, TContext, TArgs>;

export type SubscriptionResolver<TResult, TKey extends string, TParent = {}, TContext = {}, TArgs = {}> =
  | ((...args: any[]) => SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>)
  | SubscriptionObject<TResult, TKey, TParent, TContext, TArgs>;

export type TypeResolveFn<TTypes, TParent = {}, TContext = {}> = (
  parent: TParent,
  context: TContext,
  info?: GraphQLResolveInfo
) => Maybe<TTypes> | Promise<Maybe<TTypes>>;

export type IsTypeOfResolverFn<T = {}, TContext = {}> = (obj: T, context: TContext, info?: GraphQLResolveInfo) => boolean | Promise<boolean>;

export type NextResolverFn<T> = () => Promise<T>;

export type DirectiveResolverFn<TResult = {}, TParent = {}, TContext = {}, TArgs = {}> = (
  next: NextResolverFn<TResult>,
  parent: TParent,
  args: TArgs,
  context: TContext,
  info?: GraphQLResolveInfo
) => TResult | Promise<TResult>;

/** Mapping of union types */
export type ResolversUnionTypes<RefType extends Record<string, unknown>> = {
  ConnectionError: ( InvalidCursor ) | ( MaximumValueError );
};

/** Mapping of interface types */
export type ResolversInterfaceTypes<RefType extends Record<string, unknown>> = {
  ConnectionPageInfo: ( DefaultConnectionPageInfo );
  Error: ( UnauthenticatedError ) | ( UnauthorizedError );
  FieldError: ( InvalidCursor ) | ( MaximumLengthError ) | ( MaximumValueError ) | ( MinimumLengthError ) | ( MinimumValueError );
};

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  ActionItem: ResolverTypeWrapper<InterfaceActionItemModel>;
  ActionItemCategory: ResolverTypeWrapper<InterfaceActionItemCategoryModel>;
  ActionItemWhereInput: ActionItemWhereInput;
  ActionItemsOrderByInput: ActionItemsOrderByInput;
  Address: ResolverTypeWrapper<Address>;
  AddressInput: AddressInput;
  Advertisement: ResolverTypeWrapper<InterfaceAdvertisementModel>;
  AdvertisementEdge: ResolverTypeWrapper<Omit<AdvertisementEdge, 'node'> & { node?: Maybe<ResolversTypes['Advertisement']> }>;
  AdvertisementType: AdvertisementType;
  AdvertisementsConnection: ResolverTypeWrapper<Omit<AdvertisementsConnection, 'edges'> & { edges?: Maybe<Array<Maybe<ResolversTypes['AdvertisementEdge']>>> }>;
  AgendaCategory: ResolverTypeWrapper<InterfaceAgendaCategoryModel>;
  AgendaItem: ResolverTypeWrapper<InterfaceAgendaItemModel>;
  AggregatePost: ResolverTypeWrapper<AggregatePost>;
  AggregateUser: ResolverTypeWrapper<AggregateUser>;
  Any: ResolverTypeWrapper<Scalars['Any']['output']>;
  AuthData: ResolverTypeWrapper<Omit<AuthData, 'user'> & { user: ResolversTypes['User'] }>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']['output']>;
  CheckIn: ResolverTypeWrapper<InterfaceCheckInModel>;
  CheckInInput: CheckInInput;
  CheckInStatus: ResolverTypeWrapper<Omit<CheckInStatus, 'checkIn' | 'user'> & { checkIn?: Maybe<ResolversTypes['CheckIn']>, user: ResolversTypes['User'] }>;
  Comment: ResolverTypeWrapper<InterfaceCommentModel>;
  CommentInput: CommentInput;
  ConnectionError: ResolverTypeWrapper<ResolversUnionTypes<ResolversTypes>['ConnectionError']>;
  ConnectionPageInfo: ResolverTypeWrapper<ResolversInterfaceTypes<ResolversTypes>['ConnectionPageInfo']>;
  CountryCode: ResolverTypeWrapper<Scalars['CountryCode']['output']>;
  CreateActionItemInput: CreateActionItemInput;
  CreateAdvertisementInput: CreateAdvertisementInput;
  CreateAdvertisementPayload: ResolverTypeWrapper<Omit<CreateAdvertisementPayload, 'advertisement'> & { advertisement?: Maybe<ResolversTypes['Advertisement']> }>;
  CreateAgendaCategoryInput: CreateAgendaCategoryInput;
  CreateAgendaItemInput: CreateAgendaItemInput;
  CreateUserTagInput: CreateUserTagInput;
  Currency: Currency;
  CursorPaginationInput: CursorPaginationInput;
  Date: ResolverTypeWrapper<Scalars['Date']['output']>;
  DateTime: ResolverTypeWrapper<Scalars['DateTime']['output']>;
  DefaultConnectionPageInfo: ResolverTypeWrapper<DefaultConnectionPageInfo>;
  DeleteAdvertisementPayload: ResolverTypeWrapper<Omit<DeleteAdvertisementPayload, 'advertisement'> & { advertisement?: Maybe<ResolversTypes['Advertisement']> }>;
  DeletePayload: ResolverTypeWrapper<DeletePayload>;
  DirectChat: ResolverTypeWrapper<InterfaceDirectChatModel>;
  DirectChatMessage: ResolverTypeWrapper<InterfaceDirectChatMessageModel>;
  Donation: ResolverTypeWrapper<InterfaceDonationModel>;
  DonationWhereInput: DonationWhereInput;
  EditVenueInput: EditVenueInput;
  EducationGrade: EducationGrade;
  EmailAddress: ResolverTypeWrapper<Scalars['EmailAddress']['output']>;
  EmploymentStatus: EmploymentStatus;
  Error: ResolverTypeWrapper<ResolversInterfaceTypes<ResolversTypes>['Error']>;
  Event: ResolverTypeWrapper<InterfaceEventModel>;
  EventAttendee: ResolverTypeWrapper<InterfaceEventAttendeeModel>;
  EventAttendeeInput: EventAttendeeInput;
  EventInput: EventInput;
  EventOrderByInput: EventOrderByInput;
  EventVolunteer: ResolverTypeWrapper<InterfaceEventVolunteerModel>;
  EventVolunteerInput: EventVolunteerInput;
  EventVolunteerResponse: EventVolunteerResponse;
  EventWhereInput: EventWhereInput;
  ExtendSession: ResolverTypeWrapper<ExtendSession>;
  Feedback: ResolverTypeWrapper<InterfaceFeedbackModel>;
  FeedbackInput: FeedbackInput;
  FieldError: ResolverTypeWrapper<ResolversInterfaceTypes<ResolversTypes>['FieldError']>;
  Float: ResolverTypeWrapper<Scalars['Float']['output']>;
  ForgotPasswordData: ForgotPasswordData;
  Frequency: Frequency;
  Fund: ResolverTypeWrapper<InterfaceFundModel>;
  FundCampaignInput: FundCampaignInput;
  FundCampaignPledgeInput: FundCampaignPledgeInput;
  FundInput: FundInput;
  FundraisingCampaign: ResolverTypeWrapper<InterfaceFundraisingCampaignModel>;
  FundraisingCampaignPledge: ResolverTypeWrapper<InterfaceFundraisingCampaignPledgesModel>;
  Gender: Gender;
  Group: ResolverTypeWrapper<InterfaceGroupModel>;
  GroupChat: ResolverTypeWrapper<InterfaceGroupChatModel>;
  GroupChatMessage: ResolverTypeWrapper<InterfaceGroupChatMessageModel>;
  ID: ResolverTypeWrapper<Scalars['ID']['output']>;
  Int: ResolverTypeWrapper<Scalars['Int']['output']>;
  InvalidCursor: ResolverTypeWrapper<InvalidCursor>;
  ItemType: ItemType;
  JSON: ResolverTypeWrapper<Scalars['JSON']['output']>;
  Language: ResolverTypeWrapper<InterfaceLanguageModel>;
  LanguageInput: LanguageInput;
  LanguageModel: ResolverTypeWrapper<LanguageModel>;
  Latitude: ResolverTypeWrapper<Scalars['Latitude']['output']>;
  LoginInput: LoginInput;
  Longitude: ResolverTypeWrapper<Scalars['Longitude']['output']>;
  MaritalStatus: MaritalStatus;
  MaximumLengthError: ResolverTypeWrapper<MaximumLengthError>;
  MaximumValueError: ResolverTypeWrapper<MaximumValueError>;
  MembershipRequest: ResolverTypeWrapper<InterfaceMembershipRequestModel>;
  Message: ResolverTypeWrapper<InterfaceMessageModel>;
  MessageChat: ResolverTypeWrapper<InterfaceMessageChatModel>;
  MessageChatInput: MessageChatInput;
  MinimumLengthError: ResolverTypeWrapper<MinimumLengthError>;
  MinimumValueError: ResolverTypeWrapper<MinimumValueError>;
  Mutation: ResolverTypeWrapper<{}>;
  OTPInput: OtpInput;
  Organization: ResolverTypeWrapper<InterfaceOrganizationModel>;
  OrganizationCustomField: ResolverTypeWrapper<OrganizationCustomField>;
  OrganizationInfoNode: ResolverTypeWrapper<Omit<OrganizationInfoNode, 'creator'> & { creator?: Maybe<ResolversTypes['User']> }>;
  OrganizationInput: OrganizationInput;
  OrganizationOrderByInput: OrganizationOrderByInput;
  OrganizationWhereInput: OrganizationWhereInput;
  OtpData: ResolverTypeWrapper<OtpData>;
  PageInfo: ResolverTypeWrapper<PageInfo>;
  PaginationDirection: PaginationDirection;
  PhoneNumber: ResolverTypeWrapper<Scalars['PhoneNumber']['output']>;
  Plugin: ResolverTypeWrapper<InterfacePluginModel>;
  PluginField: ResolverTypeWrapper<InterfacePluginFieldModel>;
  PluginFieldInput: PluginFieldInput;
  PluginInput: PluginInput;
  PositiveInt: ResolverTypeWrapper<Scalars['PositiveInt']['output']>;
  Post: ResolverTypeWrapper<InterfacePostModel>;
  PostEdge: ResolverTypeWrapper<Omit<PostEdge, 'node'> & { node: ResolversTypes['Post'] }>;
  PostInput: PostInput;
  PostOrderByInput: PostOrderByInput;
  PostUpdateInput: PostUpdateInput;
  PostWhereInput: PostWhereInput;
  PostsConnection: ResolverTypeWrapper<Omit<PostsConnection, 'edges'> & { edges: Array<ResolversTypes['PostEdge']> }>;
  Query: ResolverTypeWrapper<{}>;
  RecaptchaVerification: RecaptchaVerification;
  Recurrance: Recurrance;
  RecurrenceRuleInput: RecurrenceRuleInput;
  RecurringEventMutationType: RecurringEventMutationType;
  SortedByOrder: SortedByOrder;
  Status: Status;
  String: ResolverTypeWrapper<Scalars['String']['output']>;
  Subscription: ResolverTypeWrapper<{}>;
  Time: ResolverTypeWrapper<Scalars['Time']['output']>;
  ToggleUserTagAssignInput: ToggleUserTagAssignInput;
  Translation: ResolverTypeWrapper<Translation>;
  Type: Type;
  URL: ResolverTypeWrapper<Scalars['URL']['output']>;
  UnauthenticatedError: ResolverTypeWrapper<UnauthenticatedError>;
  UnauthorizedError: ResolverTypeWrapper<UnauthorizedError>;
  UpdateActionItemCategoryInput: UpdateActionItemCategoryInput;
  UpdateActionItemInput: UpdateActionItemInput;
  UpdateAdvertisementInput: UpdateAdvertisementInput;
  UpdateAdvertisementPayload: ResolverTypeWrapper<Omit<UpdateAdvertisementPayload, 'advertisement'> & { advertisement?: Maybe<ResolversTypes['Advertisement']> }>;
  UpdateAgendaCategoryInput: UpdateAgendaCategoryInput;
  UpdateAgendaItemInput: UpdateAgendaItemInput;
  UpdateEventInput: UpdateEventInput;
  UpdateEventVolunteerInput: UpdateEventVolunteerInput;
  UpdateFundCampaignInput: UpdateFundCampaignInput;
  UpdateFundCampaignPledgeInput: UpdateFundCampaignPledgeInput;
  UpdateFundInput: UpdateFundInput;
  UpdateOrganizationInput: UpdateOrganizationInput;
  UpdateUserInput: UpdateUserInput;
  UpdateUserPasswordInput: UpdateUserPasswordInput;
  UpdateUserTagInput: UpdateUserTagInput;
  UpdateUserTypeInput: UpdateUserTypeInput;
  Upload: ResolverTypeWrapper<Scalars['Upload']['output']>;
  User: ResolverTypeWrapper<InterfaceUserModel>;
  UserAndOrganizationInput: UserAndOrganizationInput;
  UserConnection: ResolverTypeWrapper<Omit<UserConnection, 'edges'> & { edges: Array<Maybe<ResolversTypes['User']>> }>;
  UserCustomData: ResolverTypeWrapper<UserCustomData>;
  UserFamily: ResolverTypeWrapper<InterfaceUserFamilyModel>;
  UserInput: UserInput;
  UserOrderByInput: UserOrderByInput;
  UserPhone: ResolverTypeWrapper<UserPhone>;
  UserPhoneInput: UserPhoneInput;
  UserTag: ResolverTypeWrapper<InterfaceOrganizationTagUserModel>;
  UserTagsConnection: ResolverTypeWrapper<Omit<UserTagsConnection, 'edges'> & { edges: Array<ResolversTypes['UserTagsConnectionEdge']> }>;
  UserTagsConnectionEdge: ResolverTypeWrapper<Omit<UserTagsConnectionEdge, 'node'> & { node: ResolversTypes['UserTag'] }>;
  UserType: UserType;
  UserWhereInput: UserWhereInput;
  UsersConnection: ResolverTypeWrapper<Omit<UsersConnection, 'edges'> & { edges: Array<ResolversTypes['UsersConnectionEdge']> }>;
  UsersConnectionEdge: ResolverTypeWrapper<Omit<UsersConnectionEdge, 'node'> & { node: ResolversTypes['User'] }>;
  Venue: ResolverTypeWrapper<Omit<Venue, 'organization'> & { organization: ResolversTypes['Organization'] }>;
  VenueInput: VenueInput;
  WeekDays: WeekDays;
  createChatInput: CreateChatInput;
  createGroupChatInput: CreateGroupChatInput;
  createUserFamilyInput: CreateUserFamilyInput;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  ActionItem: InterfaceActionItemModel;
  ActionItemCategory: InterfaceActionItemCategoryModel;
  ActionItemWhereInput: ActionItemWhereInput;
  Address: Address;
  AddressInput: AddressInput;
  Advertisement: InterfaceAdvertisementModel;
  AdvertisementEdge: Omit<AdvertisementEdge, 'node'> & { node?: Maybe<ResolversParentTypes['Advertisement']> };
  AdvertisementsConnection: Omit<AdvertisementsConnection, 'edges'> & { edges?: Maybe<Array<Maybe<ResolversParentTypes['AdvertisementEdge']>>> };
  AgendaCategory: InterfaceAgendaCategoryModel;
  AgendaItem: InterfaceAgendaItemModel;
  AggregatePost: AggregatePost;
  AggregateUser: AggregateUser;
  Any: Scalars['Any']['output'];
  AuthData: Omit<AuthData, 'user'> & { user: ResolversParentTypes['User'] };
  Boolean: Scalars['Boolean']['output'];
  CheckIn: InterfaceCheckInModel;
  CheckInInput: CheckInInput;
  CheckInStatus: Omit<CheckInStatus, 'checkIn' | 'user'> & { checkIn?: Maybe<ResolversParentTypes['CheckIn']>, user: ResolversParentTypes['User'] };
  Comment: InterfaceCommentModel;
  CommentInput: CommentInput;
  ConnectionError: ResolversUnionTypes<ResolversParentTypes>['ConnectionError'];
  ConnectionPageInfo: ResolversInterfaceTypes<ResolversParentTypes>['ConnectionPageInfo'];
  CountryCode: Scalars['CountryCode']['output'];
  CreateActionItemInput: CreateActionItemInput;
  CreateAdvertisementInput: CreateAdvertisementInput;
  CreateAdvertisementPayload: Omit<CreateAdvertisementPayload, 'advertisement'> & { advertisement?: Maybe<ResolversParentTypes['Advertisement']> };
  CreateAgendaCategoryInput: CreateAgendaCategoryInput;
  CreateAgendaItemInput: CreateAgendaItemInput;
  CreateUserTagInput: CreateUserTagInput;
  CursorPaginationInput: CursorPaginationInput;
  Date: Scalars['Date']['output'];
  DateTime: Scalars['DateTime']['output'];
  DefaultConnectionPageInfo: DefaultConnectionPageInfo;
  DeleteAdvertisementPayload: Omit<DeleteAdvertisementPayload, 'advertisement'> & { advertisement?: Maybe<ResolversParentTypes['Advertisement']> };
  DeletePayload: DeletePayload;
  DirectChat: InterfaceDirectChatModel;
  DirectChatMessage: InterfaceDirectChatMessageModel;
  Donation: InterfaceDonationModel;
  DonationWhereInput: DonationWhereInput;
  EditVenueInput: EditVenueInput;
  EmailAddress: Scalars['EmailAddress']['output'];
  Error: ResolversInterfaceTypes<ResolversParentTypes>['Error'];
  Event: InterfaceEventModel;
  EventAttendee: InterfaceEventAttendeeModel;
  EventAttendeeInput: EventAttendeeInput;
  EventInput: EventInput;
  EventVolunteer: InterfaceEventVolunteerModel;
  EventVolunteerInput: EventVolunteerInput;
  EventWhereInput: EventWhereInput;
  ExtendSession: ExtendSession;
  Feedback: InterfaceFeedbackModel;
  FeedbackInput: FeedbackInput;
  FieldError: ResolversInterfaceTypes<ResolversParentTypes>['FieldError'];
  Float: Scalars['Float']['output'];
  ForgotPasswordData: ForgotPasswordData;
  Fund: InterfaceFundModel;
  FundCampaignInput: FundCampaignInput;
  FundCampaignPledgeInput: FundCampaignPledgeInput;
  FundInput: FundInput;
  FundraisingCampaign: InterfaceFundraisingCampaignModel;
  FundraisingCampaignPledge: InterfaceFundraisingCampaignPledgesModel;
  Group: InterfaceGroupModel;
  GroupChat: InterfaceGroupChatModel;
  GroupChatMessage: InterfaceGroupChatMessageModel;
  ID: Scalars['ID']['output'];
  Int: Scalars['Int']['output'];
  InvalidCursor: InvalidCursor;
  JSON: Scalars['JSON']['output'];
  Language: InterfaceLanguageModel;
  LanguageInput: LanguageInput;
  LanguageModel: LanguageModel;
  Latitude: Scalars['Latitude']['output'];
  LoginInput: LoginInput;
  Longitude: Scalars['Longitude']['output'];
  MaximumLengthError: MaximumLengthError;
  MaximumValueError: MaximumValueError;
  MembershipRequest: InterfaceMembershipRequestModel;
  Message: InterfaceMessageModel;
  MessageChat: InterfaceMessageChatModel;
  MessageChatInput: MessageChatInput;
  MinimumLengthError: MinimumLengthError;
  MinimumValueError: MinimumValueError;
  Mutation: {};
  OTPInput: OtpInput;
  Organization: InterfaceOrganizationModel;
  OrganizationCustomField: OrganizationCustomField;
  OrganizationInfoNode: Omit<OrganizationInfoNode, 'creator'> & { creator?: Maybe<ResolversParentTypes['User']> };
  OrganizationInput: OrganizationInput;
  OrganizationWhereInput: OrganizationWhereInput;
  OtpData: OtpData;
  PageInfo: PageInfo;
  PhoneNumber: Scalars['PhoneNumber']['output'];
  Plugin: InterfacePluginModel;
  PluginField: InterfacePluginFieldModel;
  PluginFieldInput: PluginFieldInput;
  PluginInput: PluginInput;
  PositiveInt: Scalars['PositiveInt']['output'];
  Post: InterfacePostModel;
  PostEdge: Omit<PostEdge, 'node'> & { node: ResolversParentTypes['Post'] };
  PostInput: PostInput;
  PostUpdateInput: PostUpdateInput;
  PostWhereInput: PostWhereInput;
  PostsConnection: Omit<PostsConnection, 'edges'> & { edges: Array<ResolversParentTypes['PostEdge']> };
  Query: {};
  RecaptchaVerification: RecaptchaVerification;
  RecurrenceRuleInput: RecurrenceRuleInput;
  String: Scalars['String']['output'];
  Subscription: {};
  Time: Scalars['Time']['output'];
  ToggleUserTagAssignInput: ToggleUserTagAssignInput;
  Translation: Translation;
  URL: Scalars['URL']['output'];
  UnauthenticatedError: UnauthenticatedError;
  UnauthorizedError: UnauthorizedError;
  UpdateActionItemCategoryInput: UpdateActionItemCategoryInput;
  UpdateActionItemInput: UpdateActionItemInput;
  UpdateAdvertisementInput: UpdateAdvertisementInput;
  UpdateAdvertisementPayload: Omit<UpdateAdvertisementPayload, 'advertisement'> & { advertisement?: Maybe<ResolversParentTypes['Advertisement']> };
  UpdateAgendaCategoryInput: UpdateAgendaCategoryInput;
  UpdateAgendaItemInput: UpdateAgendaItemInput;
  UpdateEventInput: UpdateEventInput;
  UpdateEventVolunteerInput: UpdateEventVolunteerInput;
  UpdateFundCampaignInput: UpdateFundCampaignInput;
  UpdateFundCampaignPledgeInput: UpdateFundCampaignPledgeInput;
  UpdateFundInput: UpdateFundInput;
  UpdateOrganizationInput: UpdateOrganizationInput;
  UpdateUserInput: UpdateUserInput;
  UpdateUserPasswordInput: UpdateUserPasswordInput;
  UpdateUserTagInput: UpdateUserTagInput;
  UpdateUserTypeInput: UpdateUserTypeInput;
  Upload: Scalars['Upload']['output'];
  User: InterfaceUserModel;
  UserAndOrganizationInput: UserAndOrganizationInput;
  UserConnection: Omit<UserConnection, 'edges'> & { edges: Array<Maybe<ResolversParentTypes['User']>> };
  UserCustomData: UserCustomData;
  UserFamily: InterfaceUserFamilyModel;
  UserInput: UserInput;
  UserPhone: UserPhone;
  UserPhoneInput: UserPhoneInput;
  UserTag: InterfaceOrganizationTagUserModel;
  UserTagsConnection: Omit<UserTagsConnection, 'edges'> & { edges: Array<ResolversParentTypes['UserTagsConnectionEdge']> };
  UserTagsConnectionEdge: Omit<UserTagsConnectionEdge, 'node'> & { node: ResolversParentTypes['UserTag'] };
  UserWhereInput: UserWhereInput;
  UsersConnection: Omit<UsersConnection, 'edges'> & { edges: Array<ResolversParentTypes['UsersConnectionEdge']> };
  UsersConnectionEdge: Omit<UsersConnectionEdge, 'node'> & { node: ResolversParentTypes['User'] };
  Venue: Omit<Venue, 'organization'> & { organization: ResolversParentTypes['Organization'] };
  VenueInput: VenueInput;
  createChatInput: CreateChatInput;
  createGroupChatInput: CreateGroupChatInput;
  createUserFamilyInput: CreateUserFamilyInput;
};

export type AuthDirectiveArgs = { };

export type AuthDirectiveResolver<Result, Parent, ContextType = any, Args = AuthDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type RoleDirectiveArgs = {
  requires?: Maybe<UserType>;
};

export type RoleDirectiveResolver<Result, Parent, ContextType = any, Args = RoleDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type ActionItemResolvers<ContextType = any, ParentType extends ResolversParentTypes['ActionItem'] = ResolversParentTypes['ActionItem']> = {
  _id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  actionItemCategory?: Resolver<Maybe<ResolversTypes['ActionItemCategory']>, ParentType, ContextType>;
  assignee?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  assigner?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  assignmentDate?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  completionDate?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  creator?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  dueDate?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  event?: Resolver<Maybe<ResolversTypes['Event']>, ParentType, ContextType>;
  isCompleted?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  postCompletionNotes?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  preCompletionNotes?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ActionItemCategoryResolvers<ContextType = any, ParentType extends ResolversParentTypes['ActionItemCategory'] = ResolversParentTypes['ActionItemCategory']> = {
  _id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  creator?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  isDisabled?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  organization?: Resolver<Maybe<ResolversTypes['Organization']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AddressResolvers<ContextType = any, ParentType extends ResolversParentTypes['Address'] = ResolversParentTypes['Address']> = {
  city?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  countryCode?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  dependentLocality?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  line1?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  line2?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  postalCode?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  sortingCode?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  state?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AdvertisementResolvers<ContextType = any, ParentType extends ResolversParentTypes['Advertisement'] = ResolversParentTypes['Advertisement']> = {
  _id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  creator?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  endDate?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  mediaUrl?: Resolver<ResolversTypes['URL'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  organization?: Resolver<Maybe<ResolversTypes['Organization']>, ParentType, ContextType>;
  startDate?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['AdvertisementType'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AdvertisementEdgeResolvers<ContextType = any, ParentType extends ResolversParentTypes['AdvertisementEdge'] = ResolversParentTypes['AdvertisementEdge']> = {
  cursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  node?: Resolver<Maybe<ResolversTypes['Advertisement']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AdvertisementsConnectionResolvers<ContextType = any, ParentType extends ResolversParentTypes['AdvertisementsConnection'] = ResolversParentTypes['AdvertisementsConnection']> = {
  edges?: Resolver<Maybe<Array<Maybe<ResolversTypes['AdvertisementEdge']>>>, ParentType, ContextType>;
  pageInfo?: Resolver<Maybe<ResolversTypes['ConnectionPageInfo']>, ParentType, ContextType>;
  totalCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AgendaCategoryResolvers<ContextType = any, ParentType extends ResolversParentTypes['AgendaCategory'] = ResolversParentTypes['AgendaCategory']> = {
  _id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  createdBy?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  organization?: Resolver<ResolversTypes['Organization'], ParentType, ContextType>;
  updatedAt?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  updatedBy?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AgendaItemResolvers<ContextType = any, ParentType extends ResolversParentTypes['AgendaItem'] = ResolversParentTypes['AgendaItem']> = {
  _id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  attachments?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  categories?: Resolver<Maybe<Array<Maybe<ResolversTypes['AgendaCategory']>>>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  createdBy?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  duration?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  isNote?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  itemType?: Resolver<ResolversTypes['ItemType'], ParentType, ContextType>;
  organization?: Resolver<ResolversTypes['Organization'], ParentType, ContextType>;
  relatedEvent?: Resolver<Maybe<ResolversTypes['Event']>, ParentType, ContextType>;
  sequence?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  updatedBy?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  urls?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  user?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AggregatePostResolvers<ContextType = any, ParentType extends ResolversParentTypes['AggregatePost'] = ResolversParentTypes['AggregatePost']> = {
  count?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AggregateUserResolvers<ContextType = any, ParentType extends ResolversParentTypes['AggregateUser'] = ResolversParentTypes['AggregateUser']> = {
  count?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface AnyScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Any'], any> {
  name: 'Any';
}

export type AuthDataResolvers<ContextType = any, ParentType extends ResolversParentTypes['AuthData'] = ResolversParentTypes['AuthData']> = {
  accessToken?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  refreshToken?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CheckInResolvers<ContextType = any, ParentType extends ResolversParentTypes['CheckIn'] = ResolversParentTypes['CheckIn']> = {
  _id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  event?: Resolver<ResolversTypes['Event'], ParentType, ContextType>;
  feedbackSubmitted?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  time?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CheckInStatusResolvers<ContextType = any, ParentType extends ResolversParentTypes['CheckInStatus'] = ResolversParentTypes['CheckInStatus']> = {
  _id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  checkIn?: Resolver<Maybe<ResolversTypes['CheckIn']>, ParentType, ContextType>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CommentResolvers<ContextType = any, ParentType extends ResolversParentTypes['Comment'] = ResolversParentTypes['Comment']> = {
  _id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  creator?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  likeCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  likedBy?: Resolver<Maybe<Array<Maybe<ResolversTypes['User']>>>, ParentType, ContextType>;
  post?: Resolver<ResolversTypes['Post'], ParentType, ContextType>;
  text?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ConnectionErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['ConnectionError'] = ResolversParentTypes['ConnectionError']> = {
  __resolveType: TypeResolveFn<'InvalidCursor' | 'MaximumValueError', ParentType, ContextType>;
};

export type ConnectionPageInfoResolvers<ContextType = any, ParentType extends ResolversParentTypes['ConnectionPageInfo'] = ResolversParentTypes['ConnectionPageInfo']> = {
  __resolveType: TypeResolveFn<'DefaultConnectionPageInfo', ParentType, ContextType>;
  endCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  hasNextPage?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  hasPreviousPage?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  startCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
};

export interface CountryCodeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['CountryCode'], any> {
  name: 'CountryCode';
}

export type CreateAdvertisementPayloadResolvers<ContextType = any, ParentType extends ResolversParentTypes['CreateAdvertisementPayload'] = ResolversParentTypes['CreateAdvertisementPayload']> = {
  advertisement?: Resolver<Maybe<ResolversTypes['Advertisement']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface DateScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Date'], any> {
  name: 'Date';
}

export interface DateTimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['DateTime'], any> {
  name: 'DateTime';
}

export type DefaultConnectionPageInfoResolvers<ContextType = any, ParentType extends ResolversParentTypes['DefaultConnectionPageInfo'] = ResolversParentTypes['DefaultConnectionPageInfo']> = {
  endCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  hasNextPage?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  hasPreviousPage?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  startCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type DeleteAdvertisementPayloadResolvers<ContextType = any, ParentType extends ResolversParentTypes['DeleteAdvertisementPayload'] = ResolversParentTypes['DeleteAdvertisementPayload']> = {
  advertisement?: Resolver<Maybe<ResolversTypes['Advertisement']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type DeletePayloadResolvers<ContextType = any, ParentType extends ResolversParentTypes['DeletePayload'] = ResolversParentTypes['DeletePayload']> = {
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type DirectChatResolvers<ContextType = any, ParentType extends ResolversParentTypes['DirectChat'] = ResolversParentTypes['DirectChat']> = {
  _id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  creator?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  messages?: Resolver<Maybe<Array<Maybe<ResolversTypes['DirectChatMessage']>>>, ParentType, ContextType>;
  organization?: Resolver<ResolversTypes['Organization'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  users?: Resolver<Array<ResolversTypes['User']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type DirectChatMessageResolvers<ContextType = any, ParentType extends ResolversParentTypes['DirectChatMessage'] = ResolversParentTypes['DirectChatMessage']> = {
  _id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  directChatMessageBelongsTo?: Resolver<ResolversTypes['DirectChat'], ParentType, ContextType>;
  messageContent?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  receiver?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  sender?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type DonationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Donation'] = ResolversParentTypes['Donation']> = {
  _id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  amount?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  nameOfOrg?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  nameOfUser?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  orgId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  payPalId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface EmailAddressScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['EmailAddress'], any> {
  name: 'EmailAddress';
}

export type ErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['Error'] = ResolversParentTypes['Error']> = {
  __resolveType: TypeResolveFn<'UnauthenticatedError' | 'UnauthorizedError', ParentType, ContextType>;
  message?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
};

export type EventResolvers<ContextType = any, ParentType extends ResolversParentTypes['Event'] = ResolversParentTypes['Event']> = {
  _id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  actionItems?: Resolver<Maybe<Array<Maybe<ResolversTypes['ActionItem']>>>, ParentType, ContextType>;
  admins?: Resolver<Maybe<Array<ResolversTypes['User']>>, ParentType, ContextType, Partial<EventAdminsArgs>>;
  agendaItems?: Resolver<Maybe<Array<Maybe<ResolversTypes['AgendaItem']>>>, ParentType, ContextType>;
  allDay?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  attendees?: Resolver<Maybe<Array<Maybe<ResolversTypes['User']>>>, ParentType, ContextType>;
  attendeesCheckInStatus?: Resolver<Array<ResolversTypes['CheckInStatus']>, ParentType, ContextType>;
  averageFeedbackScore?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  creator?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  endDate?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  endTime?: Resolver<Maybe<ResolversTypes['Time']>, ParentType, ContextType>;
  feedback?: Resolver<Array<ResolversTypes['Feedback']>, ParentType, ContextType>;
  images?: Resolver<Maybe<Array<Maybe<ResolversTypes['String']>>>, ParentType, ContextType>;
  isPublic?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isRegisterable?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  latitude?: Resolver<Maybe<ResolversTypes['Latitude']>, ParentType, ContextType>;
  location?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  longitude?: Resolver<Maybe<ResolversTypes['Longitude']>, ParentType, ContextType>;
  organization?: Resolver<Maybe<ResolversTypes['Organization']>, ParentType, ContextType>;
  recurrance?: Resolver<Maybe<ResolversTypes['Recurrance']>, ParentType, ContextType>;
  recurring?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  startDate?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  startTime?: Resolver<Maybe<ResolversTypes['Time']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['Status'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type EventAttendeeResolvers<ContextType = any, ParentType extends ResolversParentTypes['EventAttendee'] = ResolversParentTypes['EventAttendee']> = {
  _id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  checkInId?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  eventId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  isCheckedIn?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isCheckedOut?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isInvited?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isRegistered?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type EventVolunteerResolvers<ContextType = any, ParentType extends ResolversParentTypes['EventVolunteer'] = ResolversParentTypes['EventVolunteer']> = {
  _id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  creator?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  event?: Resolver<Maybe<ResolversTypes['Event']>, ParentType, ContextType>;
  isAssigned?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  isInvited?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  response?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ExtendSessionResolvers<ContextType = any, ParentType extends ResolversParentTypes['ExtendSession'] = ResolversParentTypes['ExtendSession']> = {
  accessToken?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  refreshToken?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type FeedbackResolvers<ContextType = any, ParentType extends ResolversParentTypes['Feedback'] = ResolversParentTypes['Feedback']> = {
  _id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  event?: Resolver<ResolversTypes['Event'], ParentType, ContextType>;
  rating?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  review?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type FieldErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['FieldError'] = ResolversParentTypes['FieldError']> = {
  __resolveType: TypeResolveFn<'InvalidCursor' | 'MaximumLengthError' | 'MaximumValueError' | 'MinimumLengthError' | 'MinimumValueError', ParentType, ContextType>;
  message?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  path?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
};

export type FundResolvers<ContextType = any, ParentType extends ResolversParentTypes['Fund'] = ResolversParentTypes['Fund']> = {
  _id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  campaigns?: Resolver<Maybe<Array<ResolversTypes['FundraisingCampaign']>>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  isArchived?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isDefault?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  organizationId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  refrenceNumber?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  taxDeductible?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type FundraisingCampaignResolvers<ContextType = any, ParentType extends ResolversParentTypes['FundraisingCampaign'] = ResolversParentTypes['FundraisingCampaign']> = {
  _id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  currency?: Resolver<ResolversTypes['Currency'], ParentType, ContextType>;
  endDate?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  fundId?: Resolver<ResolversTypes['Fund'], ParentType, ContextType>;
  fundingGoal?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  pledges?: Resolver<Maybe<Array<Maybe<ResolversTypes['FundraisingCampaignPledge']>>>, ParentType, ContextType>;
  startDate?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type FundraisingCampaignPledgeResolvers<ContextType = any, ParentType extends ResolversParentTypes['FundraisingCampaignPledge'] = ResolversParentTypes['FundraisingCampaignPledge']> = {
  _id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  amount?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  campaigns?: Resolver<Array<Maybe<ResolversTypes['FundraisingCampaign']>>, ParentType, ContextType>;
  currency?: Resolver<ResolversTypes['Currency'], ParentType, ContextType>;
  endDate?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  startDate?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  users?: Resolver<Array<Maybe<ResolversTypes['User']>>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type GroupResolvers<ContextType = any, ParentType extends ResolversParentTypes['Group'] = ResolversParentTypes['Group']> = {
  _id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  admins?: Resolver<Array<ResolversTypes['User']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  organization?: Resolver<ResolversTypes['Organization'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type GroupChatResolvers<ContextType = any, ParentType extends ResolversParentTypes['GroupChat'] = ResolversParentTypes['GroupChat']> = {
  _id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  creator?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  messages?: Resolver<Maybe<Array<Maybe<ResolversTypes['GroupChatMessage']>>>, ParentType, ContextType>;
  organization?: Resolver<ResolversTypes['Organization'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  users?: Resolver<Array<ResolversTypes['User']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type GroupChatMessageResolvers<ContextType = any, ParentType extends ResolversParentTypes['GroupChatMessage'] = ResolversParentTypes['GroupChatMessage']> = {
  _id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  groupChatMessageBelongsTo?: Resolver<ResolversTypes['GroupChat'], ParentType, ContextType>;
  messageContent?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  sender?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type InvalidCursorResolvers<ContextType = any, ParentType extends ResolversParentTypes['InvalidCursor'] = ResolversParentTypes['InvalidCursor']> = {
  message?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  path?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface JsonScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['JSON'], any> {
  name: 'JSON';
}

export type LanguageResolvers<ContextType = any, ParentType extends ResolversParentTypes['Language'] = ResolversParentTypes['Language']> = {
  _id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  en?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  translation?: Resolver<Maybe<Array<Maybe<ResolversTypes['LanguageModel']>>>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type LanguageModelResolvers<ContextType = any, ParentType extends ResolversParentTypes['LanguageModel'] = ResolversParentTypes['LanguageModel']> = {
  _id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  lang_code?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  value?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  verified?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface LatitudeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Latitude'], any> {
  name: 'Latitude';
}

export interface LongitudeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Longitude'], any> {
  name: 'Longitude';
}

export type MaximumLengthErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['MaximumLengthError'] = ResolversParentTypes['MaximumLengthError']> = {
  message?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  path?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MaximumValueErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['MaximumValueError'] = ResolversParentTypes['MaximumValueError']> = {
  limit?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  message?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  path?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MembershipRequestResolvers<ContextType = any, ParentType extends ResolversParentTypes['MembershipRequest'] = ResolversParentTypes['MembershipRequest']> = {
  _id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  organization?: Resolver<ResolversTypes['Organization'], ParentType, ContextType>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MessageResolvers<ContextType = any, ParentType extends ResolversParentTypes['Message'] = ResolversParentTypes['Message']> = {
  _id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  creator?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  imageUrl?: Resolver<Maybe<ResolversTypes['URL']>, ParentType, ContextType>;
  text?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  videoUrl?: Resolver<Maybe<ResolversTypes['URL']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MessageChatResolvers<ContextType = any, ParentType extends ResolversParentTypes['MessageChat'] = ResolversParentTypes['MessageChat']> = {
  _id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  languageBarrier?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  message?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  receiver?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  sender?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MinimumLengthErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['MinimumLengthError'] = ResolversParentTypes['MinimumLengthError']> = {
  limit?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  message?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  path?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MinimumValueErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['MinimumValueError'] = ResolversParentTypes['MinimumValueError']> = {
  message?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  path?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MutationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  acceptAdmin?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationAcceptAdminArgs, 'id'>>;
  acceptMembershipRequest?: Resolver<ResolversTypes['MembershipRequest'], ParentType, ContextType, RequireFields<MutationAcceptMembershipRequestArgs, 'membershipRequestId'>>;
  addEventAttendee?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationAddEventAttendeeArgs, 'data'>>;
  addFeedback?: Resolver<ResolversTypes['Feedback'], ParentType, ContextType, RequireFields<MutationAddFeedbackArgs, 'data'>>;
  addLanguageTranslation?: Resolver<ResolversTypes['Language'], ParentType, ContextType, RequireFields<MutationAddLanguageTranslationArgs, 'data'>>;
  addOrganizationCustomField?: Resolver<ResolversTypes['OrganizationCustomField'], ParentType, ContextType, RequireFields<MutationAddOrganizationCustomFieldArgs, 'name' | 'organizationId' | 'type'>>;
  addOrganizationImage?: Resolver<ResolversTypes['Organization'], ParentType, ContextType, RequireFields<MutationAddOrganizationImageArgs, 'file' | 'organizationId'>>;
  addPledgeToFundraisingCampaign?: Resolver<ResolversTypes['FundraisingCampaignPledge'], ParentType, ContextType, RequireFields<MutationAddPledgeToFundraisingCampaignArgs, 'campaignId' | 'pledgeId'>>;
  addUserCustomData?: Resolver<ResolversTypes['UserCustomData'], ParentType, ContextType, RequireFields<MutationAddUserCustomDataArgs, 'dataName' | 'dataValue' | 'organizationId'>>;
  addUserImage?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationAddUserImageArgs, 'file'>>;
  addUserToGroupChat?: Resolver<ResolversTypes['GroupChat'], ParentType, ContextType, RequireFields<MutationAddUserToGroupChatArgs, 'chatId' | 'userId'>>;
  addUserToUserFamily?: Resolver<ResolversTypes['UserFamily'], ParentType, ContextType, RequireFields<MutationAddUserToUserFamilyArgs, 'familyId' | 'userId'>>;
  adminRemoveEvent?: Resolver<ResolversTypes['Event'], ParentType, ContextType, RequireFields<MutationAdminRemoveEventArgs, 'eventId'>>;
  adminRemoveGroup?: Resolver<ResolversTypes['GroupChat'], ParentType, ContextType, RequireFields<MutationAdminRemoveGroupArgs, 'groupId'>>;
  assignUserTag?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<MutationAssignUserTagArgs, 'input'>>;
  blockPluginCreationBySuperadmin?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationBlockPluginCreationBySuperadminArgs, 'blockUser' | 'userId'>>;
  blockUser?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationBlockUserArgs, 'organizationId' | 'userId'>>;
  cancelMembershipRequest?: Resolver<ResolversTypes['MembershipRequest'], ParentType, ContextType, RequireFields<MutationCancelMembershipRequestArgs, 'membershipRequestId'>>;
  checkIn?: Resolver<ResolversTypes['CheckIn'], ParentType, ContextType, RequireFields<MutationCheckInArgs, 'data'>>;
  checkInEventAttendee?: Resolver<ResolversTypes['EventAttendee'], ParentType, ContextType, RequireFields<MutationCheckInEventAttendeeArgs, 'data'>>;
  checkOutEventAttendee?: Resolver<ResolversTypes['EventAttendee'], ParentType, ContextType, RequireFields<MutationCheckOutEventAttendeeArgs, 'data'>>;
  createActionItem?: Resolver<ResolversTypes['ActionItem'], ParentType, ContextType, RequireFields<MutationCreateActionItemArgs, 'actionItemCategoryId' | 'data'>>;
  createActionItemCategory?: Resolver<ResolversTypes['ActionItemCategory'], ParentType, ContextType, RequireFields<MutationCreateActionItemCategoryArgs, 'name' | 'organizationId'>>;
  createAdmin?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationCreateAdminArgs, 'data'>>;
  createAdvertisement?: Resolver<Maybe<ResolversTypes['CreateAdvertisementPayload']>, ParentType, ContextType, RequireFields<MutationCreateAdvertisementArgs, 'input'>>;
  createAgendaCategory?: Resolver<ResolversTypes['AgendaCategory'], ParentType, ContextType, RequireFields<MutationCreateAgendaCategoryArgs, 'input'>>;
  createAgendaItem?: Resolver<ResolversTypes['AgendaItem'], ParentType, ContextType, RequireFields<MutationCreateAgendaItemArgs, 'input'>>;
  createComment?: Resolver<Maybe<ResolversTypes['Comment']>, ParentType, ContextType, RequireFields<MutationCreateCommentArgs, 'data' | 'postId'>>;
  createDirectChat?: Resolver<ResolversTypes['DirectChat'], ParentType, ContextType, RequireFields<MutationCreateDirectChatArgs, 'data'>>;
  createDonation?: Resolver<ResolversTypes['Donation'], ParentType, ContextType, RequireFields<MutationCreateDonationArgs, 'amount' | 'nameOfOrg' | 'nameOfUser' | 'orgId' | 'payPalId' | 'userId'>>;
  createEvent?: Resolver<ResolversTypes['Event'], ParentType, ContextType, RequireFields<MutationCreateEventArgs, 'data'>>;
  createEventVolunteer?: Resolver<ResolversTypes['EventVolunteer'], ParentType, ContextType, RequireFields<MutationCreateEventVolunteerArgs, 'data'>>;
  createFund?: Resolver<ResolversTypes['Fund'], ParentType, ContextType, RequireFields<MutationCreateFundArgs, 'data'>>;
  createFundraisingCampaign?: Resolver<ResolversTypes['FundraisingCampaign'], ParentType, ContextType, RequireFields<MutationCreateFundraisingCampaignArgs, 'data'>>;
  createFundraisingCampaignPledge?: Resolver<ResolversTypes['FundraisingCampaignPledge'], ParentType, ContextType, RequireFields<MutationCreateFundraisingCampaignPledgeArgs, 'data'>>;
  createGroupChat?: Resolver<ResolversTypes['GroupChat'], ParentType, ContextType, RequireFields<MutationCreateGroupChatArgs, 'data'>>;
  createMember?: Resolver<ResolversTypes['Organization'], ParentType, ContextType, RequireFields<MutationCreateMemberArgs, 'input'>>;
  createMessageChat?: Resolver<ResolversTypes['MessageChat'], ParentType, ContextType, RequireFields<MutationCreateMessageChatArgs, 'data'>>;
  createOrganization?: Resolver<ResolversTypes['Organization'], ParentType, ContextType, Partial<MutationCreateOrganizationArgs>>;
  createPlugin?: Resolver<ResolversTypes['Plugin'], ParentType, ContextType, RequireFields<MutationCreatePluginArgs, 'pluginCreatedBy' | 'pluginDesc' | 'pluginName'>>;
  createPost?: Resolver<Maybe<ResolversTypes['Post']>, ParentType, ContextType, RequireFields<MutationCreatePostArgs, 'data'>>;
  createSampleOrganization?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  createUserFamily?: Resolver<ResolversTypes['UserFamily'], ParentType, ContextType, RequireFields<MutationCreateUserFamilyArgs, 'data'>>;
  createUserTag?: Resolver<Maybe<ResolversTypes['UserTag']>, ParentType, ContextType, RequireFields<MutationCreateUserTagArgs, 'input'>>;
  createVenue?: Resolver<Maybe<ResolversTypes['Venue']>, ParentType, ContextType, RequireFields<MutationCreateVenueArgs, 'data'>>;
  deleteAdvertisement?: Resolver<Maybe<ResolversTypes['DeleteAdvertisementPayload']>, ParentType, ContextType, RequireFields<MutationDeleteAdvertisementArgs, 'id'>>;
  deleteAgendaCategory?: Resolver<ResolversTypes['ID'], ParentType, ContextType, RequireFields<MutationDeleteAgendaCategoryArgs, 'id'>>;
  deleteDonationById?: Resolver<ResolversTypes['DeletePayload'], ParentType, ContextType, RequireFields<MutationDeleteDonationByIdArgs, 'id'>>;
  deleteVenue?: Resolver<Maybe<ResolversTypes['Venue']>, ParentType, ContextType, RequireFields<MutationDeleteVenueArgs, 'id'>>;
  editVenue?: Resolver<Maybe<ResolversTypes['Venue']>, ParentType, ContextType, RequireFields<MutationEditVenueArgs, 'data'>>;
  forgotPassword?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationForgotPasswordArgs, 'data'>>;
  inviteEventAttendee?: Resolver<ResolversTypes['EventAttendee'], ParentType, ContextType, RequireFields<MutationInviteEventAttendeeArgs, 'data'>>;
  joinPublicOrganization?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationJoinPublicOrganizationArgs, 'organizationId'>>;
  leaveOrganization?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationLeaveOrganizationArgs, 'organizationId'>>;
  likeComment?: Resolver<Maybe<ResolversTypes['Comment']>, ParentType, ContextType, RequireFields<MutationLikeCommentArgs, 'id'>>;
  likePost?: Resolver<Maybe<ResolversTypes['Post']>, ParentType, ContextType, RequireFields<MutationLikePostArgs, 'id'>>;
  login?: Resolver<ResolversTypes['AuthData'], ParentType, ContextType, RequireFields<MutationLoginArgs, 'data'>>;
  logout?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  otp?: Resolver<ResolversTypes['OtpData'], ParentType, ContextType, RequireFields<MutationOtpArgs, 'data'>>;
  recaptcha?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRecaptchaArgs, 'data'>>;
  refreshToken?: Resolver<ResolversTypes['ExtendSession'], ParentType, ContextType, RequireFields<MutationRefreshTokenArgs, 'refreshToken'>>;
  registerEventAttendee?: Resolver<ResolversTypes['EventAttendee'], ParentType, ContextType, RequireFields<MutationRegisterEventAttendeeArgs, 'data'>>;
  registerForEvent?: Resolver<ResolversTypes['EventAttendee'], ParentType, ContextType, RequireFields<MutationRegisterForEventArgs, 'id'>>;
  rejectAdmin?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRejectAdminArgs, 'id'>>;
  rejectMembershipRequest?: Resolver<ResolversTypes['MembershipRequest'], ParentType, ContextType, RequireFields<MutationRejectMembershipRequestArgs, 'membershipRequestId'>>;
  removeActionItem?: Resolver<ResolversTypes['ActionItem'], ParentType, ContextType, RequireFields<MutationRemoveActionItemArgs, 'id'>>;
  removeAdmin?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationRemoveAdminArgs, 'data'>>;
  removeAdvertisement?: Resolver<Maybe<ResolversTypes['Advertisement']>, ParentType, ContextType, RequireFields<MutationRemoveAdvertisementArgs, 'id'>>;
  removeAgendaItem?: Resolver<ResolversTypes['AgendaItem'], ParentType, ContextType, RequireFields<MutationRemoveAgendaItemArgs, 'id'>>;
  removeComment?: Resolver<Maybe<ResolversTypes['Comment']>, ParentType, ContextType, RequireFields<MutationRemoveCommentArgs, 'id'>>;
  removeDirectChat?: Resolver<ResolversTypes['DirectChat'], ParentType, ContextType, RequireFields<MutationRemoveDirectChatArgs, 'chatId' | 'organizationId'>>;
  removeEvent?: Resolver<ResolversTypes['Event'], ParentType, ContextType, RequireFields<MutationRemoveEventArgs, 'id'>>;
  removeEventAttendee?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationRemoveEventAttendeeArgs, 'data'>>;
  removeEventVolunteer?: Resolver<ResolversTypes['EventVolunteer'], ParentType, ContextType, RequireFields<MutationRemoveEventVolunteerArgs, 'id'>>;
  removeFund?: Resolver<ResolversTypes['Fund'], ParentType, ContextType, RequireFields<MutationRemoveFundArgs, 'id'>>;
  removeFundraisingCampaign?: Resolver<ResolversTypes['FundraisingCampaign'], ParentType, ContextType, RequireFields<MutationRemoveFundraisingCampaignArgs, 'id'>>;
  removeFundraisingCampaignPledge?: Resolver<ResolversTypes['FundraisingCampaignPledge'], ParentType, ContextType, RequireFields<MutationRemoveFundraisingCampaignPledgeArgs, 'id'>>;
  removeGroupChat?: Resolver<ResolversTypes['GroupChat'], ParentType, ContextType, RequireFields<MutationRemoveGroupChatArgs, 'chatId'>>;
  removeMember?: Resolver<ResolversTypes['Organization'], ParentType, ContextType, RequireFields<MutationRemoveMemberArgs, 'data'>>;
  removeOrganization?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationRemoveOrganizationArgs, 'id'>>;
  removeOrganizationCustomField?: Resolver<ResolversTypes['OrganizationCustomField'], ParentType, ContextType, RequireFields<MutationRemoveOrganizationCustomFieldArgs, 'customFieldId' | 'organizationId'>>;
  removeOrganizationImage?: Resolver<ResolversTypes['Organization'], ParentType, ContextType, RequireFields<MutationRemoveOrganizationImageArgs, 'organizationId'>>;
  removePost?: Resolver<Maybe<ResolversTypes['Post']>, ParentType, ContextType, RequireFields<MutationRemovePostArgs, 'id'>>;
  removeSampleOrganization?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  removeUserCustomData?: Resolver<ResolversTypes['UserCustomData'], ParentType, ContextType, RequireFields<MutationRemoveUserCustomDataArgs, 'organizationId'>>;
  removeUserFamily?: Resolver<ResolversTypes['UserFamily'], ParentType, ContextType, RequireFields<MutationRemoveUserFamilyArgs, 'familyId'>>;
  removeUserFromGroupChat?: Resolver<ResolversTypes['GroupChat'], ParentType, ContextType, RequireFields<MutationRemoveUserFromGroupChatArgs, 'chatId' | 'userId'>>;
  removeUserFromUserFamily?: Resolver<ResolversTypes['UserFamily'], ParentType, ContextType, RequireFields<MutationRemoveUserFromUserFamilyArgs, 'familyId' | 'userId'>>;
  removeUserImage?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  removeUserTag?: Resolver<Maybe<ResolversTypes['UserTag']>, ParentType, ContextType, RequireFields<MutationRemoveUserTagArgs, 'id'>>;
  revokeRefreshTokenForUser?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  saveFcmToken?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, Partial<MutationSaveFcmTokenArgs>>;
  sendMembershipRequest?: Resolver<ResolversTypes['MembershipRequest'], ParentType, ContextType, RequireFields<MutationSendMembershipRequestArgs, 'organizationId'>>;
  sendMessageToDirectChat?: Resolver<ResolversTypes['DirectChatMessage'], ParentType, ContextType, RequireFields<MutationSendMessageToDirectChatArgs, 'chatId' | 'messageContent'>>;
  sendMessageToGroupChat?: Resolver<ResolversTypes['GroupChatMessage'], ParentType, ContextType, RequireFields<MutationSendMessageToGroupChatArgs, 'chatId' | 'messageContent'>>;
  signUp?: Resolver<ResolversTypes['AuthData'], ParentType, ContextType, RequireFields<MutationSignUpArgs, 'data'>>;
  togglePostPin?: Resolver<ResolversTypes['Post'], ParentType, ContextType, RequireFields<MutationTogglePostPinArgs, 'id'>>;
  unassignUserTag?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType, RequireFields<MutationUnassignUserTagArgs, 'input'>>;
  unblockUser?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationUnblockUserArgs, 'organizationId' | 'userId'>>;
  unlikeComment?: Resolver<Maybe<ResolversTypes['Comment']>, ParentType, ContextType, RequireFields<MutationUnlikeCommentArgs, 'id'>>;
  unlikePost?: Resolver<Maybe<ResolversTypes['Post']>, ParentType, ContextType, RequireFields<MutationUnlikePostArgs, 'id'>>;
  unregisterForEventByUser?: Resolver<ResolversTypes['Event'], ParentType, ContextType, RequireFields<MutationUnregisterForEventByUserArgs, 'id'>>;
  updateActionItem?: Resolver<Maybe<ResolversTypes['ActionItem']>, ParentType, ContextType, RequireFields<MutationUpdateActionItemArgs, 'data' | 'id'>>;
  updateActionItemCategory?: Resolver<Maybe<ResolversTypes['ActionItemCategory']>, ParentType, ContextType, RequireFields<MutationUpdateActionItemCategoryArgs, 'data' | 'id'>>;
  updateAdvertisement?: Resolver<Maybe<ResolversTypes['UpdateAdvertisementPayload']>, ParentType, ContextType, RequireFields<MutationUpdateAdvertisementArgs, 'input'>>;
  updateAgendaCategory?: Resolver<Maybe<ResolversTypes['AgendaCategory']>, ParentType, ContextType, RequireFields<MutationUpdateAgendaCategoryArgs, 'id' | 'input'>>;
  updateAgendaItem?: Resolver<Maybe<ResolversTypes['AgendaItem']>, ParentType, ContextType, RequireFields<MutationUpdateAgendaItemArgs, 'id' | 'input'>>;
  updateEvent?: Resolver<ResolversTypes['Event'], ParentType, ContextType, RequireFields<MutationUpdateEventArgs, 'id'>>;
  updateEventVolunteer?: Resolver<ResolversTypes['EventVolunteer'], ParentType, ContextType, RequireFields<MutationUpdateEventVolunteerArgs, 'id'>>;
  updateFund?: Resolver<ResolversTypes['Fund'], ParentType, ContextType, RequireFields<MutationUpdateFundArgs, 'data' | 'id'>>;
  updateFundraisingCampaign?: Resolver<ResolversTypes['FundraisingCampaign'], ParentType, ContextType, RequireFields<MutationUpdateFundraisingCampaignArgs, 'data' | 'id'>>;
  updateFundraisingCampaignPledge?: Resolver<ResolversTypes['FundraisingCampaignPledge'], ParentType, ContextType, RequireFields<MutationUpdateFundraisingCampaignPledgeArgs, 'data' | 'id'>>;
  updateLanguage?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationUpdateLanguageArgs, 'languageCode'>>;
  updateOrganization?: Resolver<ResolversTypes['Organization'], ParentType, ContextType, RequireFields<MutationUpdateOrganizationArgs, 'id'>>;
  updatePluginStatus?: Resolver<ResolversTypes['Plugin'], ParentType, ContextType, RequireFields<MutationUpdatePluginStatusArgs, 'id' | 'orgId'>>;
  updatePost?: Resolver<ResolversTypes['Post'], ParentType, ContextType, RequireFields<MutationUpdatePostArgs, 'id'>>;
  updateUserPassword?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationUpdateUserPasswordArgs, 'data'>>;
  updateUserProfile?: Resolver<ResolversTypes['User'], ParentType, ContextType, Partial<MutationUpdateUserProfileArgs>>;
  updateUserRoleInOrganization?: Resolver<ResolversTypes['Organization'], ParentType, ContextType, RequireFields<MutationUpdateUserRoleInOrganizationArgs, 'organizationId' | 'role' | 'userId'>>;
  updateUserTag?: Resolver<Maybe<ResolversTypes['UserTag']>, ParentType, ContextType, RequireFields<MutationUpdateUserTagArgs, 'input'>>;
  updateUserType?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationUpdateUserTypeArgs, 'data'>>;
};

export type OrganizationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Organization'] = ResolversParentTypes['Organization']> = {
  _id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  actionItemCategories?: Resolver<Maybe<Array<Maybe<ResolversTypes['ActionItemCategory']>>>, ParentType, ContextType>;
  address?: Resolver<Maybe<ResolversTypes['Address']>, ParentType, ContextType>;
  admins?: Resolver<Maybe<Array<ResolversTypes['User']>>, ParentType, ContextType, Partial<OrganizationAdminsArgs>>;
  advertisements?: Resolver<Maybe<ResolversTypes['AdvertisementsConnection']>, ParentType, ContextType, Partial<OrganizationAdvertisementsArgs>>;
  agendaCategories?: Resolver<Maybe<Array<Maybe<ResolversTypes['AgendaCategory']>>>, ParentType, ContextType>;
  apiUrl?: Resolver<ResolversTypes['URL'], ParentType, ContextType>;
  blockedUsers?: Resolver<Maybe<Array<Maybe<ResolversTypes['User']>>>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  creator?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  customFields?: Resolver<Array<ResolversTypes['OrganizationCustomField']>, ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  funds?: Resolver<Maybe<Array<Maybe<ResolversTypes['Fund']>>>, ParentType, ContextType>;
  image?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  members?: Resolver<Maybe<Array<Maybe<ResolversTypes['User']>>>, ParentType, ContextType>;
  membershipRequests?: Resolver<Maybe<Array<Maybe<ResolversTypes['MembershipRequest']>>>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  pinnedPosts?: Resolver<Maybe<Array<Maybe<ResolversTypes['Post']>>>, ParentType, ContextType>;
  posts?: Resolver<Maybe<ResolversTypes['PostsConnection']>, ParentType, ContextType, Partial<OrganizationPostsArgs>>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  userRegistrationRequired?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  userTags?: Resolver<Maybe<ResolversTypes['UserTagsConnection']>, ParentType, ContextType, Partial<OrganizationUserTagsArgs>>;
  venues?: Resolver<Maybe<Array<Maybe<ResolversTypes['Venue']>>>, ParentType, ContextType>;
  visibleInSearch?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type OrganizationCustomFieldResolvers<ContextType = any, ParentType extends ResolversParentTypes['OrganizationCustomField'] = ResolversParentTypes['OrganizationCustomField']> = {
  _id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  organizationId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type OrganizationInfoNodeResolvers<ContextType = any, ParentType extends ResolversParentTypes['OrganizationInfoNode'] = ResolversParentTypes['OrganizationInfoNode']> = {
  _id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  apiUrl?: Resolver<ResolversTypes['URL'], ParentType, ContextType>;
  creator?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  image?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  userRegistrationRequired?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  visibleInSearch?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type OtpDataResolvers<ContextType = any, ParentType extends ResolversParentTypes['OtpData'] = ResolversParentTypes['OtpData']> = {
  otpToken?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PageInfoResolvers<ContextType = any, ParentType extends ResolversParentTypes['PageInfo'] = ResolversParentTypes['PageInfo']> = {
  currPageNo?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  hasNextPage?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  hasPreviousPage?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  nextPageNo?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  prevPageNo?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  totalPages?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface PhoneNumberScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['PhoneNumber'], any> {
  name: 'PhoneNumber';
}

export type PluginResolvers<ContextType = any, ParentType extends ResolversParentTypes['Plugin'] = ResolversParentTypes['Plugin']> = {
  _id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  pluginCreatedBy?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  pluginDesc?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  pluginName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  uninstalledOrgs?: Resolver<Maybe<Array<ResolversTypes['ID']>>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PluginFieldResolvers<ContextType = any, ParentType extends ResolversParentTypes['PluginField'] = ResolversParentTypes['PluginField']> = {
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  key?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['Status'], ParentType, ContextType>;
  value?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface PositiveIntScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['PositiveInt'], any> {
  name: 'PositiveInt';
}

export type PostResolvers<ContextType = any, ParentType extends ResolversParentTypes['Post'] = ResolversParentTypes['Post']> = {
  _id?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  commentCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  comments?: Resolver<Maybe<Array<Maybe<ResolversTypes['Comment']>>>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  creator?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  imageUrl?: Resolver<Maybe<ResolversTypes['URL']>, ParentType, ContextType>;
  likeCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  likedBy?: Resolver<Maybe<Array<Maybe<ResolversTypes['User']>>>, ParentType, ContextType>;
  organization?: Resolver<ResolversTypes['Organization'], ParentType, ContextType>;
  pinned?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  text?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  videoUrl?: Resolver<Maybe<ResolversTypes['URL']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PostEdgeResolvers<ContextType = any, ParentType extends ResolversParentTypes['PostEdge'] = ResolversParentTypes['PostEdge']> = {
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['Post'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PostsConnectionResolvers<ContextType = any, ParentType extends ResolversParentTypes['PostsConnection'] = ResolversParentTypes['PostsConnection']> = {
  edges?: Resolver<Array<ResolversTypes['PostEdge']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['DefaultConnectionPageInfo'], ParentType, ContextType>;
  totalCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  actionItem?: Resolver<Maybe<ResolversTypes['ActionItem']>, ParentType, ContextType, RequireFields<QueryActionItemArgs, 'id'>>;
  actionItemCategoriesByOrganization?: Resolver<Maybe<Array<Maybe<ResolversTypes['ActionItemCategory']>>>, ParentType, ContextType, RequireFields<QueryActionItemCategoriesByOrganizationArgs, 'organizationId'>>;
  actionItemCategory?: Resolver<Maybe<ResolversTypes['ActionItemCategory']>, ParentType, ContextType, RequireFields<QueryActionItemCategoryArgs, 'id'>>;
  actionItemsByEvent?: Resolver<Maybe<Array<Maybe<ResolversTypes['ActionItem']>>>, ParentType, ContextType, RequireFields<QueryActionItemsByEventArgs, 'eventId'>>;
  actionItemsByOrganization?: Resolver<Maybe<Array<Maybe<ResolversTypes['ActionItem']>>>, ParentType, ContextType, RequireFields<QueryActionItemsByOrganizationArgs, 'organizationId'>>;
  adminPlugin?: Resolver<Maybe<Array<Maybe<ResolversTypes['Plugin']>>>, ParentType, ContextType, RequireFields<QueryAdminPluginArgs, 'orgId'>>;
  advertisementsConnection?: Resolver<Maybe<ResolversTypes['AdvertisementsConnection']>, ParentType, ContextType, Partial<QueryAdvertisementsConnectionArgs>>;
  agendaCategory?: Resolver<ResolversTypes['AgendaCategory'], ParentType, ContextType, RequireFields<QueryAgendaCategoryArgs, 'id'>>;
  checkAuth?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  customDataByOrganization?: Resolver<Array<ResolversTypes['UserCustomData']>, ParentType, ContextType, RequireFields<QueryCustomDataByOrganizationArgs, 'organizationId'>>;
  customFieldsByOrganization?: Resolver<Maybe<Array<Maybe<ResolversTypes['OrganizationCustomField']>>>, ParentType, ContextType, RequireFields<QueryCustomFieldsByOrganizationArgs, 'id'>>;
  directChatsByUserID?: Resolver<Maybe<Array<Maybe<ResolversTypes['DirectChat']>>>, ParentType, ContextType, RequireFields<QueryDirectChatsByUserIdArgs, 'id'>>;
  directChatsMessagesByChatID?: Resolver<Maybe<Array<Maybe<ResolversTypes['DirectChatMessage']>>>, ParentType, ContextType, RequireFields<QueryDirectChatsMessagesByChatIdArgs, 'id'>>;
  event?: Resolver<Maybe<ResolversTypes['Event']>, ParentType, ContextType, RequireFields<QueryEventArgs, 'id'>>;
  eventVolunteersByEvent?: Resolver<Maybe<Array<Maybe<ResolversTypes['EventVolunteer']>>>, ParentType, ContextType, RequireFields<QueryEventVolunteersByEventArgs, 'id'>>;
  eventsByOrganization?: Resolver<Maybe<Array<Maybe<ResolversTypes['Event']>>>, ParentType, ContextType, Partial<QueryEventsByOrganizationArgs>>;
  eventsByOrganizationConnection?: Resolver<Array<ResolversTypes['Event']>, ParentType, ContextType, Partial<QueryEventsByOrganizationConnectionArgs>>;
  getAgendaItem?: Resolver<Maybe<ResolversTypes['AgendaItem']>, ParentType, ContextType, RequireFields<QueryGetAgendaItemArgs, 'id'>>;
  getAllAgendaItems?: Resolver<Maybe<Array<Maybe<ResolversTypes['AgendaItem']>>>, ParentType, ContextType>;
  getDonationById?: Resolver<ResolversTypes['Donation'], ParentType, ContextType, RequireFields<QueryGetDonationByIdArgs, 'id'>>;
  getDonationByOrgId?: Resolver<Maybe<Array<Maybe<ResolversTypes['Donation']>>>, ParentType, ContextType, RequireFields<QueryGetDonationByOrgIdArgs, 'orgId'>>;
  getDonationByOrgIdConnection?: Resolver<Array<ResolversTypes['Donation']>, ParentType, ContextType, RequireFields<QueryGetDonationByOrgIdConnectionArgs, 'orgId'>>;
  getEventAttendee?: Resolver<Maybe<ResolversTypes['EventAttendee']>, ParentType, ContextType, RequireFields<QueryGetEventAttendeeArgs, 'eventId' | 'userId'>>;
  getEventAttendeesByEventId?: Resolver<Maybe<Array<Maybe<ResolversTypes['EventAttendee']>>>, ParentType, ContextType, RequireFields<QueryGetEventAttendeesByEventIdArgs, 'eventId'>>;
  getFundById?: Resolver<ResolversTypes['Fund'], ParentType, ContextType, RequireFields<QueryGetFundByIdArgs, 'id'>>;
  getFundraisingCampaignById?: Resolver<ResolversTypes['FundraisingCampaign'], ParentType, ContextType, RequireFields<QueryGetFundraisingCampaignByIdArgs, 'id'>>;
  getFundraisingCampaignPledgeById?: Resolver<ResolversTypes['FundraisingCampaignPledge'], ParentType, ContextType, RequireFields<QueryGetFundraisingCampaignPledgeByIdArgs, 'id'>>;
  getPlugins?: Resolver<Maybe<Array<Maybe<ResolversTypes['Plugin']>>>, ParentType, ContextType>;
  getlanguage?: Resolver<Maybe<Array<Maybe<ResolversTypes['Translation']>>>, ParentType, ContextType, RequireFields<QueryGetlanguageArgs, 'lang_code'>>;
  hasSubmittedFeedback?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType, RequireFields<QueryHasSubmittedFeedbackArgs, 'eventId' | 'userId'>>;
  isSampleOrganization?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<QueryIsSampleOrganizationArgs, 'id'>>;
  joinedOrganizations?: Resolver<Maybe<Array<Maybe<ResolversTypes['Organization']>>>, ParentType, ContextType, Partial<QueryJoinedOrganizationsArgs>>;
  me?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  myLanguage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  organizations?: Resolver<Maybe<Array<Maybe<ResolversTypes['Organization']>>>, ParentType, ContextType, Partial<QueryOrganizationsArgs>>;
  organizationsConnection?: Resolver<Array<Maybe<ResolversTypes['Organization']>>, ParentType, ContextType, Partial<QueryOrganizationsConnectionArgs>>;
  organizationsMemberConnection?: Resolver<ResolversTypes['UserConnection'], ParentType, ContextType, RequireFields<QueryOrganizationsMemberConnectionArgs, 'orgId'>>;
  plugin?: Resolver<Maybe<Array<Maybe<ResolversTypes['Plugin']>>>, ParentType, ContextType, RequireFields<QueryPluginArgs, 'orgId'>>;
  post?: Resolver<Maybe<ResolversTypes['Post']>, ParentType, ContextType, RequireFields<QueryPostArgs, 'id'>>;
  registeredEventsByUser?: Resolver<Maybe<Array<Maybe<ResolversTypes['Event']>>>, ParentType, ContextType, Partial<QueryRegisteredEventsByUserArgs>>;
  registrantsByEvent?: Resolver<Maybe<Array<Maybe<ResolversTypes['User']>>>, ParentType, ContextType, RequireFields<QueryRegistrantsByEventArgs, 'id'>>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<QueryUserArgs, 'id'>>;
  userLanguage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<QueryUserLanguageArgs, 'userId'>>;
  users?: Resolver<Maybe<Array<Maybe<ResolversTypes['User']>>>, ParentType, ContextType, Partial<QueryUsersArgs>>;
  usersConnection?: Resolver<Array<Maybe<ResolversTypes['User']>>, ParentType, ContextType, Partial<QueryUsersConnectionArgs>>;
  venue?: Resolver<Maybe<ResolversTypes['Venue']>, ParentType, ContextType, RequireFields<QueryVenueArgs, 'id'>>;
};

export type SubscriptionResolvers<ContextType = any, ParentType extends ResolversParentTypes['Subscription'] = ResolversParentTypes['Subscription']> = {
  directMessageChat?: SubscriptionResolver<Maybe<ResolversTypes['MessageChat']>, "directMessageChat", ParentType, ContextType>;
  messageSentToDirectChat?: SubscriptionResolver<Maybe<ResolversTypes['DirectChatMessage']>, "messageSentToDirectChat", ParentType, ContextType>;
  messageSentToGroupChat?: SubscriptionResolver<Maybe<ResolversTypes['GroupChatMessage']>, "messageSentToGroupChat", ParentType, ContextType>;
  onPluginUpdate?: SubscriptionResolver<Maybe<ResolversTypes['Plugin']>, "onPluginUpdate", ParentType, ContextType>;
};

export interface TimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Time'], any> {
  name: 'Time';
}

export type TranslationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Translation'] = ResolversParentTypes['Translation']> = {
  en_value?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  lang_code?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  translation?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  verified?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface UrlScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['URL'], any> {
  name: 'URL';
}

export type UnauthenticatedErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['UnauthenticatedError'] = ResolversParentTypes['UnauthenticatedError']> = {
  message?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UnauthorizedErrorResolvers<ContextType = any, ParentType extends ResolversParentTypes['UnauthorizedError'] = ResolversParentTypes['UnauthorizedError']> = {
  message?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UpdateAdvertisementPayloadResolvers<ContextType = any, ParentType extends ResolversParentTypes['UpdateAdvertisementPayload'] = ResolversParentTypes['UpdateAdvertisementPayload']> = {
  advertisement?: Resolver<Maybe<ResolversTypes['Advertisement']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface UploadScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Upload'], any> {
  name: 'Upload';
}

export type UserResolvers<ContextType = any, ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']> = {
  _id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  address?: Resolver<Maybe<ResolversTypes['Address']>, ParentType, ContextType>;
  adminApproved?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  adminFor?: Resolver<Maybe<Array<Maybe<ResolversTypes['Organization']>>>, ParentType, ContextType>;
  appLanguageCode?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  birthDate?: Resolver<Maybe<ResolversTypes['Date']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  createdEvents?: Resolver<Maybe<Array<Maybe<ResolversTypes['Event']>>>, ParentType, ContextType>;
  createdOrganizations?: Resolver<Maybe<Array<Maybe<ResolversTypes['Organization']>>>, ParentType, ContextType>;
  educationGrade?: Resolver<Maybe<ResolversTypes['EducationGrade']>, ParentType, ContextType>;
  email?: Resolver<ResolversTypes['EmailAddress'], ParentType, ContextType>;
  employmentStatus?: Resolver<Maybe<ResolversTypes['EmploymentStatus']>, ParentType, ContextType>;
  eventAdmin?: Resolver<Maybe<Array<Maybe<ResolversTypes['Event']>>>, ParentType, ContextType>;
  firstName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  gender?: Resolver<Maybe<ResolversTypes['Gender']>, ParentType, ContextType>;
  image?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  joinedOrganizations?: Resolver<Maybe<Array<Maybe<ResolversTypes['Organization']>>>, ParentType, ContextType>;
  lastName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  maritalStatus?: Resolver<Maybe<ResolversTypes['MaritalStatus']>, ParentType, ContextType>;
  membershipRequests?: Resolver<Maybe<Array<Maybe<ResolversTypes['MembershipRequest']>>>, ParentType, ContextType>;
  organizationsBlockedBy?: Resolver<Maybe<Array<Maybe<ResolversTypes['Organization']>>>, ParentType, ContextType>;
  phone?: Resolver<Maybe<ResolversTypes['UserPhone']>, ParentType, ContextType>;
  pluginCreationAllowed?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  posts?: Resolver<Maybe<ResolversTypes['PostsConnection']>, ParentType, ContextType, Partial<UserPostsArgs>>;
  registeredEvents?: Resolver<Maybe<Array<Maybe<ResolversTypes['Event']>>>, ParentType, ContextType>;
  tagsAssignedWith?: Resolver<Maybe<ResolversTypes['UserTagsConnection']>, ParentType, ContextType, Partial<UserTagsAssignedWithArgs>>;
  tokenVersion?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  userType?: Resolver<ResolversTypes['UserType'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UserConnectionResolvers<ContextType = any, ParentType extends ResolversParentTypes['UserConnection'] = ResolversParentTypes['UserConnection']> = {
  aggregate?: Resolver<ResolversTypes['AggregateUser'], ParentType, ContextType>;
  edges?: Resolver<Array<Maybe<ResolversTypes['User']>>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UserCustomDataResolvers<ContextType = any, ParentType extends ResolversParentTypes['UserCustomData'] = ResolversParentTypes['UserCustomData']> = {
  _id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  organizationId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  values?: Resolver<ResolversTypes['JSON'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UserFamilyResolvers<ContextType = any, ParentType extends ResolversParentTypes['UserFamily'] = ResolversParentTypes['UserFamily']> = {
  _id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  admins?: Resolver<Array<ResolversTypes['User']>, ParentType, ContextType>;
  creator?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  users?: Resolver<Array<ResolversTypes['User']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UserPhoneResolvers<ContextType = any, ParentType extends ResolversParentTypes['UserPhone'] = ResolversParentTypes['UserPhone']> = {
  home?: Resolver<Maybe<ResolversTypes['PhoneNumber']>, ParentType, ContextType>;
  mobile?: Resolver<Maybe<ResolversTypes['PhoneNumber']>, ParentType, ContextType>;
  work?: Resolver<Maybe<ResolversTypes['PhoneNumber']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UserTagResolvers<ContextType = any, ParentType extends ResolversParentTypes['UserTag'] = ResolversParentTypes['UserTag']> = {
  _id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  childTags?: Resolver<Maybe<ResolversTypes['UserTagsConnection']>, ParentType, ContextType, Partial<UserTagChildTagsArgs>>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  organization?: Resolver<Maybe<ResolversTypes['Organization']>, ParentType, ContextType>;
  parentTag?: Resolver<Maybe<ResolversTypes['UserTag']>, ParentType, ContextType>;
  usersAssignedTo?: Resolver<Maybe<ResolversTypes['UsersConnection']>, ParentType, ContextType, Partial<UserTagUsersAssignedToArgs>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UserTagsConnectionResolvers<ContextType = any, ParentType extends ResolversParentTypes['UserTagsConnection'] = ResolversParentTypes['UserTagsConnection']> = {
  edges?: Resolver<Array<ResolversTypes['UserTagsConnectionEdge']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['DefaultConnectionPageInfo'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UserTagsConnectionEdgeResolvers<ContextType = any, ParentType extends ResolversParentTypes['UserTagsConnectionEdge'] = ResolversParentTypes['UserTagsConnectionEdge']> = {
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['UserTag'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UsersConnectionResolvers<ContextType = any, ParentType extends ResolversParentTypes['UsersConnection'] = ResolversParentTypes['UsersConnection']> = {
  edges?: Resolver<Array<ResolversTypes['UsersConnectionEdge']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['DefaultConnectionPageInfo'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UsersConnectionEdgeResolvers<ContextType = any, ParentType extends ResolversParentTypes['UsersConnectionEdge'] = ResolversParentTypes['UsersConnectionEdge']> = {
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type VenueResolvers<ContextType = any, ParentType extends ResolversParentTypes['Venue'] = ResolversParentTypes['Venue']> = {
  _id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  capacity?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  imageUrl?: Resolver<Maybe<ResolversTypes['URL']>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  organization?: Resolver<ResolversTypes['Organization'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type Resolvers<ContextType = any> = {
  ActionItem?: ActionItemResolvers<ContextType>;
  ActionItemCategory?: ActionItemCategoryResolvers<ContextType>;
  Address?: AddressResolvers<ContextType>;
  Advertisement?: AdvertisementResolvers<ContextType>;
  AdvertisementEdge?: AdvertisementEdgeResolvers<ContextType>;
  AdvertisementsConnection?: AdvertisementsConnectionResolvers<ContextType>;
  AgendaCategory?: AgendaCategoryResolvers<ContextType>;
  AgendaItem?: AgendaItemResolvers<ContextType>;
  AggregatePost?: AggregatePostResolvers<ContextType>;
  AggregateUser?: AggregateUserResolvers<ContextType>;
  Any?: GraphQLScalarType;
  AuthData?: AuthDataResolvers<ContextType>;
  CheckIn?: CheckInResolvers<ContextType>;
  CheckInStatus?: CheckInStatusResolvers<ContextType>;
  Comment?: CommentResolvers<ContextType>;
  ConnectionError?: ConnectionErrorResolvers<ContextType>;
  ConnectionPageInfo?: ConnectionPageInfoResolvers<ContextType>;
  CountryCode?: GraphQLScalarType;
  CreateAdvertisementPayload?: CreateAdvertisementPayloadResolvers<ContextType>;
  Date?: GraphQLScalarType;
  DateTime?: GraphQLScalarType;
  DefaultConnectionPageInfo?: DefaultConnectionPageInfoResolvers<ContextType>;
  DeleteAdvertisementPayload?: DeleteAdvertisementPayloadResolvers<ContextType>;
  DeletePayload?: DeletePayloadResolvers<ContextType>;
  DirectChat?: DirectChatResolvers<ContextType>;
  DirectChatMessage?: DirectChatMessageResolvers<ContextType>;
  Donation?: DonationResolvers<ContextType>;
  EmailAddress?: GraphQLScalarType;
  Error?: ErrorResolvers<ContextType>;
  Event?: EventResolvers<ContextType>;
  EventAttendee?: EventAttendeeResolvers<ContextType>;
  EventVolunteer?: EventVolunteerResolvers<ContextType>;
  ExtendSession?: ExtendSessionResolvers<ContextType>;
  Feedback?: FeedbackResolvers<ContextType>;
  FieldError?: FieldErrorResolvers<ContextType>;
  Fund?: FundResolvers<ContextType>;
  FundraisingCampaign?: FundraisingCampaignResolvers<ContextType>;
  FundraisingCampaignPledge?: FundraisingCampaignPledgeResolvers<ContextType>;
  Group?: GroupResolvers<ContextType>;
  GroupChat?: GroupChatResolvers<ContextType>;
  GroupChatMessage?: GroupChatMessageResolvers<ContextType>;
  InvalidCursor?: InvalidCursorResolvers<ContextType>;
  JSON?: GraphQLScalarType;
  Language?: LanguageResolvers<ContextType>;
  LanguageModel?: LanguageModelResolvers<ContextType>;
  Latitude?: GraphQLScalarType;
  Longitude?: GraphQLScalarType;
  MaximumLengthError?: MaximumLengthErrorResolvers<ContextType>;
  MaximumValueError?: MaximumValueErrorResolvers<ContextType>;
  MembershipRequest?: MembershipRequestResolvers<ContextType>;
  Message?: MessageResolvers<ContextType>;
  MessageChat?: MessageChatResolvers<ContextType>;
  MinimumLengthError?: MinimumLengthErrorResolvers<ContextType>;
  MinimumValueError?: MinimumValueErrorResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Organization?: OrganizationResolvers<ContextType>;
  OrganizationCustomField?: OrganizationCustomFieldResolvers<ContextType>;
  OrganizationInfoNode?: OrganizationInfoNodeResolvers<ContextType>;
  OtpData?: OtpDataResolvers<ContextType>;
  PageInfo?: PageInfoResolvers<ContextType>;
  PhoneNumber?: GraphQLScalarType;
  Plugin?: PluginResolvers<ContextType>;
  PluginField?: PluginFieldResolvers<ContextType>;
  PositiveInt?: GraphQLScalarType;
  Post?: PostResolvers<ContextType>;
  PostEdge?: PostEdgeResolvers<ContextType>;
  PostsConnection?: PostsConnectionResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Subscription?: SubscriptionResolvers<ContextType>;
  Time?: GraphQLScalarType;
  Translation?: TranslationResolvers<ContextType>;
  URL?: GraphQLScalarType;
  UnauthenticatedError?: UnauthenticatedErrorResolvers<ContextType>;
  UnauthorizedError?: UnauthorizedErrorResolvers<ContextType>;
  UpdateAdvertisementPayload?: UpdateAdvertisementPayloadResolvers<ContextType>;
  Upload?: GraphQLScalarType;
  User?: UserResolvers<ContextType>;
  UserConnection?: UserConnectionResolvers<ContextType>;
  UserCustomData?: UserCustomDataResolvers<ContextType>;
  UserFamily?: UserFamilyResolvers<ContextType>;
  UserPhone?: UserPhoneResolvers<ContextType>;
  UserTag?: UserTagResolvers<ContextType>;
  UserTagsConnection?: UserTagsConnectionResolvers<ContextType>;
  UserTagsConnectionEdge?: UserTagsConnectionEdgeResolvers<ContextType>;
  UsersConnection?: UsersConnectionResolvers<ContextType>;
  UsersConnectionEdge?: UsersConnectionEdgeResolvers<ContextType>;
  Venue?: VenueResolvers<ContextType>;
};

export type DirectiveResolvers<ContextType = any> = {
  auth?: AuthDirectiveResolver<any, any, ContextType>;
  role?: RoleDirectiveResolver<any, any, ContextType>;
};
