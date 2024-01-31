import type { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import type { InterfaceActionItem as InterfaceActionItemModel } from '../models/ActionItem';
import type { InterfaceActionItemCategory as InterfaceActionItemCategoryModel } from '../models/ActionItemCategory';
import type { InterfaceCheckIn as InterfaceCheckInModel } from '../models/CheckIn';
import type { InterfaceMessageChat as InterfaceMessageChatModel } from '../models/MessageChat';
import type { InterfaceComment as InterfaceCommentModel } from '../models/Comment';
import type { InterfaceDirectChat as InterfaceDirectChatModel } from '../models/DirectChat';
import type { InterfaceDirectChatMessage as InterfaceDirectChatMessageModel } from '../models/DirectChatMessage';
import type { InterfaceDonation as InterfaceDonationModel } from '../models/Donation';
import type { InterfaceEvent as InterfaceEventModel } from '../models/Event';
import type { InterfaceEventAttendee as InterfaceEventAttendeeModel } from '../models/EventAttendee';
import type { InterfaceUserFamily as InterfaceUserFamilyModel } from '../models/userFamily';
import type { InterfaceFeedback as InterfaceFeedbackModel } from '../models/Feedback';
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
export type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;
export type RequireFields<T, K extends keyof T> = Omit<T, K> & { [P in K]-?: NonNullable<T[P]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  Any: any;
  CountryCode: any;
  Date: any;
  DateTime: any;
  EmailAddress: any;
  JSON: any;
  Latitude: any;
  Longitude: any;
  PhoneNumber: any;
  PositiveInt: any;
  Time: any;
  URL: any;
  Upload: any;
};

export type ActionItem = {
  __typename?: 'ActionItem';
  _id: Scalars['ID'];
  actionItemCategory?: Maybe<ActionItemCategory>;
  assignee?: Maybe<User>;
  assigner?: Maybe<User>;
  assignmentDate: Scalars['Date'];
  completionDate: Scalars['Date'];
  createdAt: Scalars['Date'];
  creator?: Maybe<User>;
  dueDate: Scalars['Date'];
  event?: Maybe<Event>;
  isCompleted: Scalars['Boolean'];
  postCompletionNotes?: Maybe<Scalars['String']>;
  preCompletionNotes?: Maybe<Scalars['String']>;
  updatedAt: Scalars['Date'];
};

export type ActionItemCategory = {
  __typename?: 'ActionItemCategory';
  _id: Scalars['ID'];
  createdAt: Scalars['Date'];
  creator?: Maybe<User>;
  isDisabled: Scalars['Boolean'];
  name: Scalars['String'];
  organization?: Maybe<Organization>;
  updatedAt: Scalars['Date'];
};

export type Address = {
  __typename?: 'Address';
  city?: Maybe<Scalars['String']>;
  countryCode?: Maybe<Scalars['String']>;
  dependentLocality?: Maybe<Scalars['String']>;
  line1?: Maybe<Scalars['String']>;
  line2?: Maybe<Scalars['String']>;
  postalCode?: Maybe<Scalars['String']>;
  sortingCode?: Maybe<Scalars['String']>;
  state?: Maybe<Scalars['String']>;
};

export type AddressInput = {
  city?: InputMaybe<Scalars['String']>;
  countryCode?: InputMaybe<Scalars['String']>;
  dependentLocality?: InputMaybe<Scalars['String']>;
  line1?: InputMaybe<Scalars['String']>;
  line2?: InputMaybe<Scalars['String']>;
  postalCode?: InputMaybe<Scalars['String']>;
  sortingCode?: InputMaybe<Scalars['String']>;
  state?: InputMaybe<Scalars['String']>;
};

export type Advertisement = {
  __typename?: 'Advertisement';
  _id: Scalars['ID'];
  createdAt: Scalars['DateTime'];
  creator?: Maybe<User>;
  endDate: Scalars['Date'];
  link: Scalars['String'];
  name: Scalars['String'];
  orgId: Scalars['ID'];
  startDate: Scalars['Date'];
  type: AdvertisementType;
  updatedAt: Scalars['DateTime'];
};

export type AdvertisementType =
  | 'BANNER'
  | 'MENU'
  | 'POPUP';

export type AggregatePost = {
  __typename?: 'AggregatePost';
  count: Scalars['Int'];
};

export type AggregateUser = {
  __typename?: 'AggregateUser';
  count: Scalars['Int'];
};

export type AuthData = {
  __typename?: 'AuthData';
  accessToken: Scalars['String'];
  refreshToken: Scalars['String'];
  user: User;
};

export type CheckIn = {
  __typename?: 'CheckIn';
  _id: Scalars['ID'];
  allotedRoom?: Maybe<Scalars['String']>;
  allotedSeat?: Maybe<Scalars['String']>;
  createdAt: Scalars['DateTime'];
  event: Event;
  feedbackSubmitted: Scalars['Boolean'];
  time: Scalars['DateTime'];
  updatedAt: Scalars['DateTime'];
  user: User;
};

export type CheckInInput = {
  allotedRoom?: InputMaybe<Scalars['String']>;
  allotedSeat?: InputMaybe<Scalars['String']>;
  eventId: Scalars['ID'];
  userId: Scalars['ID'];
};

export type CheckInStatus = {
  __typename?: 'CheckInStatus';
  _id: Scalars['ID'];
  checkIn?: Maybe<CheckIn>;
  user: User;
};

export type Comment = {
  __typename?: 'Comment';
  _id: Scalars['ID'];
  createdAt: Scalars['DateTime'];
  creator?: Maybe<User>;
  likeCount?: Maybe<Scalars['Int']>;
  likedBy?: Maybe<Array<Maybe<User>>>;
  post: Post;
  text: Scalars['String'];
  updatedAt: Scalars['DateTime'];
};

export type CommentInput = {
  text: Scalars['String'];
};

export type ConnectionError = InvalidCursor | MaximumValueError;

export type ConnectionPageInfo = {
  __typename?: 'ConnectionPageInfo';
  endCursor?: Maybe<Scalars['String']>;
  hasNextPage: Scalars['Boolean'];
  hasPreviousPage: Scalars['Boolean'];
  startCursor?: Maybe<Scalars['String']>;
};

export type CreateActionItemInput = {
  assigneeId: Scalars['ID'];
  dueDate?: InputMaybe<Scalars['Date']>;
  eventId?: InputMaybe<Scalars['ID']>;
  preCompletionNotes?: InputMaybe<Scalars['String']>;
};

export type CreateUserTagInput = {
  name: Scalars['String'];
  organizationId: Scalars['ID'];
  parentTagId?: InputMaybe<Scalars['ID']>;
};

export type CursorPaginationInput = {
  cursor?: InputMaybe<Scalars['String']>;
  direction: PaginationDirection;
  limit: Scalars['PositiveInt'];
};

export type DeletePayload = {
  __typename?: 'DeletePayload';
  success: Scalars['Boolean'];
};

export type DirectChat = {
  __typename?: 'DirectChat';
  _id: Scalars['ID'];
  createdAt: Scalars['DateTime'];
  creator?: Maybe<User>;
  messages?: Maybe<Array<Maybe<DirectChatMessage>>>;
  organization: Organization;
  updatedAt: Scalars['DateTime'];
  users: Array<User>;
};

export type DirectChatMessage = {
  __typename?: 'DirectChatMessage';
  _id: Scalars['ID'];
  createdAt: Scalars['DateTime'];
  directChatMessageBelongsTo: DirectChat;
  messageContent: Scalars['String'];
  receiver: User;
  sender: User;
  updatedAt: Scalars['DateTime'];
};

export type Donation = {
  __typename?: 'Donation';
  _id: Scalars['ID'];
  amount: Scalars['Float'];
  createdAt: Scalars['DateTime'];
  nameOfOrg: Scalars['String'];
  nameOfUser: Scalars['String'];
  orgId: Scalars['ID'];
  payPalId: Scalars['String'];
  updatedAt: Scalars['DateTime'];
  userId: Scalars['ID'];
};

export type DonationWhereInput = {
  id?: InputMaybe<Scalars['ID']>;
  id_contains?: InputMaybe<Scalars['ID']>;
  id_in?: InputMaybe<Array<Scalars['ID']>>;
  id_not?: InputMaybe<Scalars['ID']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']>>;
  id_starts_with?: InputMaybe<Scalars['ID']>;
  name_of_user?: InputMaybe<Scalars['String']>;
  name_of_user_contains?: InputMaybe<Scalars['String']>;
  name_of_user_in?: InputMaybe<Array<Scalars['String']>>;
  name_of_user_not?: InputMaybe<Scalars['String']>;
  name_of_user_not_in?: InputMaybe<Array<Scalars['String']>>;
  name_of_user_starts_with?: InputMaybe<Scalars['String']>;
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
  message: Scalars['String'];
};

export type Event = {
  __typename?: 'Event';
  _id: Scalars['ID'];
  actionItems?: Maybe<Array<Maybe<ActionItem>>>;
  admins?: Maybe<Array<User>>;
  allDay: Scalars['Boolean'];
  attendees?: Maybe<Array<Maybe<User>>>;
  attendeesCheckInStatus: Array<CheckInStatus>;
  averageFeedbackScore?: Maybe<Scalars['Float']>;
  createdAt: Scalars['DateTime'];
  creator?: Maybe<User>;
  description: Scalars['String'];
  endDate: Scalars['Date'];
  endTime?: Maybe<Scalars['Time']>;
  feedback: Array<Feedback>;
  isPublic: Scalars['Boolean'];
  isRegisterable: Scalars['Boolean'];
  latitude?: Maybe<Scalars['Latitude']>;
  location?: Maybe<Scalars['String']>;
  longitude?: Maybe<Scalars['Longitude']>;
  organization?: Maybe<Organization>;
  recurrance?: Maybe<Recurrance>;
  recurring: Scalars['Boolean'];
  startDate: Scalars['Date'];
  startTime?: Maybe<Scalars['Time']>;
  status: Status;
  title: Scalars['String'];
  updatedAt: Scalars['DateTime'];
};


export type EventAdminsArgs = {
  adminId?: InputMaybe<Scalars['ID']>;
};

export type EventAttendeeInput = {
  eventId: Scalars['ID'];
  userId: Scalars['ID'];
};

export type EventInput = {
  allDay: Scalars['Boolean'];
  description: Scalars['String'];
  endDate?: InputMaybe<Scalars['Date']>;
  endTime?: InputMaybe<Scalars['Time']>;
  isPublic: Scalars['Boolean'];
  isRegisterable: Scalars['Boolean'];
  latitude?: InputMaybe<Scalars['Latitude']>;
  location?: InputMaybe<Scalars['String']>;
  longitude?: InputMaybe<Scalars['Longitude']>;
  organizationId: Scalars['ID'];
  recurrance?: InputMaybe<Recurrance>;
  recurring: Scalars['Boolean'];
  startDate: Scalars['Date'];
  startTime?: InputMaybe<Scalars['Time']>;
  title: Scalars['String'];
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

export type EventWhereInput = {
  description?: InputMaybe<Scalars['String']>;
  description_contains?: InputMaybe<Scalars['String']>;
  description_in?: InputMaybe<Array<Scalars['String']>>;
  description_not?: InputMaybe<Scalars['String']>;
  description_not_in?: InputMaybe<Array<Scalars['String']>>;
  description_starts_with?: InputMaybe<Scalars['String']>;
  id?: InputMaybe<Scalars['ID']>;
  id_contains?: InputMaybe<Scalars['ID']>;
  id_in?: InputMaybe<Array<Scalars['ID']>>;
  id_not?: InputMaybe<Scalars['ID']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']>>;
  id_starts_with?: InputMaybe<Scalars['ID']>;
  location?: InputMaybe<Scalars['String']>;
  location_contains?: InputMaybe<Scalars['String']>;
  location_in?: InputMaybe<Array<Scalars['String']>>;
  location_not?: InputMaybe<Scalars['String']>;
  location_not_in?: InputMaybe<Array<Scalars['String']>>;
  location_starts_with?: InputMaybe<Scalars['String']>;
  organization_id?: InputMaybe<Scalars['ID']>;
  title?: InputMaybe<Scalars['String']>;
  title_contains?: InputMaybe<Scalars['String']>;
  title_in?: InputMaybe<Array<Scalars['String']>>;
  title_not?: InputMaybe<Scalars['String']>;
  title_not_in?: InputMaybe<Array<Scalars['String']>>;
  title_starts_with?: InputMaybe<Scalars['String']>;
};

export type ExtendSession = {
  __typename?: 'ExtendSession';
  accessToken: Scalars['String'];
  refreshToken: Scalars['String'];
};

export type Feedback = {
  __typename?: 'Feedback';
  _id: Scalars['ID'];
  createdAt: Scalars['DateTime'];
  event: Event;
  rating: Scalars['Int'];
  review?: Maybe<Scalars['String']>;
  updatedAt: Scalars['DateTime'];
};

export type FeedbackInput = {
  eventId: Scalars['ID'];
  rating: Scalars['Int'];
  review?: InputMaybe<Scalars['String']>;
};

export type FieldError = {
  message: Scalars['String'];
  path: Array<Scalars['String']>;
};

export type ForgotPasswordData = {
  newPassword: Scalars['String'];
  otpToken: Scalars['String'];
  userOtp: Scalars['String'];
};

export type Gender =
  | 'FEMALE'
  | 'MALE'
  | 'OTHER';

export type Group = {
  __typename?: 'Group';
  _id: Scalars['ID'];
  admins: Array<User>;
  createdAt: Scalars['DateTime'];
  description?: Maybe<Scalars['String']>;
  organization: Organization;
  title: Scalars['String'];
  updatedAt: Scalars['DateTime'];
};

export type GroupChat = {
  __typename?: 'GroupChat';
  _id: Scalars['ID'];
  createdAt: Scalars['DateTime'];
  creator?: Maybe<User>;
  messages?: Maybe<Array<Maybe<GroupChatMessage>>>;
  organization: Organization;
  updatedAt: Scalars['DateTime'];
  users: Array<User>;
};

export type GroupChatMessage = {
  __typename?: 'GroupChatMessage';
  _id: Scalars['ID'];
  createdAt: Scalars['DateTime'];
  groupChatMessageBelongsTo: GroupChat;
  messageContent: Scalars['String'];
  sender: User;
  updatedAt: Scalars['DateTime'];
};

export type InvalidCursor = FieldError & {
  __typename?: 'InvalidCursor';
  message: Scalars['String'];
  path: Array<Scalars['String']>;
};

export type Language = {
  __typename?: 'Language';
  _id: Scalars['ID'];
  createdAt: Scalars['String'];
  en: Scalars['String'];
  translation?: Maybe<Array<Maybe<LanguageModel>>>;
};

export type LanguageInput = {
  en_value: Scalars['String'];
  translation_lang_code: Scalars['String'];
  translation_value: Scalars['String'];
};

export type LanguageModel = {
  __typename?: 'LanguageModel';
  _id: Scalars['ID'];
  createdAt: Scalars['DateTime'];
  lang_code: Scalars['String'];
  value: Scalars['String'];
  verified: Scalars['Boolean'];
};

export type LoginInput = {
  email: Scalars['EmailAddress'];
  password: Scalars['String'];
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
  message: Scalars['String'];
  path: Array<Scalars['String']>;
};

export type MaximumValueError = FieldError & {
  __typename?: 'MaximumValueError';
  limit: Scalars['Int'];
  message: Scalars['String'];
  path: Array<Scalars['String']>;
};

export type MembershipRequest = {
  __typename?: 'MembershipRequest';
  _id: Scalars['ID'];
  organization: Organization;
  user: User;
};

export type Message = {
  __typename?: 'Message';
  _id: Scalars['ID'];
  createdAt: Scalars['DateTime'];
  creator?: Maybe<User>;
  imageUrl?: Maybe<Scalars['URL']>;
  text: Scalars['String'];
  updatedAt: Scalars['DateTime'];
  videoUrl?: Maybe<Scalars['URL']>;
};

export type MessageChat = {
  __typename?: 'MessageChat';
  _id: Scalars['ID'];
  createdAt: Scalars['DateTime'];
  languageBarrier?: Maybe<Scalars['Boolean']>;
  message: Scalars['String'];
  receiver: User;
  sender: User;
  updatedAt: Scalars['DateTime'];
};

export type MessageChatInput = {
  message: Scalars['String'];
  receiver: Scalars['ID'];
};

export type MinimumLengthError = FieldError & {
  __typename?: 'MinimumLengthError';
  limit: Scalars['Int'];
  message: Scalars['String'];
  path: Array<Scalars['String']>;
};

export type MinimumValueError = FieldError & {
  __typename?: 'MinimumValueError';
  message: Scalars['String'];
  path: Array<Scalars['String']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  acceptAdmin: Scalars['Boolean'];
  acceptMembershipRequest: MembershipRequest;
  addEventAttendee: User;
  addFeedback: Feedback;
  addLanguageTranslation: Language;
  addOrganizationCustomField: OrganizationCustomField;
  addOrganizationImage: Organization;
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
  createActionItem: ActionItem;
  createActionItemCategory: ActionItemCategory;
  createAdmin: User;
  createAdvertisement: Advertisement;
  createComment?: Maybe<Comment>;
  createDirectChat: DirectChat;
  createDonation: Donation;
  createEvent: Event;
  createGroupChat: GroupChat;
  createMember: Organization;
  createMessageChat: MessageChat;
  createOrganization: Organization;
  createPlugin: Plugin;
  createPost?: Maybe<Post>;
  createSampleOrganization: Scalars['Boolean'];
  createUserFamily: UserFamily;
  createUserTag?: Maybe<UserTag>;
  deleteAdvertisementById: DeletePayload;
  deleteDonationById: DeletePayload;
  forgotPassword: Scalars['Boolean'];
  joinPublicOrganization: User;
  leaveOrganization: User;
  likeComment?: Maybe<Comment>;
  likePost?: Maybe<Post>;
  login: AuthData;
  logout: Scalars['Boolean'];
  otp: OtpData;
  recaptcha: Scalars['Boolean'];
  refreshToken: ExtendSession;
  registerForEvent: Event;
  rejectAdmin: Scalars['Boolean'];
  rejectMembershipRequest: MembershipRequest;
  removeActionItem: ActionItem;
  removeAdmin: User;
  removeAdvertisement?: Maybe<Advertisement>;
  removeComment?: Maybe<Comment>;
  removeDirectChat: DirectChat;
  removeEvent: Event;
  removeEventAttendee: User;
  removeGroupChat: GroupChat;
  removeMember: Organization;
  removeOrganization: User;
  removeOrganizationCustomField: OrganizationCustomField;
  removeOrganizationImage: Organization;
  removePost?: Maybe<Post>;
  removeSampleOrganization: Scalars['Boolean'];
  removeUserCustomData: UserCustomData;
  removeUserFamily: UserFamily;
  removeUserFromGroupChat: GroupChat;
  removeUserFromUserFamily: UserFamily;
  removeUserImage: User;
  removeUserTag?: Maybe<UserTag>;
  revokeRefreshTokenForUser: Scalars['Boolean'];
  saveFcmToken: Scalars['Boolean'];
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
  updateEvent: Event;
  updateLanguage: User;
  updateOrganization: Organization;
  updatePluginStatus: Plugin;
  updatePost: Post;
  updateUserPassword: User;
  updateUserProfile: User;
  updateUserRoleInOrganization: Organization;
  updateUserTag?: Maybe<UserTag>;
  updateUserType: Scalars['Boolean'];
};


export type MutationAcceptAdminArgs = {
  id: Scalars['ID'];
};


export type MutationAcceptMembershipRequestArgs = {
  membershipRequestId: Scalars['ID'];
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
  name: Scalars['String'];
  organizationId: Scalars['ID'];
  type: Scalars['String'];
};


export type MutationAddOrganizationImageArgs = {
  file: Scalars['String'];
  organizationId: Scalars['String'];
};


export type MutationAddUserCustomDataArgs = {
  dataName: Scalars['String'];
  dataValue: Scalars['Any'];
  organizationId: Scalars['ID'];
};


export type MutationAddUserImageArgs = {
  file: Scalars['String'];
};


export type MutationAddUserToGroupChatArgs = {
  chatId: Scalars['ID'];
  userId: Scalars['ID'];
};


export type MutationAddUserToUserFamilyArgs = {
  familyId: Scalars['ID'];
  userId: Scalars['ID'];
};


export type MutationAdminRemoveEventArgs = {
  eventId: Scalars['ID'];
};


export type MutationAdminRemoveGroupArgs = {
  groupId: Scalars['ID'];
};


export type MutationAssignUserTagArgs = {
  input: ToggleUserTagAssignInput;
};


export type MutationBlockPluginCreationBySuperadminArgs = {
  blockUser: Scalars['Boolean'];
  userId: Scalars['ID'];
};


export type MutationBlockUserArgs = {
  organizationId: Scalars['ID'];
  userId: Scalars['ID'];
};


export type MutationCancelMembershipRequestArgs = {
  membershipRequestId: Scalars['ID'];
};


export type MutationCheckInArgs = {
  data: CheckInInput;
};


export type MutationCreateActionItemArgs = {
  actionItemCategoryId: Scalars['ID'];
  data: CreateActionItemInput;
};


export type MutationCreateActionItemCategoryArgs = {
  name: Scalars['String'];
  organizationId: Scalars['ID'];
};


export type MutationCreateAdminArgs = {
  data: UserAndOrganizationInput;
};


export type MutationCreateAdvertisementArgs = {
  endDate: Scalars['Date'];
  link: Scalars['String'];
  name: Scalars['String'];
  orgId: Scalars['ID'];
  startDate: Scalars['Date'];
  type: Scalars['String'];
};


export type MutationCreateCommentArgs = {
  data: CommentInput;
  postId: Scalars['ID'];
};


export type MutationCreateDirectChatArgs = {
  data: CreateChatInput;
};


export type MutationCreateDonationArgs = {
  amount: Scalars['Float'];
  nameOfOrg: Scalars['String'];
  nameOfUser: Scalars['String'];
  orgId: Scalars['ID'];
  payPalId: Scalars['ID'];
  userId: Scalars['ID'];
};


export type MutationCreateEventArgs = {
  data?: InputMaybe<EventInput>;
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
  file?: InputMaybe<Scalars['String']>;
};


export type MutationCreatePluginArgs = {
  pluginCreatedBy: Scalars['String'];
  pluginDesc: Scalars['String'];
  pluginName: Scalars['String'];
  uninstalledOrgs?: InputMaybe<Array<Scalars['ID']>>;
};


export type MutationCreatePostArgs = {
  data: PostInput;
  file?: InputMaybe<Scalars['String']>;
};


export type MutationCreateUserFamilyArgs = {
  data: CreateUserFamilyInput;
};


export type MutationCreateUserTagArgs = {
  input: CreateUserTagInput;
};


export type MutationDeleteAdvertisementByIdArgs = {
  id: Scalars['ID'];
};


export type MutationDeleteDonationByIdArgs = {
  id: Scalars['ID'];
};


export type MutationForgotPasswordArgs = {
  data: ForgotPasswordData;
};


export type MutationJoinPublicOrganizationArgs = {
  organizationId: Scalars['ID'];
};


export type MutationLeaveOrganizationArgs = {
  organizationId: Scalars['ID'];
};


export type MutationLikeCommentArgs = {
  id: Scalars['ID'];
};


export type MutationLikePostArgs = {
  id: Scalars['ID'];
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
  refreshToken: Scalars['String'];
};


export type MutationRegisterForEventArgs = {
  id: Scalars['ID'];
};


export type MutationRejectAdminArgs = {
  id: Scalars['ID'];
};


export type MutationRejectMembershipRequestArgs = {
  membershipRequestId: Scalars['ID'];
};


export type MutationRemoveActionItemArgs = {
  id: Scalars['ID'];
};


export type MutationRemoveAdminArgs = {
  data: UserAndOrganizationInput;
};


export type MutationRemoveAdvertisementArgs = {
  id: Scalars['ID'];
};


export type MutationRemoveCommentArgs = {
  id: Scalars['ID'];
};


export type MutationRemoveDirectChatArgs = {
  chatId: Scalars['ID'];
  organizationId: Scalars['ID'];
};


export type MutationRemoveEventArgs = {
  id: Scalars['ID'];
};


export type MutationRemoveEventAttendeeArgs = {
  data: EventAttendeeInput;
};


export type MutationRemoveGroupChatArgs = {
  chatId: Scalars['ID'];
};


export type MutationRemoveMemberArgs = {
  data: UserAndOrganizationInput;
};


export type MutationRemoveOrganizationArgs = {
  id: Scalars['ID'];
};


export type MutationRemoveOrganizationCustomFieldArgs = {
  customFieldId: Scalars['ID'];
  organizationId: Scalars['ID'];
};


export type MutationRemoveOrganizationImageArgs = {
  organizationId: Scalars['String'];
};


export type MutationRemovePostArgs = {
  id: Scalars['ID'];
};


export type MutationRemoveUserCustomDataArgs = {
  organizationId: Scalars['ID'];
};


export type MutationRemoveUserFamilyArgs = {
  familyId: Scalars['ID'];
};


export type MutationRemoveUserFromGroupChatArgs = {
  chatId: Scalars['ID'];
  userId: Scalars['ID'];
};


export type MutationRemoveUserFromUserFamilyArgs = {
  familyId: Scalars['ID'];
  userId: Scalars['ID'];
};


export type MutationRemoveUserTagArgs = {
  id: Scalars['ID'];
};


export type MutationSaveFcmTokenArgs = {
  token?: InputMaybe<Scalars['String']>;
};


export type MutationSendMembershipRequestArgs = {
  organizationId: Scalars['ID'];
};


export type MutationSendMessageToDirectChatArgs = {
  chatId: Scalars['ID'];
  messageContent: Scalars['String'];
};


export type MutationSendMessageToGroupChatArgs = {
  chatId: Scalars['ID'];
  messageContent: Scalars['String'];
};


export type MutationSignUpArgs = {
  data: UserInput;
  file?: InputMaybe<Scalars['String']>;
};


export type MutationTogglePostPinArgs = {
  id: Scalars['ID'];
  title?: InputMaybe<Scalars['String']>;
};


export type MutationUnassignUserTagArgs = {
  input: ToggleUserTagAssignInput;
};


export type MutationUnblockUserArgs = {
  organizationId: Scalars['ID'];
  userId: Scalars['ID'];
};


export type MutationUnlikeCommentArgs = {
  id: Scalars['ID'];
};


export type MutationUnlikePostArgs = {
  id: Scalars['ID'];
};


export type MutationUnregisterForEventByUserArgs = {
  id: Scalars['ID'];
};


export type MutationUpdateActionItemArgs = {
  data: UpdateActionItemInput;
  id: Scalars['ID'];
};


export type MutationUpdateActionItemCategoryArgs = {
  data: UpdateActionItemCategoryInput;
  id: Scalars['ID'];
};


export type MutationUpdateAdvertisementArgs = {
  input: UpdateAdvertisementInput;
};


export type MutationUpdateEventArgs = {
  data?: InputMaybe<UpdateEventInput>;
  id: Scalars['ID'];
};


export type MutationUpdateLanguageArgs = {
  languageCode: Scalars['String'];
};


export type MutationUpdateOrganizationArgs = {
  data?: InputMaybe<UpdateOrganizationInput>;
  file?: InputMaybe<Scalars['String']>;
  id: Scalars['ID'];
};


export type MutationUpdatePluginStatusArgs = {
  id: Scalars['ID'];
  orgId: Scalars['ID'];
};


export type MutationUpdatePostArgs = {
  data?: InputMaybe<PostUpdateInput>;
  id: Scalars['ID'];
};


export type MutationUpdateUserPasswordArgs = {
  data: UpdateUserPasswordInput;
};


export type MutationUpdateUserProfileArgs = {
  data?: InputMaybe<UpdateUserInput>;
  file?: InputMaybe<Scalars['String']>;
};


export type MutationUpdateUserRoleInOrganizationArgs = {
  organizationId: Scalars['ID'];
  role: Scalars['String'];
  userId: Scalars['ID'];
};


export type MutationUpdateUserTagArgs = {
  input: UpdateUserTagInput;
};


export type MutationUpdateUserTypeArgs = {
  data: UpdateUserTypeInput;
};

export type OtpInput = {
  email: Scalars['EmailAddress'];
};

export type Organization = {
  __typename?: 'Organization';
  _id: Scalars['ID'];
  actionItemCategories?: Maybe<Array<Maybe<ActionItemCategory>>>;
  address?: Maybe<Address>;
  admins?: Maybe<Array<User>>;
  apiUrl: Scalars['URL'];
  blockedUsers?: Maybe<Array<Maybe<User>>>;
  createdAt: Scalars['DateTime'];
  creator?: Maybe<User>;
  customFields: Array<OrganizationCustomField>;
  description: Scalars['String'];
  image?: Maybe<Scalars['String']>;
  members?: Maybe<Array<Maybe<User>>>;
  membershipRequests?: Maybe<Array<Maybe<MembershipRequest>>>;
  name: Scalars['String'];
  pinnedPosts?: Maybe<Array<Maybe<Post>>>;
  updatedAt: Scalars['DateTime'];
  userRegistrationRequired: Scalars['Boolean'];
  userTags?: Maybe<UserTagsConnection>;
  visibleInSearch: Scalars['Boolean'];
};


export type OrganizationAdminsArgs = {
  adminId?: InputMaybe<Scalars['ID']>;
};


export type OrganizationUserTagsArgs = {
  after?: InputMaybe<Scalars['String']>;
  before?: InputMaybe<Scalars['String']>;
  first?: InputMaybe<Scalars['PositiveInt']>;
  last?: InputMaybe<Scalars['PositiveInt']>;
};

export type OrganizationCustomField = {
  __typename?: 'OrganizationCustomField';
  _id: Scalars['ID'];
  name: Scalars['String'];
  organizationId: Scalars['String'];
  type: Scalars['String'];
};

export type OrganizationInfoNode = {
  __typename?: 'OrganizationInfoNode';
  _id: Scalars['ID'];
  apiUrl: Scalars['URL'];
  creator?: Maybe<User>;
  description: Scalars['String'];
  image?: Maybe<Scalars['String']>;
  name: Scalars['String'];
  userRegistrationRequired: Scalars['Boolean'];
  visibleInSearch: Scalars['Boolean'];
};

export type OrganizationInput = {
  address: AddressInput;
  apiUrl?: InputMaybe<Scalars['URL']>;
  attendees?: InputMaybe<Scalars['String']>;
  description: Scalars['String'];
  image?: InputMaybe<Scalars['String']>;
  name: Scalars['String'];
  userRegistrationRequired?: InputMaybe<Scalars['Boolean']>;
  visibleInSearch?: InputMaybe<Scalars['Boolean']>;
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
  apiUrl?: InputMaybe<Scalars['URL']>;
  apiUrl_contains?: InputMaybe<Scalars['URL']>;
  apiUrl_in?: InputMaybe<Array<Scalars['URL']>>;
  apiUrl_not?: InputMaybe<Scalars['URL']>;
  apiUrl_not_in?: InputMaybe<Array<Scalars['URL']>>;
  apiUrl_starts_with?: InputMaybe<Scalars['URL']>;
  description?: InputMaybe<Scalars['String']>;
  description_contains?: InputMaybe<Scalars['String']>;
  description_in?: InputMaybe<Array<Scalars['String']>>;
  description_not?: InputMaybe<Scalars['String']>;
  description_not_in?: InputMaybe<Array<Scalars['String']>>;
  description_starts_with?: InputMaybe<Scalars['String']>;
  id?: InputMaybe<Scalars['ID']>;
  id_contains?: InputMaybe<Scalars['ID']>;
  id_in?: InputMaybe<Array<Scalars['ID']>>;
  id_not?: InputMaybe<Scalars['ID']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']>>;
  id_starts_with?: InputMaybe<Scalars['ID']>;
  name?: InputMaybe<Scalars['String']>;
  name_contains?: InputMaybe<Scalars['String']>;
  name_in?: InputMaybe<Array<Scalars['String']>>;
  name_not?: InputMaybe<Scalars['String']>;
  name_not_in?: InputMaybe<Array<Scalars['String']>>;
  name_starts_with?: InputMaybe<Scalars['String']>;
  userRegistrationRequired?: InputMaybe<Scalars['Boolean']>;
  visibleInSearch?: InputMaybe<Scalars['Boolean']>;
};

export type OtpData = {
  __typename?: 'OtpData';
  otpToken: Scalars['String'];
};

/** Information about pagination in a connection. */
export type PageInfo = {
  __typename?: 'PageInfo';
  currPageNo?: Maybe<Scalars['Int']>;
  /** When paginating forwards, are there more items? */
  hasNextPage: Scalars['Boolean'];
  /** When paginating backwards, are there more items? */
  hasPreviousPage: Scalars['Boolean'];
  nextPageNo?: Maybe<Scalars['Int']>;
  prevPageNo?: Maybe<Scalars['Int']>;
  totalPages?: Maybe<Scalars['Int']>;
};

export type PaginationDirection =
  | 'BACKWARD'
  | 'FORWARD';

export type Plugin = {
  __typename?: 'Plugin';
  _id: Scalars['ID'];
  pluginCreatedBy: Scalars['String'];
  pluginDesc: Scalars['String'];
  pluginName: Scalars['String'];
  uninstalledOrgs?: Maybe<Array<Scalars['ID']>>;
};

export type PluginField = {
  __typename?: 'PluginField';
  createdAt: Scalars['DateTime'];
  key: Scalars['String'];
  status: Status;
  value: Scalars['String'];
};

export type PluginFieldInput = {
  key: Scalars['String'];
  value: Scalars['String'];
};

export type PluginInput = {
  fields?: InputMaybe<Array<InputMaybe<PluginFieldInput>>>;
  orgId: Scalars['ID'];
  pluginKey?: InputMaybe<Scalars['String']>;
  pluginName: Scalars['String'];
  pluginType?: InputMaybe<Type>;
};

export type Post = {
  __typename?: 'Post';
  _id?: Maybe<Scalars['ID']>;
  commentCount?: Maybe<Scalars['Int']>;
  comments?: Maybe<Array<Maybe<Comment>>>;
  createdAt: Scalars['DateTime'];
  creator?: Maybe<User>;
  imageUrl?: Maybe<Scalars['URL']>;
  likeCount?: Maybe<Scalars['Int']>;
  likedBy?: Maybe<Array<Maybe<User>>>;
  organization: Organization;
  pinned?: Maybe<Scalars['Boolean']>;
  text: Scalars['String'];
  title?: Maybe<Scalars['String']>;
  updatedAt: Scalars['DateTime'];
  videoUrl?: Maybe<Scalars['URL']>;
};

/** A connection to a list of items. */
export type PostConnection = {
  __typename?: 'PostConnection';
  aggregate: AggregatePost;
  /** A list of edges. */
  edges: Array<Maybe<Post>>;
  /** Information to aid in pagination. */
  pageInfo: PageInfo;
};

export type PostInput = {
  _id?: InputMaybe<Scalars['ID']>;
  imageUrl?: InputMaybe<Scalars['URL']>;
  organizationId: Scalars['ID'];
  pinned?: InputMaybe<Scalars['Boolean']>;
  text: Scalars['String'];
  title?: InputMaybe<Scalars['String']>;
  videoUrl?: InputMaybe<Scalars['URL']>;
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
  imageUrl?: InputMaybe<Scalars['String']>;
  text?: InputMaybe<Scalars['String']>;
  title?: InputMaybe<Scalars['String']>;
  videoUrl?: InputMaybe<Scalars['String']>;
};

export type PostWhereInput = {
  id?: InputMaybe<Scalars['ID']>;
  id_contains?: InputMaybe<Scalars['ID']>;
  id_in?: InputMaybe<Array<Scalars['ID']>>;
  id_not?: InputMaybe<Scalars['ID']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']>>;
  id_starts_with?: InputMaybe<Scalars['ID']>;
  text?: InputMaybe<Scalars['String']>;
  text_contains?: InputMaybe<Scalars['String']>;
  text_in?: InputMaybe<Array<Scalars['String']>>;
  text_not?: InputMaybe<Scalars['String']>;
  text_not_in?: InputMaybe<Array<Scalars['String']>>;
  text_starts_with?: InputMaybe<Scalars['String']>;
  title?: InputMaybe<Scalars['String']>;
  title_contains?: InputMaybe<Scalars['String']>;
  title_in?: InputMaybe<Array<Scalars['String']>>;
  title_not?: InputMaybe<Scalars['String']>;
  title_not_in?: InputMaybe<Array<Scalars['String']>>;
  title_starts_with?: InputMaybe<Scalars['String']>;
};

export type Query = {
  __typename?: 'Query';
  actionItem?: Maybe<ActionItem>;
  actionItemCategoriesByOrganization?: Maybe<Array<Maybe<ActionItemCategory>>>;
  actionItemCategory?: Maybe<ActionItemCategory>;
  actionItemsByEvent?: Maybe<Array<Maybe<ActionItem>>>;
  actionItemsByOrganization?: Maybe<Array<Maybe<ActionItem>>>;
  adminPlugin?: Maybe<Array<Maybe<Plugin>>>;
  checkAuth: User;
  customDataByOrganization: Array<UserCustomData>;
  customFieldsByOrganization?: Maybe<Array<Maybe<OrganizationCustomField>>>;
  directChatsByUserID?: Maybe<Array<Maybe<DirectChat>>>;
  directChatsMessagesByChatID?: Maybe<Array<Maybe<DirectChatMessage>>>;
  event?: Maybe<Event>;
  eventsByOrganization?: Maybe<Array<Maybe<Event>>>;
  eventsByOrganizationConnection: Array<Event>;
  getAdvertisements?: Maybe<Array<Maybe<Advertisement>>>;
  getDonationById: Donation;
  getDonationByOrgId?: Maybe<Array<Maybe<Donation>>>;
  getDonationByOrgIdConnection: Array<Donation>;
  getPlugins?: Maybe<Array<Maybe<Plugin>>>;
  getlanguage?: Maybe<Array<Maybe<Translation>>>;
  hasSubmittedFeedback?: Maybe<Scalars['Boolean']>;
  isSampleOrganization: Scalars['Boolean'];
  joinedOrganizations?: Maybe<Array<Maybe<Organization>>>;
  me: User;
  myLanguage?: Maybe<Scalars['String']>;
  organizations?: Maybe<Array<Maybe<Organization>>>;
  organizationsConnection: Array<Maybe<Organization>>;
  organizationsMemberConnection: UserConnection;
  plugin?: Maybe<Array<Maybe<Plugin>>>;
  post?: Maybe<Post>;
  postsByOrganization?: Maybe<Array<Maybe<Post>>>;
  postsByOrganizationConnection?: Maybe<PostConnection>;
  registeredEventsByUser?: Maybe<Array<Maybe<Event>>>;
  registrantsByEvent?: Maybe<Array<Maybe<User>>>;
  user: User;
  userLanguage?: Maybe<Scalars['String']>;
  users?: Maybe<Array<Maybe<User>>>;
  usersConnection: Array<Maybe<User>>;
};


export type QueryActionItemArgs = {
  id: Scalars['ID'];
};


export type QueryActionItemCategoriesByOrganizationArgs = {
  organizationId: Scalars['ID'];
};


export type QueryActionItemCategoryArgs = {
  id: Scalars['ID'];
};


export type QueryActionItemsByEventArgs = {
  eventId: Scalars['ID'];
};


export type QueryActionItemsByOrganizationArgs = {
  organizationId: Scalars['ID'];
};


export type QueryAdminPluginArgs = {
  orgId: Scalars['ID'];
};


export type QueryCustomDataByOrganizationArgs = {
  organizationId: Scalars['ID'];
};


export type QueryCustomFieldsByOrganizationArgs = {
  id: Scalars['ID'];
};


export type QueryDirectChatsByUserIdArgs = {
  id: Scalars['ID'];
};


export type QueryDirectChatsMessagesByChatIdArgs = {
  id: Scalars['ID'];
};


export type QueryEventArgs = {
  id: Scalars['ID'];
};


export type QueryEventsByOrganizationArgs = {
  id?: InputMaybe<Scalars['ID']>;
  orderBy?: InputMaybe<EventOrderByInput>;
};


export type QueryEventsByOrganizationConnectionArgs = {
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<EventOrderByInput>;
  skip?: InputMaybe<Scalars['Int']>;
  where?: InputMaybe<EventWhereInput>;
};


export type QueryGetDonationByIdArgs = {
  id: Scalars['ID'];
};


export type QueryGetDonationByOrgIdArgs = {
  orgId: Scalars['ID'];
};


export type QueryGetDonationByOrgIdConnectionArgs = {
  first?: InputMaybe<Scalars['Int']>;
  orgId: Scalars['ID'];
  skip?: InputMaybe<Scalars['Int']>;
  where?: InputMaybe<DonationWhereInput>;
};


export type QueryGetlanguageArgs = {
  lang_code: Scalars['String'];
};


export type QueryHasSubmittedFeedbackArgs = {
  eventId: Scalars['ID'];
  userId: Scalars['ID'];
};


export type QueryIsSampleOrganizationArgs = {
  id: Scalars['ID'];
};


export type QueryJoinedOrganizationsArgs = {
  id?: InputMaybe<Scalars['ID']>;
};


export type QueryOrganizationsArgs = {
  id?: InputMaybe<Scalars['ID']>;
  orderBy?: InputMaybe<OrganizationOrderByInput>;
};


export type QueryOrganizationsConnectionArgs = {
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<OrganizationOrderByInput>;
  skip?: InputMaybe<Scalars['Int']>;
  where?: InputMaybe<OrganizationWhereInput>;
};


export type QueryOrganizationsMemberConnectionArgs = {
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<UserOrderByInput>;
  orgId: Scalars['ID'];
  skip?: InputMaybe<Scalars['Int']>;
  where?: InputMaybe<UserWhereInput>;
};


export type QueryPluginArgs = {
  orgId: Scalars['ID'];
};


export type QueryPostArgs = {
  id: Scalars['ID'];
};


export type QueryPostsByOrganizationArgs = {
  id: Scalars['ID'];
  orderBy?: InputMaybe<PostOrderByInput>;
};


export type QueryPostsByOrganizationConnectionArgs = {
  first?: InputMaybe<Scalars['Int']>;
  id: Scalars['ID'];
  orderBy?: InputMaybe<PostOrderByInput>;
  skip?: InputMaybe<Scalars['Int']>;
  where?: InputMaybe<PostWhereInput>;
};


export type QueryRegisteredEventsByUserArgs = {
  id?: InputMaybe<Scalars['ID']>;
  orderBy?: InputMaybe<EventOrderByInput>;
};


export type QueryRegistrantsByEventArgs = {
  id: Scalars['ID'];
};


export type QueryUserArgs = {
  id: Scalars['ID'];
};


export type QueryUserLanguageArgs = {
  userId: Scalars['ID'];
};


export type QueryUsersArgs = {
  adminApproved?: InputMaybe<Scalars['Boolean']>;
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<UserOrderByInput>;
  skip?: InputMaybe<Scalars['Int']>;
  userType?: InputMaybe<Scalars['String']>;
  where?: InputMaybe<UserWhereInput>;
};


export type QueryUsersConnectionArgs = {
  first?: InputMaybe<Scalars['Int']>;
  orderBy?: InputMaybe<UserOrderByInput>;
  skip?: InputMaybe<Scalars['Int']>;
  where?: InputMaybe<UserWhereInput>;
};

export type RecaptchaVerification = {
  recaptchaToken: Scalars['String'];
};

export type Recurrance =
  | 'DAILY'
  | 'MONTHLY'
  | 'ONCE'
  | 'WEEKLY'
  | 'YEARLY';

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
  tagId: Scalars['ID'];
  userId: Scalars['ID'];
};

export type Translation = {
  __typename?: 'Translation';
  en_value?: Maybe<Scalars['String']>;
  lang_code?: Maybe<Scalars['String']>;
  translation?: Maybe<Scalars['String']>;
  verified?: Maybe<Scalars['Boolean']>;
};

export type Type =
  | 'PRIVATE'
  | 'UNIVERSAL';

export type UnauthenticatedError = Error & {
  __typename?: 'UnauthenticatedError';
  message: Scalars['String'];
};

export type UnauthorizedError = Error & {
  __typename?: 'UnauthorizedError';
  message: Scalars['String'];
};

export type UpdateActionItemCategoryInput = {
  isDisabled?: InputMaybe<Scalars['Boolean']>;
  name?: InputMaybe<Scalars['String']>;
};

export type UpdateActionItemInput = {
  assigneeId?: InputMaybe<Scalars['ID']>;
  completionDate?: InputMaybe<Scalars['Date']>;
  dueDate?: InputMaybe<Scalars['Date']>;
  isCompleted?: InputMaybe<Scalars['Boolean']>;
  postCompletionNotes?: InputMaybe<Scalars['String']>;
  preCompletionNotes?: InputMaybe<Scalars['String']>;
};

export type UpdateAdvertisementInput = {
  _id: Scalars['ID'];
  endDate?: InputMaybe<Scalars['Date']>;
  link?: InputMaybe<Scalars['String']>;
  name?: InputMaybe<Scalars['String']>;
  startDate?: InputMaybe<Scalars['Date']>;
  type?: InputMaybe<AdvertisementType>;
};

export type UpdateAdvertisementPayload = {
  __typename?: 'UpdateAdvertisementPayload';
  advertisement?: Maybe<Advertisement>;
};

export type UpdateEventInput = {
  allDay?: InputMaybe<Scalars['Boolean']>;
  description?: InputMaybe<Scalars['String']>;
  endDate?: InputMaybe<Scalars['Date']>;
  endTime?: InputMaybe<Scalars['Time']>;
  isPublic?: InputMaybe<Scalars['Boolean']>;
  isRegisterable?: InputMaybe<Scalars['Boolean']>;
  latitude?: InputMaybe<Scalars['Latitude']>;
  location?: InputMaybe<Scalars['String']>;
  longitude?: InputMaybe<Scalars['Longitude']>;
  recurrance?: InputMaybe<Recurrance>;
  recurring?: InputMaybe<Scalars['Boolean']>;
  startDate?: InputMaybe<Scalars['Date']>;
  startTime?: InputMaybe<Scalars['Time']>;
  title?: InputMaybe<Scalars['String']>;
};

export type UpdateOrganizationInput = {
  address?: InputMaybe<AddressInput>;
  description?: InputMaybe<Scalars['String']>;
  name?: InputMaybe<Scalars['String']>;
  userRegistrationRequired?: InputMaybe<Scalars['Boolean']>;
  visibleInSearch?: InputMaybe<Scalars['Boolean']>;
};

export type UpdateUserInput = {
  address?: InputMaybe<AddressInput>;
  birthDate?: InputMaybe<Scalars['Date']>;
  educationGrade?: InputMaybe<EducationGrade>;
  email?: InputMaybe<Scalars['EmailAddress']>;
  employmentStatus?: InputMaybe<EmploymentStatus>;
  firstName?: InputMaybe<Scalars['String']>;
  gender?: InputMaybe<Gender>;
  lastName?: InputMaybe<Scalars['String']>;
  maritalStatus?: InputMaybe<MaritalStatus>;
  phone?: InputMaybe<UserPhoneInput>;
};

export type UpdateUserPasswordInput = {
  confirmNewPassword: Scalars['String'];
  newPassword: Scalars['String'];
  previousPassword: Scalars['String'];
};

export type UpdateUserTagInput = {
  _id: Scalars['ID'];
  name: Scalars['String'];
};

export type UpdateUserTypeInput = {
  id?: InputMaybe<Scalars['ID']>;
  userType?: InputMaybe<Scalars['String']>;
};

export type User = {
  __typename?: 'User';
  _id: Scalars['ID'];
  address?: Maybe<Address>;
  adminApproved?: Maybe<Scalars['Boolean']>;
  adminFor?: Maybe<Array<Maybe<Organization>>>;
  appLanguageCode: Scalars['String'];
  birthDate?: Maybe<Scalars['Date']>;
  createdAt: Scalars['DateTime'];
  createdEvents?: Maybe<Array<Maybe<Event>>>;
  createdOrganizations?: Maybe<Array<Maybe<Organization>>>;
  educationGrade?: Maybe<EducationGrade>;
  email: Scalars['EmailAddress'];
  employmentStatus?: Maybe<EmploymentStatus>;
  eventAdmin?: Maybe<Array<Maybe<Event>>>;
  firstName: Scalars['String'];
  gender?: Maybe<Gender>;
  image?: Maybe<Scalars['String']>;
  joinedOrganizations?: Maybe<Array<Maybe<Organization>>>;
  lastName: Scalars['String'];
  maritalStatus?: Maybe<MaritalStatus>;
  membershipRequests?: Maybe<Array<Maybe<MembershipRequest>>>;
  organizationsBlockedBy?: Maybe<Array<Maybe<Organization>>>;
  phone?: Maybe<UserPhone>;
  pluginCreationAllowed: Scalars['Boolean'];
  registeredEvents?: Maybe<Array<Maybe<Event>>>;
  tagsAssignedWith?: Maybe<UserTagsConnection>;
  tokenVersion: Scalars['Int'];
  updatedAt: Scalars['DateTime'];
  userType: UserType;
};


export type UserTagsAssignedWithArgs = {
  after?: InputMaybe<Scalars['String']>;
  before?: InputMaybe<Scalars['String']>;
  first?: InputMaybe<Scalars['PositiveInt']>;
  last?: InputMaybe<Scalars['PositiveInt']>;
  organizationId?: InputMaybe<Scalars['ID']>;
};

export type UserAndOrganizationInput = {
  organizationId: Scalars['ID'];
  userId: Scalars['ID'];
};

export type UserConnection = {
  __typename?: 'UserConnection';
  aggregate: AggregateUser;
  edges: Array<Maybe<User>>;
  pageInfo: PageInfo;
};

export type UserCustomData = {
  __typename?: 'UserCustomData';
  _id: Scalars['ID'];
  organizationId: Scalars['ID'];
  userId: Scalars['ID'];
  values: Scalars['JSON'];
};

export type UserEdge = {
  __typename?: 'UserEdge';
  cursor: Scalars['String'];
  node: User;
};

export type UserFamily = {
  __typename?: 'UserFamily';
  _id: Scalars['ID'];
  admins: Array<User>;
  creator: User;
  title?: Maybe<Scalars['String']>;
  users: Array<User>;
};

export type UserInput = {
  appLanguageCode?: InputMaybe<Scalars['String']>;
  email: Scalars['EmailAddress'];
  firstName: Scalars['String'];
  lastName: Scalars['String'];
  organizationUserBelongsToId?: InputMaybe<Scalars['ID']>;
  password: Scalars['String'];
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
  home?: Maybe<Scalars['PhoneNumber']>;
  mobile?: Maybe<Scalars['PhoneNumber']>;
  work?: Maybe<Scalars['PhoneNumber']>;
};

export type UserPhoneInput = {
  home?: InputMaybe<Scalars['PhoneNumber']>;
  mobile?: InputMaybe<Scalars['PhoneNumber']>;
  work?: InputMaybe<Scalars['PhoneNumber']>;
};

export type UserTag = {
  __typename?: 'UserTag';
  _id: Scalars['ID'];
  childTags: UserTagsConnectionResult;
  name: Scalars['String'];
  organization?: Maybe<Organization>;
  parentTag?: Maybe<UserTag>;
  usersAssignedTo: UsersConnectionResult;
};


export type UserTagChildTagsArgs = {
  input: UserTagsConnectionInput;
};


export type UserTagUsersAssignedToArgs = {
  input: UsersConnectionInput;
};

export type UserTagEdge = {
  __typename?: 'UserTagEdge';
  cursor: Scalars['String'];
  node: UserTag;
};

export type UserTagsConnection = {
  __typename?: 'UserTagsConnection';
  edges: Array<UserTagEdge>;
  pageInfo: ConnectionPageInfo;
};

export type UserTagsConnectionInput = {
  cursor?: InputMaybe<Scalars['String']>;
  direction: PaginationDirection;
  limit: Scalars['PositiveInt'];
};

export type UserTagsConnectionResult = {
  __typename?: 'UserTagsConnectionResult';
  data?: Maybe<UserTagsConnection>;
  errors: Array<ConnectionError>;
};

export type UserType =
  | 'ADMIN'
  | 'NON_USER'
  | 'SUPERADMIN'
  | 'USER';

export type UserWhereInput = {
  admin_for?: InputMaybe<Scalars['ID']>;
  appLanguageCode?: InputMaybe<Scalars['String']>;
  appLanguageCode_contains?: InputMaybe<Scalars['String']>;
  appLanguageCode_in?: InputMaybe<Array<Scalars['String']>>;
  appLanguageCode_not?: InputMaybe<Scalars['String']>;
  appLanguageCode_not_in?: InputMaybe<Array<Scalars['String']>>;
  appLanguageCode_starts_with?: InputMaybe<Scalars['String']>;
  email?: InputMaybe<Scalars['EmailAddress']>;
  email_contains?: InputMaybe<Scalars['EmailAddress']>;
  email_in?: InputMaybe<Array<Scalars['EmailAddress']>>;
  email_not?: InputMaybe<Scalars['EmailAddress']>;
  email_not_in?: InputMaybe<Array<Scalars['EmailAddress']>>;
  email_starts_with?: InputMaybe<Scalars['EmailAddress']>;
  event_title_contains?: InputMaybe<Scalars['String']>;
  firstName?: InputMaybe<Scalars['String']>;
  firstName_contains?: InputMaybe<Scalars['String']>;
  firstName_in?: InputMaybe<Array<Scalars['String']>>;
  firstName_not?: InputMaybe<Scalars['String']>;
  firstName_not_in?: InputMaybe<Array<Scalars['String']>>;
  firstName_starts_with?: InputMaybe<Scalars['String']>;
  id?: InputMaybe<Scalars['ID']>;
  id_contains?: InputMaybe<Scalars['ID']>;
  id_in?: InputMaybe<Array<Scalars['ID']>>;
  id_not?: InputMaybe<Scalars['ID']>;
  id_not_in?: InputMaybe<Array<Scalars['ID']>>;
  id_starts_with?: InputMaybe<Scalars['ID']>;
  lastName?: InputMaybe<Scalars['String']>;
  lastName_contains?: InputMaybe<Scalars['String']>;
  lastName_in?: InputMaybe<Array<Scalars['String']>>;
  lastName_not?: InputMaybe<Scalars['String']>;
  lastName_not_in?: InputMaybe<Array<Scalars['String']>>;
  lastName_starts_with?: InputMaybe<Scalars['String']>;
};

export type UsersConnection = {
  __typename?: 'UsersConnection';
  edges: Array<UserEdge>;
  pageInfo: ConnectionPageInfo;
};

export type UsersConnectionInput = {
  cursor?: InputMaybe<Scalars['String']>;
  direction: PaginationDirection;
  limit: Scalars['PositiveInt'];
};

export type UsersConnectionResult = {
  __typename?: 'UsersConnectionResult';
  data?: Maybe<UsersConnection>;
  errors: Array<ConnectionError>;
};

export type CreateChatInput = {
  organizationId: Scalars['ID'];
  userIds: Array<Scalars['ID']>;
};

export type CreateGroupChatInput = {
  organizationId: Scalars['ID'];
  title: Scalars['String'];
  userIds: Array<Scalars['ID']>;
};

export type CreateUserFamilyInput = {
  title: Scalars['String'];
  userIds: Array<Scalars['ID']>;
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

/** Mapping between all available schema types and the resolvers types */
export type ResolversTypes = {
  ActionItem: ResolverTypeWrapper<InterfaceActionItemModel>;
  ActionItemCategory: ResolverTypeWrapper<InterfaceActionItemCategoryModel>;
  Address: ResolverTypeWrapper<Address>;
  AddressInput: AddressInput;
  Advertisement: ResolverTypeWrapper<Omit<Advertisement, 'creator'> & { creator?: Maybe<ResolversTypes['User']> }>;
  AdvertisementType: AdvertisementType;
  AggregatePost: ResolverTypeWrapper<AggregatePost>;
  AggregateUser: ResolverTypeWrapper<AggregateUser>;
  Any: ResolverTypeWrapper<Scalars['Any']>;
  AuthData: ResolverTypeWrapper<Omit<AuthData, 'user'> & { user: ResolversTypes['User'] }>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>;
  CheckIn: ResolverTypeWrapper<InterfaceCheckInModel>;
  CheckInInput: CheckInInput;
  CheckInStatus: ResolverTypeWrapper<Omit<CheckInStatus, 'checkIn' | 'user'> & { checkIn?: Maybe<ResolversTypes['CheckIn']>, user: ResolversTypes['User'] }>;
  Comment: ResolverTypeWrapper<InterfaceCommentModel>;
  CommentInput: CommentInput;
  ConnectionError: ResolversTypes['InvalidCursor'] | ResolversTypes['MaximumValueError'];
  ConnectionPageInfo: ResolverTypeWrapper<ConnectionPageInfo>;
  CountryCode: ResolverTypeWrapper<Scalars['CountryCode']>;
  CreateActionItemInput: CreateActionItemInput;
  CreateUserTagInput: CreateUserTagInput;
  CursorPaginationInput: CursorPaginationInput;
  Date: ResolverTypeWrapper<Scalars['Date']>;
  DateTime: ResolverTypeWrapper<Scalars['DateTime']>;
  DeletePayload: ResolverTypeWrapper<DeletePayload>;
  DirectChat: ResolverTypeWrapper<InterfaceDirectChatModel>;
  DirectChatMessage: ResolverTypeWrapper<InterfaceDirectChatMessageModel>;
  Donation: ResolverTypeWrapper<InterfaceDonationModel>;
  DonationWhereInput: DonationWhereInput;
  EducationGrade: EducationGrade;
  EmailAddress: ResolverTypeWrapper<Scalars['EmailAddress']>;
  EmploymentStatus: EmploymentStatus;
  Error: ResolversTypes['UnauthenticatedError'] | ResolversTypes['UnauthorizedError'];
  Event: ResolverTypeWrapper<InterfaceEventModel>;
  EventAttendeeInput: EventAttendeeInput;
  EventInput: EventInput;
  EventOrderByInput: EventOrderByInput;
  EventWhereInput: EventWhereInput;
  ExtendSession: ResolverTypeWrapper<ExtendSession>;
  Feedback: ResolverTypeWrapper<InterfaceFeedbackModel>;
  FeedbackInput: FeedbackInput;
  FieldError: ResolversTypes['InvalidCursor'] | ResolversTypes['MaximumLengthError'] | ResolversTypes['MaximumValueError'] | ResolversTypes['MinimumLengthError'] | ResolversTypes['MinimumValueError'];
  Float: ResolverTypeWrapper<Scalars['Float']>;
  ForgotPasswordData: ForgotPasswordData;
  Gender: Gender;
  Group: ResolverTypeWrapper<InterfaceGroupModel>;
  GroupChat: ResolverTypeWrapper<InterfaceGroupChatModel>;
  GroupChatMessage: ResolverTypeWrapper<InterfaceGroupChatMessageModel>;
  ID: ResolverTypeWrapper<Scalars['ID']>;
  Int: ResolverTypeWrapper<Scalars['Int']>;
  InvalidCursor: ResolverTypeWrapper<InvalidCursor>;
  JSON: ResolverTypeWrapper<Scalars['JSON']>;
  Language: ResolverTypeWrapper<InterfaceLanguageModel>;
  LanguageInput: LanguageInput;
  LanguageModel: ResolverTypeWrapper<LanguageModel>;
  Latitude: ResolverTypeWrapper<Scalars['Latitude']>;
  LoginInput: LoginInput;
  Longitude: ResolverTypeWrapper<Scalars['Longitude']>;
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
  PhoneNumber: ResolverTypeWrapper<Scalars['PhoneNumber']>;
  Plugin: ResolverTypeWrapper<InterfacePluginModel>;
  PluginField: ResolverTypeWrapper<InterfacePluginFieldModel>;
  PluginFieldInput: PluginFieldInput;
  PluginInput: PluginInput;
  PositiveInt: ResolverTypeWrapper<Scalars['PositiveInt']>;
  Post: ResolverTypeWrapper<InterfacePostModel>;
  PostConnection: ResolverTypeWrapper<Omit<PostConnection, 'edges'> & { edges: Array<Maybe<ResolversTypes['Post']>> }>;
  PostInput: PostInput;
  PostOrderByInput: PostOrderByInput;
  PostUpdateInput: PostUpdateInput;
  PostWhereInput: PostWhereInput;
  Query: ResolverTypeWrapper<{}>;
  RecaptchaVerification: RecaptchaVerification;
  Recurrance: Recurrance;
  Status: Status;
  String: ResolverTypeWrapper<Scalars['String']>;
  Subscription: ResolverTypeWrapper<{}>;
  Time: ResolverTypeWrapper<Scalars['Time']>;
  ToggleUserTagAssignInput: ToggleUserTagAssignInput;
  Translation: ResolverTypeWrapper<Translation>;
  Type: Type;
  URL: ResolverTypeWrapper<Scalars['URL']>;
  UnauthenticatedError: ResolverTypeWrapper<UnauthenticatedError>;
  UnauthorizedError: ResolverTypeWrapper<UnauthorizedError>;
  UpdateActionItemCategoryInput: UpdateActionItemCategoryInput;
  UpdateActionItemInput: UpdateActionItemInput;
  UpdateAdvertisementInput: UpdateAdvertisementInput;
  UpdateAdvertisementPayload: ResolverTypeWrapper<Omit<UpdateAdvertisementPayload, 'advertisement'> & { advertisement?: Maybe<ResolversTypes['Advertisement']> }>;
  UpdateEventInput: UpdateEventInput;
  UpdateOrganizationInput: UpdateOrganizationInput;
  UpdateUserInput: UpdateUserInput;
  UpdateUserPasswordInput: UpdateUserPasswordInput;
  UpdateUserTagInput: UpdateUserTagInput;
  UpdateUserTypeInput: UpdateUserTypeInput;
  Upload: ResolverTypeWrapper<Scalars['Upload']>;
  User: ResolverTypeWrapper<InterfaceUserModel>;
  UserAndOrganizationInput: UserAndOrganizationInput;
  UserConnection: ResolverTypeWrapper<Omit<UserConnection, 'edges'> & { edges: Array<Maybe<ResolversTypes['User']>> }>;
  UserCustomData: ResolverTypeWrapper<UserCustomData>;
  UserEdge: ResolverTypeWrapper<Omit<UserEdge, 'node'> & { node: ResolversTypes['User'] }>;
  UserFamily: ResolverTypeWrapper<InterfaceUserFamilyModel>;
  UserInput: UserInput;
  UserOrderByInput: UserOrderByInput;
  UserPhone: ResolverTypeWrapper<UserPhone>;
  UserPhoneInput: UserPhoneInput;
  UserTag: ResolverTypeWrapper<InterfaceOrganizationTagUserModel>;
  UserTagEdge: ResolverTypeWrapper<Omit<UserTagEdge, 'node'> & { node: ResolversTypes['UserTag'] }>;
  UserTagsConnection: ResolverTypeWrapper<Omit<UserTagsConnection, 'edges'> & { edges: Array<ResolversTypes['UserTagEdge']> }>;
  UserTagsConnectionInput: UserTagsConnectionInput;
  UserTagsConnectionResult: ResolverTypeWrapper<Omit<UserTagsConnectionResult, 'data' | 'errors'> & { data?: Maybe<ResolversTypes['UserTagsConnection']>, errors: Array<ResolversTypes['ConnectionError']> }>;
  UserType: UserType;
  UserWhereInput: UserWhereInput;
  UsersConnection: ResolverTypeWrapper<Omit<UsersConnection, 'edges'> & { edges: Array<ResolversTypes['UserEdge']> }>;
  UsersConnectionInput: UsersConnectionInput;
  UsersConnectionResult: ResolverTypeWrapper<Omit<UsersConnectionResult, 'data' | 'errors'> & { data?: Maybe<ResolversTypes['UsersConnection']>, errors: Array<ResolversTypes['ConnectionError']> }>;
  createChatInput: CreateChatInput;
  createGroupChatInput: CreateGroupChatInput;
  createUserFamilyInput: CreateUserFamilyInput;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  ActionItem: InterfaceActionItemModel;
  ActionItemCategory: InterfaceActionItemCategoryModel;
  Address: Address;
  AddressInput: AddressInput;
  Advertisement: Omit<Advertisement, 'creator'> & { creator?: Maybe<ResolversParentTypes['User']> };
  AggregatePost: AggregatePost;
  AggregateUser: AggregateUser;
  Any: Scalars['Any'];
  AuthData: Omit<AuthData, 'user'> & { user: ResolversParentTypes['User'] };
  Boolean: Scalars['Boolean'];
  CheckIn: InterfaceCheckInModel;
  CheckInInput: CheckInInput;
  CheckInStatus: Omit<CheckInStatus, 'checkIn' | 'user'> & { checkIn?: Maybe<ResolversParentTypes['CheckIn']>, user: ResolversParentTypes['User'] };
  Comment: InterfaceCommentModel;
  CommentInput: CommentInput;
  ConnectionError: ResolversParentTypes['InvalidCursor'] | ResolversParentTypes['MaximumValueError'];
  ConnectionPageInfo: ConnectionPageInfo;
  CountryCode: Scalars['CountryCode'];
  CreateActionItemInput: CreateActionItemInput;
  CreateUserTagInput: CreateUserTagInput;
  CursorPaginationInput: CursorPaginationInput;
  Date: Scalars['Date'];
  DateTime: Scalars['DateTime'];
  DeletePayload: DeletePayload;
  DirectChat: InterfaceDirectChatModel;
  DirectChatMessage: InterfaceDirectChatMessageModel;
  Donation: InterfaceDonationModel;
  DonationWhereInput: DonationWhereInput;
  EmailAddress: Scalars['EmailAddress'];
  Error: ResolversParentTypes['UnauthenticatedError'] | ResolversParentTypes['UnauthorizedError'];
  Event: InterfaceEventModel;
  EventAttendeeInput: EventAttendeeInput;
  EventInput: EventInput;
  EventWhereInput: EventWhereInput;
  ExtendSession: ExtendSession;
  Feedback: InterfaceFeedbackModel;
  FeedbackInput: FeedbackInput;
  FieldError: ResolversParentTypes['InvalidCursor'] | ResolversParentTypes['MaximumLengthError'] | ResolversParentTypes['MaximumValueError'] | ResolversParentTypes['MinimumLengthError'] | ResolversParentTypes['MinimumValueError'];
  Float: Scalars['Float'];
  ForgotPasswordData: ForgotPasswordData;
  Group: InterfaceGroupModel;
  GroupChat: InterfaceGroupChatModel;
  GroupChatMessage: InterfaceGroupChatMessageModel;
  ID: Scalars['ID'];
  Int: Scalars['Int'];
  InvalidCursor: InvalidCursor;
  JSON: Scalars['JSON'];
  Language: InterfaceLanguageModel;
  LanguageInput: LanguageInput;
  LanguageModel: LanguageModel;
  Latitude: Scalars['Latitude'];
  LoginInput: LoginInput;
  Longitude: Scalars['Longitude'];
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
  PhoneNumber: Scalars['PhoneNumber'];
  Plugin: InterfacePluginModel;
  PluginField: InterfacePluginFieldModel;
  PluginFieldInput: PluginFieldInput;
  PluginInput: PluginInput;
  PositiveInt: Scalars['PositiveInt'];
  Post: InterfacePostModel;
  PostConnection: Omit<PostConnection, 'edges'> & { edges: Array<Maybe<ResolversParentTypes['Post']>> };
  PostInput: PostInput;
  PostUpdateInput: PostUpdateInput;
  PostWhereInput: PostWhereInput;
  Query: {};
  RecaptchaVerification: RecaptchaVerification;
  String: Scalars['String'];
  Subscription: {};
  Time: Scalars['Time'];
  ToggleUserTagAssignInput: ToggleUserTagAssignInput;
  Translation: Translation;
  URL: Scalars['URL'];
  UnauthenticatedError: UnauthenticatedError;
  UnauthorizedError: UnauthorizedError;
  UpdateActionItemCategoryInput: UpdateActionItemCategoryInput;
  UpdateActionItemInput: UpdateActionItemInput;
  UpdateAdvertisementInput: UpdateAdvertisementInput;
  UpdateAdvertisementPayload: Omit<UpdateAdvertisementPayload, 'advertisement'> & { advertisement?: Maybe<ResolversParentTypes['Advertisement']> };
  UpdateEventInput: UpdateEventInput;
  UpdateOrganizationInput: UpdateOrganizationInput;
  UpdateUserInput: UpdateUserInput;
  UpdateUserPasswordInput: UpdateUserPasswordInput;
  UpdateUserTagInput: UpdateUserTagInput;
  UpdateUserTypeInput: UpdateUserTypeInput;
  Upload: Scalars['Upload'];
  User: InterfaceUserModel;
  UserAndOrganizationInput: UserAndOrganizationInput;
  UserConnection: Omit<UserConnection, 'edges'> & { edges: Array<Maybe<ResolversParentTypes['User']>> };
  UserCustomData: UserCustomData;
  UserEdge: Omit<UserEdge, 'node'> & { node: ResolversParentTypes['User'] };
  UserFamily: InterfaceUserFamilyModel;
  UserInput: UserInput;
  UserPhone: UserPhone;
  UserPhoneInput: UserPhoneInput;
  UserTag: InterfaceOrganizationTagUserModel;
  UserTagEdge: Omit<UserTagEdge, 'node'> & { node: ResolversParentTypes['UserTag'] };
  UserTagsConnection: Omit<UserTagsConnection, 'edges'> & { edges: Array<ResolversParentTypes['UserTagEdge']> };
  UserTagsConnectionInput: UserTagsConnectionInput;
  UserTagsConnectionResult: Omit<UserTagsConnectionResult, 'data' | 'errors'> & { data?: Maybe<ResolversParentTypes['UserTagsConnection']>, errors: Array<ResolversParentTypes['ConnectionError']> };
  UserWhereInput: UserWhereInput;
  UsersConnection: Omit<UsersConnection, 'edges'> & { edges: Array<ResolversParentTypes['UserEdge']> };
  UsersConnectionInput: UsersConnectionInput;
  UsersConnectionResult: Omit<UsersConnectionResult, 'data' | 'errors'> & { data?: Maybe<ResolversParentTypes['UsersConnection']>, errors: Array<ResolversParentTypes['ConnectionError']> };
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
  link?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  orgId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  startDate?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  type?: Resolver<ResolversTypes['AdvertisementType'], ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
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
  allotedRoom?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  allotedSeat?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
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
  endCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  hasNextPage?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  hasPreviousPage?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  startCursor?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface CountryCodeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['CountryCode'], any> {
  name: 'CountryCode';
}

export interface DateScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Date'], any> {
  name: 'Date';
}

export interface DateTimeScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['DateTime'], any> {
  name: 'DateTime';
}

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
  allDay?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  attendees?: Resolver<Maybe<Array<Maybe<ResolversTypes['User']>>>, ParentType, ContextType>;
  attendeesCheckInStatus?: Resolver<Array<ResolversTypes['CheckInStatus']>, ParentType, ContextType>;
  averageFeedbackScore?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  creator?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  endDate?: Resolver<ResolversTypes['Date'], ParentType, ContextType>;
  endTime?: Resolver<Maybe<ResolversTypes['Time']>, ParentType, ContextType>;
  feedback?: Resolver<Array<ResolversTypes['Feedback']>, ParentType, ContextType>;
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
  createActionItem?: Resolver<ResolversTypes['ActionItem'], ParentType, ContextType, RequireFields<MutationCreateActionItemArgs, 'actionItemCategoryId' | 'data'>>;
  createActionItemCategory?: Resolver<ResolversTypes['ActionItemCategory'], ParentType, ContextType, RequireFields<MutationCreateActionItemCategoryArgs, 'name' | 'organizationId'>>;
  createAdmin?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationCreateAdminArgs, 'data'>>;
  createAdvertisement?: Resolver<ResolversTypes['Advertisement'], ParentType, ContextType, RequireFields<MutationCreateAdvertisementArgs, 'endDate' | 'link' | 'name' | 'orgId' | 'startDate' | 'type'>>;
  createComment?: Resolver<Maybe<ResolversTypes['Comment']>, ParentType, ContextType, RequireFields<MutationCreateCommentArgs, 'data' | 'postId'>>;
  createDirectChat?: Resolver<ResolversTypes['DirectChat'], ParentType, ContextType, RequireFields<MutationCreateDirectChatArgs, 'data'>>;
  createDonation?: Resolver<ResolversTypes['Donation'], ParentType, ContextType, RequireFields<MutationCreateDonationArgs, 'amount' | 'nameOfOrg' | 'nameOfUser' | 'orgId' | 'payPalId' | 'userId'>>;
  createEvent?: Resolver<ResolversTypes['Event'], ParentType, ContextType, Partial<MutationCreateEventArgs>>;
  createGroupChat?: Resolver<ResolversTypes['GroupChat'], ParentType, ContextType, RequireFields<MutationCreateGroupChatArgs, 'data'>>;
  createMember?: Resolver<ResolversTypes['Organization'], ParentType, ContextType, RequireFields<MutationCreateMemberArgs, 'input'>>;
  createMessageChat?: Resolver<ResolversTypes['MessageChat'], ParentType, ContextType, RequireFields<MutationCreateMessageChatArgs, 'data'>>;
  createOrganization?: Resolver<ResolversTypes['Organization'], ParentType, ContextType, Partial<MutationCreateOrganizationArgs>>;
  createPlugin?: Resolver<ResolversTypes['Plugin'], ParentType, ContextType, RequireFields<MutationCreatePluginArgs, 'pluginCreatedBy' | 'pluginDesc' | 'pluginName'>>;
  createPost?: Resolver<Maybe<ResolversTypes['Post']>, ParentType, ContextType, RequireFields<MutationCreatePostArgs, 'data'>>;
  createSampleOrganization?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  createUserFamily?: Resolver<ResolversTypes['UserFamily'], ParentType, ContextType, RequireFields<MutationCreateUserFamilyArgs, 'data'>>;
  createUserTag?: Resolver<Maybe<ResolversTypes['UserTag']>, ParentType, ContextType, RequireFields<MutationCreateUserTagArgs, 'input'>>;
  deleteAdvertisementById?: Resolver<ResolversTypes['DeletePayload'], ParentType, ContextType, RequireFields<MutationDeleteAdvertisementByIdArgs, 'id'>>;
  deleteDonationById?: Resolver<ResolversTypes['DeletePayload'], ParentType, ContextType, RequireFields<MutationDeleteDonationByIdArgs, 'id'>>;
  forgotPassword?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationForgotPasswordArgs, 'data'>>;
  joinPublicOrganization?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationJoinPublicOrganizationArgs, 'organizationId'>>;
  leaveOrganization?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationLeaveOrganizationArgs, 'organizationId'>>;
  likeComment?: Resolver<Maybe<ResolversTypes['Comment']>, ParentType, ContextType, RequireFields<MutationLikeCommentArgs, 'id'>>;
  likePost?: Resolver<Maybe<ResolversTypes['Post']>, ParentType, ContextType, RequireFields<MutationLikePostArgs, 'id'>>;
  login?: Resolver<ResolversTypes['AuthData'], ParentType, ContextType, RequireFields<MutationLoginArgs, 'data'>>;
  logout?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  otp?: Resolver<ResolversTypes['OtpData'], ParentType, ContextType, RequireFields<MutationOtpArgs, 'data'>>;
  recaptcha?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRecaptchaArgs, 'data'>>;
  refreshToken?: Resolver<ResolversTypes['ExtendSession'], ParentType, ContextType, RequireFields<MutationRefreshTokenArgs, 'refreshToken'>>;
  registerForEvent?: Resolver<ResolversTypes['Event'], ParentType, ContextType, RequireFields<MutationRegisterForEventArgs, 'id'>>;
  rejectAdmin?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRejectAdminArgs, 'id'>>;
  rejectMembershipRequest?: Resolver<ResolversTypes['MembershipRequest'], ParentType, ContextType, RequireFields<MutationRejectMembershipRequestArgs, 'membershipRequestId'>>;
  removeActionItem?: Resolver<ResolversTypes['ActionItem'], ParentType, ContextType, RequireFields<MutationRemoveActionItemArgs, 'id'>>;
  removeAdmin?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationRemoveAdminArgs, 'data'>>;
  removeAdvertisement?: Resolver<Maybe<ResolversTypes['Advertisement']>, ParentType, ContextType, RequireFields<MutationRemoveAdvertisementArgs, 'id'>>;
  removeComment?: Resolver<Maybe<ResolversTypes['Comment']>, ParentType, ContextType, RequireFields<MutationRemoveCommentArgs, 'id'>>;
  removeDirectChat?: Resolver<ResolversTypes['DirectChat'], ParentType, ContextType, RequireFields<MutationRemoveDirectChatArgs, 'chatId' | 'organizationId'>>;
  removeEvent?: Resolver<ResolversTypes['Event'], ParentType, ContextType, RequireFields<MutationRemoveEventArgs, 'id'>>;
  removeEventAttendee?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationRemoveEventAttendeeArgs, 'data'>>;
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
  updateEvent?: Resolver<ResolversTypes['Event'], ParentType, ContextType, RequireFields<MutationUpdateEventArgs, 'id'>>;
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
  apiUrl?: Resolver<ResolversTypes['URL'], ParentType, ContextType>;
  blockedUsers?: Resolver<Maybe<Array<Maybe<ResolversTypes['User']>>>, ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  creator?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  customFields?: Resolver<Array<ResolversTypes['OrganizationCustomField']>, ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  image?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  members?: Resolver<Maybe<Array<Maybe<ResolversTypes['User']>>>, ParentType, ContextType>;
  membershipRequests?: Resolver<Maybe<Array<Maybe<ResolversTypes['MembershipRequest']>>>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  pinnedPosts?: Resolver<Maybe<Array<Maybe<ResolversTypes['Post']>>>, ParentType, ContextType>;
  updatedAt?: Resolver<ResolversTypes['DateTime'], ParentType, ContextType>;
  userRegistrationRequired?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  userTags?: Resolver<Maybe<ResolversTypes['UserTagsConnection']>, ParentType, ContextType, Partial<OrganizationUserTagsArgs>>;
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

export type PostConnectionResolvers<ContextType = any, ParentType extends ResolversParentTypes['PostConnection'] = ResolversParentTypes['PostConnection']> = {
  aggregate?: Resolver<ResolversTypes['AggregatePost'], ParentType, ContextType>;
  edges?: Resolver<Array<Maybe<ResolversTypes['Post']>>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  actionItem?: Resolver<Maybe<ResolversTypes['ActionItem']>, ParentType, ContextType, RequireFields<QueryActionItemArgs, 'id'>>;
  actionItemCategoriesByOrganization?: Resolver<Maybe<Array<Maybe<ResolversTypes['ActionItemCategory']>>>, ParentType, ContextType, RequireFields<QueryActionItemCategoriesByOrganizationArgs, 'organizationId'>>;
  actionItemCategory?: Resolver<Maybe<ResolversTypes['ActionItemCategory']>, ParentType, ContextType, RequireFields<QueryActionItemCategoryArgs, 'id'>>;
  actionItemsByEvent?: Resolver<Maybe<Array<Maybe<ResolversTypes['ActionItem']>>>, ParentType, ContextType, RequireFields<QueryActionItemsByEventArgs, 'eventId'>>;
  actionItemsByOrganization?: Resolver<Maybe<Array<Maybe<ResolversTypes['ActionItem']>>>, ParentType, ContextType, RequireFields<QueryActionItemsByOrganizationArgs, 'organizationId'>>;
  adminPlugin?: Resolver<Maybe<Array<Maybe<ResolversTypes['Plugin']>>>, ParentType, ContextType, RequireFields<QueryAdminPluginArgs, 'orgId'>>;
  checkAuth?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  customDataByOrganization?: Resolver<Array<ResolversTypes['UserCustomData']>, ParentType, ContextType, RequireFields<QueryCustomDataByOrganizationArgs, 'organizationId'>>;
  customFieldsByOrganization?: Resolver<Maybe<Array<Maybe<ResolversTypes['OrganizationCustomField']>>>, ParentType, ContextType, RequireFields<QueryCustomFieldsByOrganizationArgs, 'id'>>;
  directChatsByUserID?: Resolver<Maybe<Array<Maybe<ResolversTypes['DirectChat']>>>, ParentType, ContextType, RequireFields<QueryDirectChatsByUserIdArgs, 'id'>>;
  directChatsMessagesByChatID?: Resolver<Maybe<Array<Maybe<ResolversTypes['DirectChatMessage']>>>, ParentType, ContextType, RequireFields<QueryDirectChatsMessagesByChatIdArgs, 'id'>>;
  event?: Resolver<Maybe<ResolversTypes['Event']>, ParentType, ContextType, RequireFields<QueryEventArgs, 'id'>>;
  eventsByOrganization?: Resolver<Maybe<Array<Maybe<ResolversTypes['Event']>>>, ParentType, ContextType, Partial<QueryEventsByOrganizationArgs>>;
  eventsByOrganizationConnection?: Resolver<Array<ResolversTypes['Event']>, ParentType, ContextType, Partial<QueryEventsByOrganizationConnectionArgs>>;
  getAdvertisements?: Resolver<Maybe<Array<Maybe<ResolversTypes['Advertisement']>>>, ParentType, ContextType>;
  getDonationById?: Resolver<ResolversTypes['Donation'], ParentType, ContextType, RequireFields<QueryGetDonationByIdArgs, 'id'>>;
  getDonationByOrgId?: Resolver<Maybe<Array<Maybe<ResolversTypes['Donation']>>>, ParentType, ContextType, RequireFields<QueryGetDonationByOrgIdArgs, 'orgId'>>;
  getDonationByOrgIdConnection?: Resolver<Array<ResolversTypes['Donation']>, ParentType, ContextType, RequireFields<QueryGetDonationByOrgIdConnectionArgs, 'orgId'>>;
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
  postsByOrganization?: Resolver<Maybe<Array<Maybe<ResolversTypes['Post']>>>, ParentType, ContextType, RequireFields<QueryPostsByOrganizationArgs, 'id'>>;
  postsByOrganizationConnection?: Resolver<Maybe<ResolversTypes['PostConnection']>, ParentType, ContextType, RequireFields<QueryPostsByOrganizationConnectionArgs, 'id'>>;
  registeredEventsByUser?: Resolver<Maybe<Array<Maybe<ResolversTypes['Event']>>>, ParentType, ContextType, Partial<QueryRegisteredEventsByUserArgs>>;
  registrantsByEvent?: Resolver<Maybe<Array<Maybe<ResolversTypes['User']>>>, ParentType, ContextType, RequireFields<QueryRegistrantsByEventArgs, 'id'>>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<QueryUserArgs, 'id'>>;
  userLanguage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<QueryUserLanguageArgs, 'userId'>>;
  users?: Resolver<Maybe<Array<Maybe<ResolversTypes['User']>>>, ParentType, ContextType, Partial<QueryUsersArgs>>;
  usersConnection?: Resolver<Array<Maybe<ResolversTypes['User']>>, ParentType, ContextType, Partial<QueryUsersConnectionArgs>>;
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

export type UserEdgeResolvers<ContextType = any, ParentType extends ResolversParentTypes['UserEdge'] = ResolversParentTypes['UserEdge']> = {
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
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
  childTags?: Resolver<ResolversTypes['UserTagsConnectionResult'], ParentType, ContextType, RequireFields<UserTagChildTagsArgs, 'input'>>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  organization?: Resolver<Maybe<ResolversTypes['Organization']>, ParentType, ContextType>;
  parentTag?: Resolver<Maybe<ResolversTypes['UserTag']>, ParentType, ContextType>;
  usersAssignedTo?: Resolver<ResolversTypes['UsersConnectionResult'], ParentType, ContextType, RequireFields<UserTagUsersAssignedToArgs, 'input'>>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UserTagEdgeResolvers<ContextType = any, ParentType extends ResolversParentTypes['UserTagEdge'] = ResolversParentTypes['UserTagEdge']> = {
  cursor?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  node?: Resolver<ResolversTypes['UserTag'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UserTagsConnectionResolvers<ContextType = any, ParentType extends ResolversParentTypes['UserTagsConnection'] = ResolversParentTypes['UserTagsConnection']> = {
  edges?: Resolver<Array<ResolversTypes['UserTagEdge']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['ConnectionPageInfo'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UserTagsConnectionResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['UserTagsConnectionResult'] = ResolversParentTypes['UserTagsConnectionResult']> = {
  data?: Resolver<Maybe<ResolversTypes['UserTagsConnection']>, ParentType, ContextType>;
  errors?: Resolver<Array<ResolversTypes['ConnectionError']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UsersConnectionResolvers<ContextType = any, ParentType extends ResolversParentTypes['UsersConnection'] = ResolversParentTypes['UsersConnection']> = {
  edges?: Resolver<Array<ResolversTypes['UserEdge']>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['ConnectionPageInfo'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UsersConnectionResultResolvers<ContextType = any, ParentType extends ResolversParentTypes['UsersConnectionResult'] = ResolversParentTypes['UsersConnectionResult']> = {
  data?: Resolver<Maybe<ResolversTypes['UsersConnection']>, ParentType, ContextType>;
  errors?: Resolver<Array<ResolversTypes['ConnectionError']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type Resolvers<ContextType = any> = {
  ActionItem?: ActionItemResolvers<ContextType>;
  ActionItemCategory?: ActionItemCategoryResolvers<ContextType>;
  Address?: AddressResolvers<ContextType>;
  Advertisement?: AdvertisementResolvers<ContextType>;
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
  Date?: GraphQLScalarType;
  DateTime?: GraphQLScalarType;
  DeletePayload?: DeletePayloadResolvers<ContextType>;
  DirectChat?: DirectChatResolvers<ContextType>;
  DirectChatMessage?: DirectChatMessageResolvers<ContextType>;
  Donation?: DonationResolvers<ContextType>;
  EmailAddress?: GraphQLScalarType;
  Error?: ErrorResolvers<ContextType>;
  Event?: EventResolvers<ContextType>;
  ExtendSession?: ExtendSessionResolvers<ContextType>;
  Feedback?: FeedbackResolvers<ContextType>;
  FieldError?: FieldErrorResolvers<ContextType>;
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
  PostConnection?: PostConnectionResolvers<ContextType>;
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
  UserEdge?: UserEdgeResolvers<ContextType>;
  UserFamily?: UserFamilyResolvers<ContextType>;
  UserPhone?: UserPhoneResolvers<ContextType>;
  UserTag?: UserTagResolvers<ContextType>;
  UserTagEdge?: UserTagEdgeResolvers<ContextType>;
  UserTagsConnection?: UserTagsConnectionResolvers<ContextType>;
  UserTagsConnectionResult?: UserTagsConnectionResultResolvers<ContextType>;
  UsersConnection?: UsersConnectionResolvers<ContextType>;
  UsersConnectionResult?: UsersConnectionResultResolvers<ContextType>;
};

export type DirectiveResolvers<ContextType = any> = {
  auth?: AuthDirectiveResolver<any, any, ContextType>;
  role?: RoleDirectiveResolver<any, any, ContextType>;
};
