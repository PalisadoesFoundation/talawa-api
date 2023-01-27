import type { GraphQLResolveInfo, GraphQLScalarType, GraphQLScalarTypeConfig } from 'graphql';
import type { Interface_MessageChat as Interface_MessageChatModel } from '../models/MessageChat';
import type { Interface_Comment as Interface_CommentModel } from '../models/Comment';
import type { Interface_DirectChat as Interface_DirectChatModel } from '../models/DirectChat';
import type { Interface_DirectChatMessage as Interface_DirectChatMessageModel } from '../models/DirectChatMessage';
import type { Interface_Donation as Interface_DonationModel } from '../models/Donation';
import type { Interface_Event as Interface_EventModel } from '../models/Event';
import type { Interface_Group as Interface_GroupModel } from '../models/Group';
import type { Interface_GroupChat as Interface_GroupChatModel } from '../models/GroupChat';
import type { Interface_GroupChatMessage as Interface_GroupChatMessageModel } from '../models/GroupChatMessage';
import type { Interface_Language as Interface_LanguageModel } from '../models/Language';
import type { Interface_MembershipRequest as Interface_MembershipRequestModel } from '../models/MembershipRequest';
import type { Interface_Message as Interface_MessageModel } from '../models/Message';
import type { Interface_Organization as Interface_OrganizationModel } from '../models/Organization';
import type { Interface_Plugin as Interface_PluginModel } from '../models/Plugin';
import type { Interface_PluginField as Interface_PluginFieldModel } from '../models/PluginField';
import type { Interface_Post as Interface_PostModel } from '../models/Post';
import type { Interface_Task as Interface_TaskModel } from '../models/Task';
import type { Interface_User as Interface_UserModel } from '../models/User';
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
  Upload: any;
};

export type AggregatePost = {
  __typename?: 'AggregatePost';
  count: Scalars['Int'];
};

export type AggregateUser = {
  __typename?: 'AggregateUser';
  count: Scalars['Int'];
};

export type AndroidFirebaseOptions = {
  __typename?: 'AndroidFirebaseOptions';
  apiKey?: Maybe<Scalars['String']>;
  appId?: Maybe<Scalars['String']>;
  messagingSenderId?: Maybe<Scalars['String']>;
  projectId?: Maybe<Scalars['String']>;
  storageBucket?: Maybe<Scalars['String']>;
};

export type AuthData = {
  __typename?: 'AuthData';
  accessToken: Scalars['String'];
  androidFirebaseOptions: AndroidFirebaseOptions;
  iosFirebaseOptions: IosFirebaseOptions;
  refreshToken: Scalars['String'];
  user: User;
};

export type Comment = {
  __typename?: 'Comment';
  _id?: Maybe<Scalars['ID']>;
  createdAt?: Maybe<Scalars['String']>;
  creator: User;
  likeCount?: Maybe<Scalars['Int']>;
  likedBy?: Maybe<Array<Maybe<User>>>;
  post: Post;
  text: Scalars['String'];
};

export type CommentInput = {
  text: Scalars['String'];
};

export type DeletePayload = {
  __typename?: 'DeletePayload';
  success: Scalars['Boolean'];
};

export type DirectChat = {
  __typename?: 'DirectChat';
  _id: Scalars['ID'];
  creator: User;
  messages?: Maybe<Array<Maybe<DirectChatMessage>>>;
  organization: Organization;
  users: Array<User>;
};

export type DirectChatMessage = {
  __typename?: 'DirectChatMessage';
  _id: Scalars['ID'];
  createdAt: Scalars['String'];
  directChatMessageBelongsTo: DirectChat;
  messageContent: Scalars['String'];
  receiver: User;
  sender: User;
};

export type Donation = {
  __typename?: 'Donation';
  _id: Scalars['ID'];
  amount: Scalars['Float'];
  nameOfOrg: Scalars['String'];
  nameOfUser: Scalars['String'];
  orgId: Scalars['ID'];
  payPalId: Scalars['String'];
  userId: Scalars['ID'];
};

export type Event = {
  __typename?: 'Event';
  _id: Scalars['ID'];
  admins?: Maybe<Array<Maybe<User>>>;
  allDay: Scalars['Boolean'];
  creator: User;
  description: Scalars['String'];
  endDate: Scalars['String'];
  endTime?: Maybe<Scalars['String']>;
  isPublic: Scalars['Boolean'];
  isRegisterable: Scalars['Boolean'];
  latitude?: Maybe<Scalars['Float']>;
  location?: Maybe<Scalars['String']>;
  longitude?: Maybe<Scalars['Float']>;
  organization?: Maybe<Organization>;
  recurrance?: Maybe<Recurrance>;
  recurring: Scalars['Boolean'];
  registrants?: Maybe<Array<Maybe<UserAttende>>>;
  startDate: Scalars['String'];
  startTime?: Maybe<Scalars['String']>;
  status: Status;
  tasks?: Maybe<Array<Maybe<Task>>>;
  title: Scalars['String'];
};


export type EventAdminsArgs = {
  adminId?: InputMaybe<Scalars['ID']>;
};

export type EventInput = {
  allDay: Scalars['Boolean'];
  description: Scalars['String'];
  endDate?: InputMaybe<Scalars['String']>;
  endTime?: InputMaybe<Scalars['String']>;
  isPublic: Scalars['Boolean'];
  isRegisterable: Scalars['Boolean'];
  latitude?: InputMaybe<Scalars['Float']>;
  location?: InputMaybe<Scalars['String']>;
  longitude?: InputMaybe<Scalars['Float']>;
  organizationId: Scalars['ID'];
  recurrance?: InputMaybe<Recurrance>;
  recurring: Scalars['Boolean'];
  startDate: Scalars['String'];
  startTime?: InputMaybe<Scalars['String']>;
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

export type EventRegistrants = {
  __typename?: 'EventRegistrants';
  event: Event;
  isRegistered: Scalars['Boolean'];
};

export type ExtendSession = {
  __typename?: 'ExtendSession';
  accessToken: Scalars['String'];
  refreshToken: Scalars['String'];
};

export type ForgotPasswordData = {
  newPassword: Scalars['String'];
  otpToken: Scalars['String'];
  userOtp: Scalars['String'];
};

export type Group = {
  __typename?: 'Group';
  _id?: Maybe<Scalars['ID']>;
  admins?: Maybe<Array<Maybe<User>>>;
  createdAt?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  organization: Organization;
  title?: Maybe<Scalars['String']>;
};

export type GroupChat = {
  __typename?: 'GroupChat';
  _id: Scalars['ID'];
  creator: User;
  messages?: Maybe<Array<Maybe<GroupChatMessage>>>;
  organization: Organization;
  users: Array<User>;
};

export type GroupChatMessage = {
  __typename?: 'GroupChatMessage';
  _id: Scalars['ID'];
  createdAt: Scalars['String'];
  groupChatMessageBelongsTo: GroupChat;
  messageContent: Scalars['String'];
  sender: User;
};

export type GroupInput = {
  description?: InputMaybe<Scalars['String']>;
  organizationId: Scalars['ID'];
  title?: InputMaybe<Scalars['String']>;
};

export type IosFirebaseOptions = {
  __typename?: 'IOSFirebaseOptions';
  apiKey?: Maybe<Scalars['String']>;
  appId?: Maybe<Scalars['String']>;
  iosBundleId?: Maybe<Scalars['String']>;
  iosClientId?: Maybe<Scalars['String']>;
  messagingSenderId?: Maybe<Scalars['String']>;
  projectId?: Maybe<Scalars['String']>;
  storageBucket?: Maybe<Scalars['String']>;
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
  createdAt: Scalars['String'];
  lang_code: Scalars['String'];
  value: Scalars['String'];
  verified: Scalars['Boolean'];
};

export type LoginInput = {
  email: Scalars['String'];
  password: Scalars['String'];
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
  createdAt?: Maybe<Scalars['String']>;
  creator?: Maybe<User>;
  imageUrl?: Maybe<Scalars['String']>;
  text?: Maybe<Scalars['String']>;
  videoUrl?: Maybe<Scalars['String']>;
};

export type MessageChat = {
  __typename?: 'MessageChat';
  _id: Scalars['ID'];
  createdAt: Scalars['String'];
  languageBarrier?: Maybe<Scalars['Boolean']>;
  message: Scalars['String'];
  receiver: User;
  sender: User;
};

export type MessageChatInput = {
  message: Scalars['String'];
  receiver: Scalars['ID'];
};

export type MultipleUsersAndOrganizationInput = {
  organizationId: Scalars['ID'];
  userIds: Array<Scalars['ID']>;
};

export type Mutation = {
  __typename?: 'Mutation';
  acceptAdmin: Scalars['Boolean'];
  acceptMembershipRequest: MembershipRequest;
  addLanguageTranslation: Language;
  addOrganizationImage: Organization;
  addUserImage: User;
  addUserToGroupChat: GroupChat;
  adminRemoveEvent: Event;
  adminRemoveGroup: Message;
  adminRemovePost: Post;
  blockPluginCreationBySuperadmin: User;
  blockUser: User;
  cancelMembershipRequest: MembershipRequest;
  createAdmin: User;
  createComment?: Maybe<Comment>;
  createDirectChat: DirectChat;
  createDonation: Donation;
  createEvent: Event;
  createGroup: Group;
  createGroupChat: GroupChat;
  createMessageChat: MessageChat;
  createOrganization: Organization;
  createPlugin: Plugin;
  createPost?: Maybe<Post>;
  createTask: Task;
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
  removeAdmin: User;
  removeComment?: Maybe<Comment>;
  removeDirectChat: DirectChat;
  removeEvent: Event;
  removeGroupChat: GroupChat;
  removeMember: Organization;
  removeOrganization: User;
  removeOrganizationImage: Organization;
  removePost?: Maybe<Post>;
  removeTask?: Maybe<Task>;
  removeUserFromGroupChat: GroupChat;
  removeUserImage: User;
  revokeRefreshTokenForUser: Scalars['Boolean'];
  saveFcmToken: Scalars['Boolean'];
  sendMembershipRequest: MembershipRequest;
  sendMessageToDirectChat: DirectChatMessage;
  sendMessageToGroupChat: GroupChatMessage;
  signUp: AuthData;
  unblockUser: User;
  unlikeComment?: Maybe<Comment>;
  unlikePost?: Maybe<Post>;
  unregisterForEventByUser: Event;
  updateEvent: Event;
  updateLanguage: User;
  updateOrganization: Organization;
  updatePluginInstalledOrgs: Plugin;
  updatePluginStatus: Plugin;
  updateTask?: Maybe<Task>;
  updateUserProfile: User;
  updateUserType: Scalars['Boolean'];
};


export type MutationAcceptAdminArgs = {
  id: Scalars['ID'];
};


export type MutationAcceptMembershipRequestArgs = {
  membershipRequestId: Scalars['ID'];
};


export type MutationAddLanguageTranslationArgs = {
  data: LanguageInput;
};


export type MutationAddOrganizationImageArgs = {
  file: Scalars['Upload'];
  organizationId: Scalars['String'];
};


export type MutationAddUserImageArgs = {
  file: Scalars['Upload'];
};


export type MutationAddUserToGroupChatArgs = {
  chatId: Scalars['ID'];
  userId: Scalars['ID'];
};


export type MutationAdminRemoveEventArgs = {
  eventId: Scalars['ID'];
};


export type MutationAdminRemoveGroupArgs = {
  groupId: Scalars['ID'];
};


export type MutationAdminRemovePostArgs = {
  organizationId: Scalars['ID'];
  postId: Scalars['ID'];
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


export type MutationCreateAdminArgs = {
  data: UserAndOrganizationInput;
};


export type MutationCreateCommentArgs = {
  data: CommentInput;
  postId: Scalars['ID'];
};


export type MutationCreateDirectChatArgs = {
  data?: InputMaybe<CreateChatInput>;
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


export type MutationCreateGroupArgs = {
  data: GroupInput;
};


export type MutationCreateGroupChatArgs = {
  data?: InputMaybe<CreateGroupChatInput>;
};


export type MutationCreateMessageChatArgs = {
  data: MessageChatInput;
};


export type MutationCreateOrganizationArgs = {
  data?: InputMaybe<OrganizationInput>;
  file?: InputMaybe<Scalars['Upload']>;
};


export type MutationCreatePluginArgs = {
  installedOrgs?: InputMaybe<Array<Scalars['ID']>>;
  pluginCreatedBy: Scalars['String'];
  pluginDesc: Scalars['String'];
  pluginInstallStatus: Scalars['Boolean'];
  pluginName: Scalars['String'];
};


export type MutationCreatePostArgs = {
  data: PostInput;
  file?: InputMaybe<Scalars['Upload']>;
};


export type MutationCreateTaskArgs = {
  data?: InputMaybe<TaskInput>;
  eventId: Scalars['ID'];
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


export type MutationRemoveAdminArgs = {
  data: UserAndOrganizationInput;
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


export type MutationRemoveGroupChatArgs = {
  chatId: Scalars['ID'];
};


export type MutationRemoveMemberArgs = {
  data: MultipleUsersAndOrganizationInput;
};


export type MutationRemoveOrganizationArgs = {
  id: Scalars['ID'];
};


export type MutationRemoveOrganizationImageArgs = {
  organizationId: Scalars['String'];
};


export type MutationRemovePostArgs = {
  id: Scalars['ID'];
};


export type MutationRemoveTaskArgs = {
  id: Scalars['ID'];
};


export type MutationRemoveUserFromGroupChatArgs = {
  chatId: Scalars['ID'];
  userId: Scalars['ID'];
};


export type MutationRevokeRefreshTokenForUserArgs = {
  userId: Scalars['String'];
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
  file?: InputMaybe<Scalars['Upload']>;
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


export type MutationUpdateEventArgs = {
  data?: InputMaybe<UpdateEventInput>;
  id: Scalars['ID'];
};


export type MutationUpdateLanguageArgs = {
  languageCode: Scalars['String'];
};


export type MutationUpdateOrganizationArgs = {
  data?: InputMaybe<UpdateOrganizationInput>;
  id: Scalars['ID'];
};


export type MutationUpdatePluginInstalledOrgsArgs = {
  id: Scalars['ID'];
  orgId: Scalars['ID'];
};


export type MutationUpdatePluginStatusArgs = {
  id: Scalars['ID'];
  status: Scalars['Boolean'];
};


export type MutationUpdateTaskArgs = {
  data?: InputMaybe<UpdateTaskInput>;
  id: Scalars['ID'];
};


export type MutationUpdateUserProfileArgs = {
  data?: InputMaybe<UpdateUserInput>;
  file?: InputMaybe<Scalars['Upload']>;
};


export type MutationUpdateUserTypeArgs = {
  data: UpdateUserTypeInput;
};

export type OtpInput = {
  email: Scalars['String'];
};

export type Organization = {
  __typename?: 'Organization';
  _id: Scalars['ID'];
  admins?: Maybe<Array<Maybe<User>>>;
  apiUrl: Scalars['String'];
  blockedUsers?: Maybe<Array<Maybe<User>>>;
  createdAt?: Maybe<Scalars['String']>;
  creator: User;
  description: Scalars['String'];
  image?: Maybe<Scalars['String']>;
  isPublic: Scalars['Boolean'];
  location?: Maybe<Scalars['String']>;
  members?: Maybe<Array<Maybe<User>>>;
  membershipRequests?: Maybe<Array<Maybe<MembershipRequest>>>;
  name: Scalars['String'];
  tags: Array<Scalars['String']>;
  visibleInSearch: Scalars['Boolean'];
};


export type OrganizationAdminsArgs = {
  adminId?: InputMaybe<Scalars['ID']>;
};

export type OrganizationInfoNode = {
  __typename?: 'OrganizationInfoNode';
  _id: Scalars['ID'];
  apiUrl: Scalars['String'];
  creator: User;
  description: Scalars['String'];
  image?: Maybe<Scalars['String']>;
  isPublic: Scalars['Boolean'];
  name: Scalars['String'];
  tags: Array<Scalars['String']>;
  visibleInSearch: Scalars['Boolean'];
};

export type OrganizationInput = {
  apiUrl?: InputMaybe<Scalars['String']>;
  attendees?: InputMaybe<Scalars['String']>;
  description: Scalars['String'];
  image?: InputMaybe<Scalars['String']>;
  isPublic: Scalars['Boolean'];
  location?: InputMaybe<Scalars['String']>;
  name: Scalars['String'];
  visibleInSearch: Scalars['Boolean'];
};

export type OrganizationOrderByInput =
  | 'apiUrl_ASC'
  | 'apiUrl_DESC'
  | 'description_ASC'
  | 'description_DESC'
  | 'id_ASC'
  | 'id_DESC'
  | 'name_ASC'
  | 'name_DESC';

export type OrganizationWhereInput = {
  apiUrl?: InputMaybe<Scalars['String']>;
  apiUrl_contains?: InputMaybe<Scalars['String']>;
  apiUrl_in?: InputMaybe<Array<Scalars['String']>>;
  apiUrl_not?: InputMaybe<Scalars['String']>;
  apiUrl_not_in?: InputMaybe<Array<Scalars['String']>>;
  apiUrl_starts_with?: InputMaybe<Scalars['String']>;
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
  isPublic?: InputMaybe<Scalars['Boolean']>;
  name?: InputMaybe<Scalars['String']>;
  name_contains?: InputMaybe<Scalars['String']>;
  name_in?: InputMaybe<Array<Scalars['String']>>;
  name_not?: InputMaybe<Scalars['String']>;
  name_not_in?: InputMaybe<Array<Scalars['String']>>;
  name_starts_with?: InputMaybe<Scalars['String']>;
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

export type Plugin = {
  __typename?: 'Plugin';
  _id: Scalars['ID'];
  installedOrgs: Array<Scalars['ID']>;
  pluginCreatedBy: Scalars['String'];
  pluginDesc: Scalars['String'];
  pluginInstallStatus: Scalars['Boolean'];
  pluginName: Scalars['String'];
};

export type PluginField = {
  __typename?: 'PluginField';
  createdAt?: Maybe<Scalars['String']>;
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
  createdAt?: Maybe<Scalars['String']>;
  creator: User;
  imageUrl?: Maybe<Scalars['String']>;
  likeCount?: Maybe<Scalars['Int']>;
  likedBy?: Maybe<Array<Maybe<User>>>;
  organization: Organization;
  text: Scalars['String'];
  title?: Maybe<Scalars['String']>;
  videoUrl?: Maybe<Scalars['String']>;
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
  imageUrl?: InputMaybe<Scalars['String']>;
  organizationId: Scalars['ID'];
  text: Scalars['String'];
  title?: InputMaybe<Scalars['String']>;
  videoUrl?: InputMaybe<Scalars['String']>;
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
  adminPlugin?: Maybe<Array<Maybe<Plugin>>>;
  checkAuth: User;
  comments?: Maybe<Array<Maybe<Comment>>>;
  commentsByPost?: Maybe<Array<Maybe<Comment>>>;
  directChatMessages?: Maybe<Array<Maybe<DirectChatMessage>>>;
  directChats?: Maybe<Array<Maybe<DirectChat>>>;
  directChatsByUserID?: Maybe<Array<Maybe<DirectChat>>>;
  directChatsMessagesByChatID?: Maybe<Array<Maybe<DirectChatMessage>>>;
  event?: Maybe<Event>;
  events?: Maybe<Array<Maybe<Event>>>;
  eventsByOrganization?: Maybe<Array<Maybe<Event>>>;
  getDonationById: Donation;
  getDonationByOrgId?: Maybe<Array<Maybe<Donation>>>;
  getDonations?: Maybe<Array<Maybe<Donation>>>;
  getPlugins?: Maybe<Array<Maybe<Plugin>>>;
  getlanguage?: Maybe<Array<Maybe<Translation>>>;
  groupChatMessages?: Maybe<Array<Maybe<GroupChatMessage>>>;
  groupChats?: Maybe<Array<Maybe<GroupChat>>>;
  groups?: Maybe<Array<Maybe<Group>>>;
  isUserRegister?: Maybe<EventRegistrants>;
  me: User;
  myLanguage?: Maybe<Scalars['String']>;
  organizations?: Maybe<Array<Maybe<Organization>>>;
  organizationsConnection: Array<Maybe<Organization>>;
  organizationsMemberConnection: UserConnection;
  plugin?: Maybe<Array<Maybe<Plugin>>>;
  post?: Maybe<Post>;
  posts?: Maybe<Array<Maybe<Post>>>;
  postsByOrganization?: Maybe<Array<Maybe<Post>>>;
  postsByOrganizationConnection?: Maybe<PostConnection>;
  registeredEventsByUser?: Maybe<Array<Maybe<Event>>>;
  registrantsByEvent?: Maybe<Array<Maybe<User>>>;
  tasksByEvent?: Maybe<Array<Maybe<Task>>>;
  tasksByUser?: Maybe<Array<Maybe<Task>>>;
  user: User;
  userLanguage?: Maybe<Scalars['String']>;
  users?: Maybe<Array<Maybe<User>>>;
  usersConnection: Array<Maybe<User>>;
};


export type QueryAdminPluginArgs = {
  orgId: Scalars['ID'];
};


export type QueryCommentsByPostArgs = {
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


export type QueryEventsArgs = {
  id?: InputMaybe<Scalars['ID']>;
  orderBy?: InputMaybe<EventOrderByInput>;
};


export type QueryEventsByOrganizationArgs = {
  id?: InputMaybe<Scalars['ID']>;
  orderBy?: InputMaybe<EventOrderByInput>;
};


export type QueryGetDonationByIdArgs = {
  id: Scalars['ID'];
};


export type QueryGetDonationByOrgIdArgs = {
  orgId: Scalars['ID'];
};


export type QueryGetlanguageArgs = {
  lang_code: Scalars['String'];
};


export type QueryIsUserRegisterArgs = {
  eventId: Scalars['ID'];
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


export type QueryPostsArgs = {
  orderBy?: InputMaybe<PostOrderByInput>;
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


export type QueryTasksByEventArgs = {
  id: Scalars['ID'];
  orderBy?: InputMaybe<TaskOrderByInput>;
};


export type QueryTasksByUserArgs = {
  id: Scalars['ID'];
  orderBy?: InputMaybe<TaskOrderByInput>;
};


export type QueryUserArgs = {
  id: Scalars['ID'];
};


export type QueryUserLanguageArgs = {
  userId: Scalars['ID'];
};


export type QueryUsersArgs = {
  orderBy?: InputMaybe<UserOrderByInput>;
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
};

export type Task = {
  __typename?: 'Task';
  _id: Scalars['ID'];
  createdAt: Scalars['String'];
  creator: User;
  deadline?: Maybe<Scalars['String']>;
  description?: Maybe<Scalars['String']>;
  event: Event;
  title: Scalars['String'];
};

export type TaskInput = {
  deadline?: InputMaybe<Scalars['String']>;
  description?: InputMaybe<Scalars['String']>;
  title: Scalars['String'];
};

export type TaskOrderByInput =
  | 'createdAt_ASC'
  | 'createdAt_DESC'
  | 'deadline_ASC'
  | 'deadline_DESC'
  | 'description_ASC'
  | 'description_DESC'
  | 'id_ASC'
  | 'id_DESC'
  | 'title_ASC'
  | 'title_DESC';

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

export type UpdateEventInput = {
  allDay?: InputMaybe<Scalars['Boolean']>;
  description?: InputMaybe<Scalars['String']>;
  endDate?: InputMaybe<Scalars['String']>;
  endTime?: InputMaybe<Scalars['String']>;
  isPublic?: InputMaybe<Scalars['Boolean']>;
  isRegisterable?: InputMaybe<Scalars['Boolean']>;
  latitude?: InputMaybe<Scalars['Float']>;
  location?: InputMaybe<Scalars['String']>;
  longitude?: InputMaybe<Scalars['Float']>;
  recurrance?: InputMaybe<Recurrance>;
  recurring?: InputMaybe<Scalars['Boolean']>;
  startDate?: InputMaybe<Scalars['String']>;
  startTime?: InputMaybe<Scalars['String']>;
  title?: InputMaybe<Scalars['String']>;
};

export type UpdateOrganizationInput = {
  description?: InputMaybe<Scalars['String']>;
  isPublic?: InputMaybe<Scalars['Boolean']>;
  name?: InputMaybe<Scalars['String']>;
  visibleInSearch?: InputMaybe<Scalars['Boolean']>;
};

export type UpdateTaskInput = {
  deadline?: InputMaybe<Scalars['String']>;
  description?: InputMaybe<Scalars['String']>;
  title?: InputMaybe<Scalars['String']>;
};

export type UpdateUserInput = {
  email?: InputMaybe<Scalars['String']>;
  firstName?: InputMaybe<Scalars['String']>;
  lastName?: InputMaybe<Scalars['String']>;
};

export type UpdateUserTypeInput = {
  id?: InputMaybe<Scalars['ID']>;
  userType?: InputMaybe<Scalars['String']>;
};

export type User = {
  __typename?: 'User';
  _id: Scalars['ID'];
  adminApproved?: Maybe<Scalars['Boolean']>;
  adminFor?: Maybe<Array<Maybe<Organization>>>;
  appLanguageCode: Scalars['String'];
  createdAt?: Maybe<Scalars['String']>;
  createdEvents?: Maybe<Array<Maybe<Event>>>;
  createdOrganizations?: Maybe<Array<Maybe<Organization>>>;
  email: Scalars['String'];
  eventAdmin?: Maybe<Array<Maybe<Event>>>;
  firstName: Scalars['String'];
  image?: Maybe<Scalars['String']>;
  joinedOrganizations?: Maybe<Array<Maybe<Organization>>>;
  lastName: Scalars['String'];
  membershipRequests?: Maybe<Array<Maybe<MembershipRequest>>>;
  organizationUserBelongsTo?: Maybe<Organization>;
  organizationsBlockedBy?: Maybe<Array<Maybe<Organization>>>;
  pluginCreationAllowed?: Maybe<Scalars['Boolean']>;
  registeredEvents?: Maybe<Array<Maybe<Event>>>;
  tokenVersion: Scalars['Int'];
  userType?: Maybe<Scalars['String']>;
};

export type UserAndOrganizationInput = {
  organizationId: Scalars['ID'];
  userId: Scalars['ID'];
};

export type UserAttende = {
  __typename?: 'UserAttende';
  _id: Scalars['ID'];
  createdAt?: Maybe<Scalars['String']>;
  status: Status;
  user: User;
  userId: Scalars['String'];
};

export type UserConnection = {
  __typename?: 'UserConnection';
  aggregate: AggregateUser;
  edges: Array<Maybe<User>>;
  pageInfo: PageInfo;
};

export type UserInput = {
  appLanguageCode?: InputMaybe<Scalars['String']>;
  email: Scalars['String'];
  firstName: Scalars['String'];
  lastName: Scalars['String'];
  organizationUserBelongsToId?: InputMaybe<Scalars['ID']>;
  password: Scalars['String'];
  userType?: InputMaybe<UserType>;
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

export type UserType =
  | 'ADMIN'
  | 'SUPERADMIN'
  | 'USER';

export type UserWhereInput = {
  appLanguageCode?: InputMaybe<Scalars['String']>;
  appLanguageCode_contains?: InputMaybe<Scalars['String']>;
  appLanguageCode_in?: InputMaybe<Array<Scalars['String']>>;
  appLanguageCode_not?: InputMaybe<Scalars['String']>;
  appLanguageCode_not_in?: InputMaybe<Array<Scalars['String']>>;
  appLanguageCode_starts_with?: InputMaybe<Scalars['String']>;
  email?: InputMaybe<Scalars['String']>;
  email_contains?: InputMaybe<Scalars['String']>;
  email_in?: InputMaybe<Array<Scalars['String']>>;
  email_not?: InputMaybe<Scalars['String']>;
  email_not_in?: InputMaybe<Array<Scalars['String']>>;
  email_starts_with?: InputMaybe<Scalars['String']>;
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

export type CreateChatInput = {
  organizationId: Scalars['ID'];
  userIds: Array<Scalars['ID']>;
};

export type CreateGroupChatInput = {
  organizationId: Scalars['ID'];
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
  AggregatePost: ResolverTypeWrapper<AggregatePost>;
  AggregateUser: ResolverTypeWrapper<AggregateUser>;
  AndroidFirebaseOptions: ResolverTypeWrapper<AndroidFirebaseOptions>;
  AuthData: ResolverTypeWrapper<Omit<AuthData, 'user'> & { user: ResolversTypes['User'] }>;
  Boolean: ResolverTypeWrapper<Scalars['Boolean']>;
  Comment: ResolverTypeWrapper<Interface_CommentModel>;
  CommentInput: CommentInput;
  DeletePayload: ResolverTypeWrapper<DeletePayload>;
  DirectChat: ResolverTypeWrapper<Interface_DirectChatModel>;
  DirectChatMessage: ResolverTypeWrapper<Interface_DirectChatMessageModel>;
  Donation: ResolverTypeWrapper<Interface_DonationModel>;
  Event: ResolverTypeWrapper<Interface_EventModel>;
  EventInput: EventInput;
  EventOrderByInput: EventOrderByInput;
  EventRegistrants: ResolverTypeWrapper<Omit<EventRegistrants, 'event'> & { event: ResolversTypes['Event'] }>;
  ExtendSession: ResolverTypeWrapper<ExtendSession>;
  Float: ResolverTypeWrapper<Scalars['Float']>;
  ForgotPasswordData: ForgotPasswordData;
  Group: ResolverTypeWrapper<Interface_GroupModel>;
  GroupChat: ResolverTypeWrapper<Interface_GroupChatModel>;
  GroupChatMessage: ResolverTypeWrapper<Interface_GroupChatMessageModel>;
  GroupInput: GroupInput;
  ID: ResolverTypeWrapper<Scalars['ID']>;
  IOSFirebaseOptions: ResolverTypeWrapper<IosFirebaseOptions>;
  Int: ResolverTypeWrapper<Scalars['Int']>;
  Language: ResolverTypeWrapper<Interface_LanguageModel>;
  LanguageInput: LanguageInput;
  LanguageModel: ResolverTypeWrapper<LanguageModel>;
  LoginInput: LoginInput;
  MembershipRequest: ResolverTypeWrapper<Interface_MembershipRequestModel>;
  Message: ResolverTypeWrapper<Interface_MessageModel>;
  MessageChat: ResolverTypeWrapper<Interface_MessageChatModel>;
  MessageChatInput: MessageChatInput;
  MultipleUsersAndOrganizationInput: MultipleUsersAndOrganizationInput;
  Mutation: ResolverTypeWrapper<{}>;
  OTPInput: OtpInput;
  Organization: ResolverTypeWrapper<Interface_OrganizationModel>;
  OrganizationInfoNode: ResolverTypeWrapper<Omit<OrganizationInfoNode, 'creator'> & { creator: ResolversTypes['User'] }>;
  OrganizationInput: OrganizationInput;
  OrganizationOrderByInput: OrganizationOrderByInput;
  OrganizationWhereInput: OrganizationWhereInput;
  OtpData: ResolverTypeWrapper<OtpData>;
  PageInfo: ResolverTypeWrapper<PageInfo>;
  Plugin: ResolverTypeWrapper<Interface_PluginModel>;
  PluginField: ResolverTypeWrapper<Interface_PluginFieldModel>;
  PluginFieldInput: PluginFieldInput;
  PluginInput: PluginInput;
  Post: ResolverTypeWrapper<Interface_PostModel>;
  PostConnection: ResolverTypeWrapper<Omit<PostConnection, 'edges'> & { edges: Array<Maybe<ResolversTypes['Post']>> }>;
  PostInput: PostInput;
  PostOrderByInput: PostOrderByInput;
  PostWhereInput: PostWhereInput;
  Query: ResolverTypeWrapper<{}>;
  RecaptchaVerification: RecaptchaVerification;
  Recurrance: Recurrance;
  Status: Status;
  String: ResolverTypeWrapper<Scalars['String']>;
  Subscription: ResolverTypeWrapper<{}>;
  Task: ResolverTypeWrapper<Interface_TaskModel>;
  TaskInput: TaskInput;
  TaskOrderByInput: TaskOrderByInput;
  Translation: ResolverTypeWrapper<Translation>;
  Type: Type;
  UpdateEventInput: UpdateEventInput;
  UpdateOrganizationInput: UpdateOrganizationInput;
  UpdateTaskInput: UpdateTaskInput;
  UpdateUserInput: UpdateUserInput;
  UpdateUserTypeInput: UpdateUserTypeInput;
  Upload: ResolverTypeWrapper<Scalars['Upload']>;
  User: ResolverTypeWrapper<Interface_UserModel>;
  UserAndOrganizationInput: UserAndOrganizationInput;
  UserAttende: ResolverTypeWrapper<Omit<UserAttende, 'user'> & { user: ResolversTypes['User'] }>;
  UserConnection: ResolverTypeWrapper<Omit<UserConnection, 'edges'> & { edges: Array<Maybe<ResolversTypes['User']>> }>;
  UserInput: UserInput;
  UserOrderByInput: UserOrderByInput;
  UserType: UserType;
  UserWhereInput: UserWhereInput;
  createChatInput: CreateChatInput;
  createGroupChatInput: CreateGroupChatInput;
};

/** Mapping between all available schema types and the resolvers parents */
export type ResolversParentTypes = {
  AggregatePost: AggregatePost;
  AggregateUser: AggregateUser;
  AndroidFirebaseOptions: AndroidFirebaseOptions;
  AuthData: Omit<AuthData, 'user'> & { user: ResolversParentTypes['User'] };
  Boolean: Scalars['Boolean'];
  Comment: Interface_CommentModel;
  CommentInput: CommentInput;
  DeletePayload: DeletePayload;
  DirectChat: Interface_DirectChatModel;
  DirectChatMessage: Interface_DirectChatMessageModel;
  Donation: Interface_DonationModel;
  Event: Interface_EventModel;
  EventInput: EventInput;
  EventRegistrants: Omit<EventRegistrants, 'event'> & { event: ResolversParentTypes['Event'] };
  ExtendSession: ExtendSession;
  Float: Scalars['Float'];
  ForgotPasswordData: ForgotPasswordData;
  Group: Interface_GroupModel;
  GroupChat: Interface_GroupChatModel;
  GroupChatMessage: Interface_GroupChatMessageModel;
  GroupInput: GroupInput;
  ID: Scalars['ID'];
  IOSFirebaseOptions: IosFirebaseOptions;
  Int: Scalars['Int'];
  Language: Interface_LanguageModel;
  LanguageInput: LanguageInput;
  LanguageModel: LanguageModel;
  LoginInput: LoginInput;
  MembershipRequest: Interface_MembershipRequestModel;
  Message: Interface_MessageModel;
  MessageChat: Interface_MessageChatModel;
  MessageChatInput: MessageChatInput;
  MultipleUsersAndOrganizationInput: MultipleUsersAndOrganizationInput;
  Mutation: {};
  OTPInput: OtpInput;
  Organization: Interface_OrganizationModel;
  OrganizationInfoNode: Omit<OrganizationInfoNode, 'creator'> & { creator: ResolversParentTypes['User'] };
  OrganizationInput: OrganizationInput;
  OrganizationWhereInput: OrganizationWhereInput;
  OtpData: OtpData;
  PageInfo: PageInfo;
  Plugin: Interface_PluginModel;
  PluginField: Interface_PluginFieldModel;
  PluginFieldInput: PluginFieldInput;
  PluginInput: PluginInput;
  Post: Interface_PostModel;
  PostConnection: Omit<PostConnection, 'edges'> & { edges: Array<Maybe<ResolversParentTypes['Post']>> };
  PostInput: PostInput;
  PostWhereInput: PostWhereInput;
  Query: {};
  RecaptchaVerification: RecaptchaVerification;
  String: Scalars['String'];
  Subscription: {};
  Task: Interface_TaskModel;
  TaskInput: TaskInput;
  Translation: Translation;
  UpdateEventInput: UpdateEventInput;
  UpdateOrganizationInput: UpdateOrganizationInput;
  UpdateTaskInput: UpdateTaskInput;
  UpdateUserInput: UpdateUserInput;
  UpdateUserTypeInput: UpdateUserTypeInput;
  Upload: Scalars['Upload'];
  User: Interface_UserModel;
  UserAndOrganizationInput: UserAndOrganizationInput;
  UserAttende: Omit<UserAttende, 'user'> & { user: ResolversParentTypes['User'] };
  UserConnection: Omit<UserConnection, 'edges'> & { edges: Array<Maybe<ResolversParentTypes['User']>> };
  UserInput: UserInput;
  UserWhereInput: UserWhereInput;
  createChatInput: CreateChatInput;
  createGroupChatInput: CreateGroupChatInput;
};

export type AuthDirectiveArgs = { };

export type AuthDirectiveResolver<Result, Parent, ContextType = any, Args = AuthDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type RoleDirectiveArgs = {
  requires?: Maybe<UserType>;
};

export type RoleDirectiveResolver<Result, Parent, ContextType = any, Args = RoleDirectiveArgs> = DirectiveResolverFn<Result, Parent, ContextType, Args>;

export type AggregatePostResolvers<ContextType = any, ParentType extends ResolversParentTypes['AggregatePost'] = ResolversParentTypes['AggregatePost']> = {
  count?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AggregateUserResolvers<ContextType = any, ParentType extends ResolversParentTypes['AggregateUser'] = ResolversParentTypes['AggregateUser']> = {
  count?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AndroidFirebaseOptionsResolvers<ContextType = any, ParentType extends ResolversParentTypes['AndroidFirebaseOptions'] = ResolversParentTypes['AndroidFirebaseOptions']> = {
  apiKey?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  appId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  messagingSenderId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  projectId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  storageBucket?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type AuthDataResolvers<ContextType = any, ParentType extends ResolversParentTypes['AuthData'] = ResolversParentTypes['AuthData']> = {
  accessToken?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  androidFirebaseOptions?: Resolver<ResolversTypes['AndroidFirebaseOptions'], ParentType, ContextType>;
  iosFirebaseOptions?: Resolver<ResolversTypes['IOSFirebaseOptions'], ParentType, ContextType>;
  refreshToken?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type CommentResolvers<ContextType = any, ParentType extends ResolversParentTypes['Comment'] = ResolversParentTypes['Comment']> = {
  _id?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  createdAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  creator?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  likeCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  likedBy?: Resolver<Maybe<Array<Maybe<ResolversTypes['User']>>>, ParentType, ContextType>;
  post?: Resolver<ResolversTypes['Post'], ParentType, ContextType>;
  text?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type DeletePayloadResolvers<ContextType = any, ParentType extends ResolversParentTypes['DeletePayload'] = ResolversParentTypes['DeletePayload']> = {
  success?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type DirectChatResolvers<ContextType = any, ParentType extends ResolversParentTypes['DirectChat'] = ResolversParentTypes['DirectChat']> = {
  _id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  creator?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  messages?: Resolver<Maybe<Array<Maybe<ResolversTypes['DirectChatMessage']>>>, ParentType, ContextType>;
  organization?: Resolver<ResolversTypes['Organization'], ParentType, ContextType>;
  users?: Resolver<Array<ResolversTypes['User']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type DirectChatMessageResolvers<ContextType = any, ParentType extends ResolversParentTypes['DirectChatMessage'] = ResolversParentTypes['DirectChatMessage']> = {
  _id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  directChatMessageBelongsTo?: Resolver<ResolversTypes['DirectChat'], ParentType, ContextType>;
  messageContent?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  receiver?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  sender?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type DonationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Donation'] = ResolversParentTypes['Donation']> = {
  _id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  amount?: Resolver<ResolversTypes['Float'], ParentType, ContextType>;
  nameOfOrg?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  nameOfUser?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  orgId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  payPalId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type EventResolvers<ContextType = any, ParentType extends ResolversParentTypes['Event'] = ResolversParentTypes['Event']> = {
  _id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  admins?: Resolver<Maybe<Array<Maybe<ResolversTypes['User']>>>, ParentType, ContextType, Partial<EventAdminsArgs>>;
  allDay?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  creator?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  endDate?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  endTime?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  isPublic?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  isRegisterable?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  latitude?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  location?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  longitude?: Resolver<Maybe<ResolversTypes['Float']>, ParentType, ContextType>;
  organization?: Resolver<Maybe<ResolversTypes['Organization']>, ParentType, ContextType>;
  recurrance?: Resolver<Maybe<ResolversTypes['Recurrance']>, ParentType, ContextType>;
  recurring?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  registrants?: Resolver<Maybe<Array<Maybe<ResolversTypes['UserAttende']>>>, ParentType, ContextType>;
  startDate?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  startTime?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['Status'], ParentType, ContextType>;
  tasks?: Resolver<Maybe<Array<Maybe<ResolversTypes['Task']>>>, ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type EventRegistrantsResolvers<ContextType = any, ParentType extends ResolversParentTypes['EventRegistrants'] = ResolversParentTypes['EventRegistrants']> = {
  event?: Resolver<ResolversTypes['Event'], ParentType, ContextType>;
  isRegistered?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type ExtendSessionResolvers<ContextType = any, ParentType extends ResolversParentTypes['ExtendSession'] = ResolversParentTypes['ExtendSession']> = {
  accessToken?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  refreshToken?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type GroupResolvers<ContextType = any, ParentType extends ResolversParentTypes['Group'] = ResolversParentTypes['Group']> = {
  _id?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  admins?: Resolver<Maybe<Array<Maybe<ResolversTypes['User']>>>, ParentType, ContextType>;
  createdAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  organization?: Resolver<ResolversTypes['Organization'], ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type GroupChatResolvers<ContextType = any, ParentType extends ResolversParentTypes['GroupChat'] = ResolversParentTypes['GroupChat']> = {
  _id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  creator?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  messages?: Resolver<Maybe<Array<Maybe<ResolversTypes['GroupChatMessage']>>>, ParentType, ContextType>;
  organization?: Resolver<ResolversTypes['Organization'], ParentType, ContextType>;
  users?: Resolver<Array<ResolversTypes['User']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type GroupChatMessageResolvers<ContextType = any, ParentType extends ResolversParentTypes['GroupChatMessage'] = ResolversParentTypes['GroupChatMessage']> = {
  _id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  groupChatMessageBelongsTo?: Resolver<ResolversTypes['GroupChat'], ParentType, ContextType>;
  messageContent?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  sender?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type IosFirebaseOptionsResolvers<ContextType = any, ParentType extends ResolversParentTypes['IOSFirebaseOptions'] = ResolversParentTypes['IOSFirebaseOptions']> = {
  apiKey?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  appId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  iosBundleId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  iosClientId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  messagingSenderId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  projectId?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  storageBucket?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type LanguageResolvers<ContextType = any, ParentType extends ResolversParentTypes['Language'] = ResolversParentTypes['Language']> = {
  _id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  en?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  translation?: Resolver<Maybe<Array<Maybe<ResolversTypes['LanguageModel']>>>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type LanguageModelResolvers<ContextType = any, ParentType extends ResolversParentTypes['LanguageModel'] = ResolversParentTypes['LanguageModel']> = {
  _id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  lang_code?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  value?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  verified?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
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
  createdAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  creator?: Resolver<Maybe<ResolversTypes['User']>, ParentType, ContextType>;
  imageUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  text?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  videoUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MessageChatResolvers<ContextType = any, ParentType extends ResolversParentTypes['MessageChat'] = ResolversParentTypes['MessageChat']> = {
  _id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  languageBarrier?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  message?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  receiver?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  sender?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type MutationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Mutation'] = ResolversParentTypes['Mutation']> = {
  acceptAdmin?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationAcceptAdminArgs, 'id'>>;
  acceptMembershipRequest?: Resolver<ResolversTypes['MembershipRequest'], ParentType, ContextType, RequireFields<MutationAcceptMembershipRequestArgs, 'membershipRequestId'>>;
  addLanguageTranslation?: Resolver<ResolversTypes['Language'], ParentType, ContextType, RequireFields<MutationAddLanguageTranslationArgs, 'data'>>;
  addOrganizationImage?: Resolver<ResolversTypes['Organization'], ParentType, ContextType, RequireFields<MutationAddOrganizationImageArgs, 'file' | 'organizationId'>>;
  addUserImage?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationAddUserImageArgs, 'file'>>;
  addUserToGroupChat?: Resolver<ResolversTypes['GroupChat'], ParentType, ContextType, RequireFields<MutationAddUserToGroupChatArgs, 'chatId' | 'userId'>>;
  adminRemoveEvent?: Resolver<ResolversTypes['Event'], ParentType, ContextType, RequireFields<MutationAdminRemoveEventArgs, 'eventId'>>;
  adminRemoveGroup?: Resolver<ResolversTypes['Message'], ParentType, ContextType, RequireFields<MutationAdminRemoveGroupArgs, 'groupId'>>;
  adminRemovePost?: Resolver<ResolversTypes['Post'], ParentType, ContextType, RequireFields<MutationAdminRemovePostArgs, 'organizationId' | 'postId'>>;
  blockPluginCreationBySuperadmin?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationBlockPluginCreationBySuperadminArgs, 'blockUser' | 'userId'>>;
  blockUser?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationBlockUserArgs, 'organizationId' | 'userId'>>;
  cancelMembershipRequest?: Resolver<ResolversTypes['MembershipRequest'], ParentType, ContextType, RequireFields<MutationCancelMembershipRequestArgs, 'membershipRequestId'>>;
  createAdmin?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationCreateAdminArgs, 'data'>>;
  createComment?: Resolver<Maybe<ResolversTypes['Comment']>, ParentType, ContextType, RequireFields<MutationCreateCommentArgs, 'data' | 'postId'>>;
  createDirectChat?: Resolver<ResolversTypes['DirectChat'], ParentType, ContextType, Partial<MutationCreateDirectChatArgs>>;
  createDonation?: Resolver<ResolversTypes['Donation'], ParentType, ContextType, RequireFields<MutationCreateDonationArgs, 'amount' | 'nameOfOrg' | 'nameOfUser' | 'orgId' | 'payPalId' | 'userId'>>;
  createEvent?: Resolver<ResolversTypes['Event'], ParentType, ContextType, Partial<MutationCreateEventArgs>>;
  createGroup?: Resolver<ResolversTypes['Group'], ParentType, ContextType, RequireFields<MutationCreateGroupArgs, 'data'>>;
  createGroupChat?: Resolver<ResolversTypes['GroupChat'], ParentType, ContextType, Partial<MutationCreateGroupChatArgs>>;
  createMessageChat?: Resolver<ResolversTypes['MessageChat'], ParentType, ContextType, RequireFields<MutationCreateMessageChatArgs, 'data'>>;
  createOrganization?: Resolver<ResolversTypes['Organization'], ParentType, ContextType, Partial<MutationCreateOrganizationArgs>>;
  createPlugin?: Resolver<ResolversTypes['Plugin'], ParentType, ContextType, RequireFields<MutationCreatePluginArgs, 'pluginCreatedBy' | 'pluginDesc' | 'pluginInstallStatus' | 'pluginName'>>;
  createPost?: Resolver<Maybe<ResolversTypes['Post']>, ParentType, ContextType, RequireFields<MutationCreatePostArgs, 'data'>>;
  createTask?: Resolver<ResolversTypes['Task'], ParentType, ContextType, RequireFields<MutationCreateTaskArgs, 'eventId'>>;
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
  removeAdmin?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationRemoveAdminArgs, 'data'>>;
  removeComment?: Resolver<Maybe<ResolversTypes['Comment']>, ParentType, ContextType, RequireFields<MutationRemoveCommentArgs, 'id'>>;
  removeDirectChat?: Resolver<ResolversTypes['DirectChat'], ParentType, ContextType, RequireFields<MutationRemoveDirectChatArgs, 'chatId' | 'organizationId'>>;
  removeEvent?: Resolver<ResolversTypes['Event'], ParentType, ContextType, RequireFields<MutationRemoveEventArgs, 'id'>>;
  removeGroupChat?: Resolver<ResolversTypes['GroupChat'], ParentType, ContextType, RequireFields<MutationRemoveGroupChatArgs, 'chatId'>>;
  removeMember?: Resolver<ResolversTypes['Organization'], ParentType, ContextType, RequireFields<MutationRemoveMemberArgs, 'data'>>;
  removeOrganization?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationRemoveOrganizationArgs, 'id'>>;
  removeOrganizationImage?: Resolver<ResolversTypes['Organization'], ParentType, ContextType, RequireFields<MutationRemoveOrganizationImageArgs, 'organizationId'>>;
  removePost?: Resolver<Maybe<ResolversTypes['Post']>, ParentType, ContextType, RequireFields<MutationRemovePostArgs, 'id'>>;
  removeTask?: Resolver<Maybe<ResolversTypes['Task']>, ParentType, ContextType, RequireFields<MutationRemoveTaskArgs, 'id'>>;
  removeUserFromGroupChat?: Resolver<ResolversTypes['GroupChat'], ParentType, ContextType, RequireFields<MutationRemoveUserFromGroupChatArgs, 'chatId' | 'userId'>>;
  removeUserImage?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  revokeRefreshTokenForUser?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationRevokeRefreshTokenForUserArgs, 'userId'>>;
  saveFcmToken?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, Partial<MutationSaveFcmTokenArgs>>;
  sendMembershipRequest?: Resolver<ResolversTypes['MembershipRequest'], ParentType, ContextType, RequireFields<MutationSendMembershipRequestArgs, 'organizationId'>>;
  sendMessageToDirectChat?: Resolver<ResolversTypes['DirectChatMessage'], ParentType, ContextType, RequireFields<MutationSendMessageToDirectChatArgs, 'chatId' | 'messageContent'>>;
  sendMessageToGroupChat?: Resolver<ResolversTypes['GroupChatMessage'], ParentType, ContextType, RequireFields<MutationSendMessageToGroupChatArgs, 'chatId' | 'messageContent'>>;
  signUp?: Resolver<ResolversTypes['AuthData'], ParentType, ContextType, RequireFields<MutationSignUpArgs, 'data'>>;
  unblockUser?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationUnblockUserArgs, 'organizationId' | 'userId'>>;
  unlikeComment?: Resolver<Maybe<ResolversTypes['Comment']>, ParentType, ContextType, RequireFields<MutationUnlikeCommentArgs, 'id'>>;
  unlikePost?: Resolver<Maybe<ResolversTypes['Post']>, ParentType, ContextType, RequireFields<MutationUnlikePostArgs, 'id'>>;
  unregisterForEventByUser?: Resolver<ResolversTypes['Event'], ParentType, ContextType, RequireFields<MutationUnregisterForEventByUserArgs, 'id'>>;
  updateEvent?: Resolver<ResolversTypes['Event'], ParentType, ContextType, RequireFields<MutationUpdateEventArgs, 'id'>>;
  updateLanguage?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<MutationUpdateLanguageArgs, 'languageCode'>>;
  updateOrganization?: Resolver<ResolversTypes['Organization'], ParentType, ContextType, RequireFields<MutationUpdateOrganizationArgs, 'id'>>;
  updatePluginInstalledOrgs?: Resolver<ResolversTypes['Plugin'], ParentType, ContextType, RequireFields<MutationUpdatePluginInstalledOrgsArgs, 'id' | 'orgId'>>;
  updatePluginStatus?: Resolver<ResolversTypes['Plugin'], ParentType, ContextType, RequireFields<MutationUpdatePluginStatusArgs, 'id' | 'status'>>;
  updateTask?: Resolver<Maybe<ResolversTypes['Task']>, ParentType, ContextType, RequireFields<MutationUpdateTaskArgs, 'id'>>;
  updateUserProfile?: Resolver<ResolversTypes['User'], ParentType, ContextType, Partial<MutationUpdateUserProfileArgs>>;
  updateUserType?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType, RequireFields<MutationUpdateUserTypeArgs, 'data'>>;
};

export type OrganizationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Organization'] = ResolversParentTypes['Organization']> = {
  _id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  admins?: Resolver<Maybe<Array<Maybe<ResolversTypes['User']>>>, ParentType, ContextType, Partial<OrganizationAdminsArgs>>;
  apiUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  blockedUsers?: Resolver<Maybe<Array<Maybe<ResolversTypes['User']>>>, ParentType, ContextType>;
  createdAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  creator?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  image?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  isPublic?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  location?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  members?: Resolver<Maybe<Array<Maybe<ResolversTypes['User']>>>, ParentType, ContextType>;
  membershipRequests?: Resolver<Maybe<Array<Maybe<ResolversTypes['MembershipRequest']>>>, ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  tags?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
  visibleInSearch?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type OrganizationInfoNodeResolvers<ContextType = any, ParentType extends ResolversParentTypes['OrganizationInfoNode'] = ResolversParentTypes['OrganizationInfoNode']> = {
  _id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  apiUrl?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  creator?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  description?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  image?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  isPublic?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  name?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  tags?: Resolver<Array<ResolversTypes['String']>, ParentType, ContextType>;
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

export type PluginResolvers<ContextType = any, ParentType extends ResolversParentTypes['Plugin'] = ResolversParentTypes['Plugin']> = {
  _id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  installedOrgs?: Resolver<Array<ResolversTypes['ID']>, ParentType, ContextType>;
  pluginCreatedBy?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  pluginDesc?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  pluginInstallStatus?: Resolver<ResolversTypes['Boolean'], ParentType, ContextType>;
  pluginName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PluginFieldResolvers<ContextType = any, ParentType extends ResolversParentTypes['PluginField'] = ResolversParentTypes['PluginField']> = {
  createdAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  key?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  status?: Resolver<ResolversTypes['Status'], ParentType, ContextType>;
  value?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PostResolvers<ContextType = any, ParentType extends ResolversParentTypes['Post'] = ResolversParentTypes['Post']> = {
  _id?: Resolver<Maybe<ResolversTypes['ID']>, ParentType, ContextType>;
  commentCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  comments?: Resolver<Maybe<Array<Maybe<ResolversTypes['Comment']>>>, ParentType, ContextType>;
  createdAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  creator?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  imageUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  likeCount?: Resolver<Maybe<ResolversTypes['Int']>, ParentType, ContextType>;
  likedBy?: Resolver<Maybe<Array<Maybe<ResolversTypes['User']>>>, ParentType, ContextType>;
  organization?: Resolver<ResolversTypes['Organization'], ParentType, ContextType>;
  text?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  title?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  videoUrl?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type PostConnectionResolvers<ContextType = any, ParentType extends ResolversParentTypes['PostConnection'] = ResolversParentTypes['PostConnection']> = {
  aggregate?: Resolver<ResolversTypes['AggregatePost'], ParentType, ContextType>;
  edges?: Resolver<Array<Maybe<ResolversTypes['Post']>>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type QueryResolvers<ContextType = any, ParentType extends ResolversParentTypes['Query'] = ResolversParentTypes['Query']> = {
  adminPlugin?: Resolver<Maybe<Array<Maybe<ResolversTypes['Plugin']>>>, ParentType, ContextType, RequireFields<QueryAdminPluginArgs, 'orgId'>>;
  checkAuth?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  comments?: Resolver<Maybe<Array<Maybe<ResolversTypes['Comment']>>>, ParentType, ContextType>;
  commentsByPost?: Resolver<Maybe<Array<Maybe<ResolversTypes['Comment']>>>, ParentType, ContextType, RequireFields<QueryCommentsByPostArgs, 'id'>>;
  directChatMessages?: Resolver<Maybe<Array<Maybe<ResolversTypes['DirectChatMessage']>>>, ParentType, ContextType>;
  directChats?: Resolver<Maybe<Array<Maybe<ResolversTypes['DirectChat']>>>, ParentType, ContextType>;
  directChatsByUserID?: Resolver<Maybe<Array<Maybe<ResolversTypes['DirectChat']>>>, ParentType, ContextType, RequireFields<QueryDirectChatsByUserIdArgs, 'id'>>;
  directChatsMessagesByChatID?: Resolver<Maybe<Array<Maybe<ResolversTypes['DirectChatMessage']>>>, ParentType, ContextType, RequireFields<QueryDirectChatsMessagesByChatIdArgs, 'id'>>;
  event?: Resolver<Maybe<ResolversTypes['Event']>, ParentType, ContextType, RequireFields<QueryEventArgs, 'id'>>;
  events?: Resolver<Maybe<Array<Maybe<ResolversTypes['Event']>>>, ParentType, ContextType, Partial<QueryEventsArgs>>;
  eventsByOrganization?: Resolver<Maybe<Array<Maybe<ResolversTypes['Event']>>>, ParentType, ContextType, Partial<QueryEventsByOrganizationArgs>>;
  getDonationById?: Resolver<ResolversTypes['Donation'], ParentType, ContextType, RequireFields<QueryGetDonationByIdArgs, 'id'>>;
  getDonationByOrgId?: Resolver<Maybe<Array<Maybe<ResolversTypes['Donation']>>>, ParentType, ContextType, RequireFields<QueryGetDonationByOrgIdArgs, 'orgId'>>;
  getDonations?: Resolver<Maybe<Array<Maybe<ResolversTypes['Donation']>>>, ParentType, ContextType>;
  getPlugins?: Resolver<Maybe<Array<Maybe<ResolversTypes['Plugin']>>>, ParentType, ContextType>;
  getlanguage?: Resolver<Maybe<Array<Maybe<ResolversTypes['Translation']>>>, ParentType, ContextType, RequireFields<QueryGetlanguageArgs, 'lang_code'>>;
  groupChatMessages?: Resolver<Maybe<Array<Maybe<ResolversTypes['GroupChatMessage']>>>, ParentType, ContextType>;
  groupChats?: Resolver<Maybe<Array<Maybe<ResolversTypes['GroupChat']>>>, ParentType, ContextType>;
  groups?: Resolver<Maybe<Array<Maybe<ResolversTypes['Group']>>>, ParentType, ContextType>;
  isUserRegister?: Resolver<Maybe<ResolversTypes['EventRegistrants']>, ParentType, ContextType, RequireFields<QueryIsUserRegisterArgs, 'eventId'>>;
  me?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  myLanguage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  organizations?: Resolver<Maybe<Array<Maybe<ResolversTypes['Organization']>>>, ParentType, ContextType, Partial<QueryOrganizationsArgs>>;
  organizationsConnection?: Resolver<Array<Maybe<ResolversTypes['Organization']>>, ParentType, ContextType, Partial<QueryOrganizationsConnectionArgs>>;
  organizationsMemberConnection?: Resolver<ResolversTypes['UserConnection'], ParentType, ContextType, RequireFields<QueryOrganizationsMemberConnectionArgs, 'orgId'>>;
  plugin?: Resolver<Maybe<Array<Maybe<ResolversTypes['Plugin']>>>, ParentType, ContextType, RequireFields<QueryPluginArgs, 'orgId'>>;
  post?: Resolver<Maybe<ResolversTypes['Post']>, ParentType, ContextType, RequireFields<QueryPostArgs, 'id'>>;
  posts?: Resolver<Maybe<Array<Maybe<ResolversTypes['Post']>>>, ParentType, ContextType, Partial<QueryPostsArgs>>;
  postsByOrganization?: Resolver<Maybe<Array<Maybe<ResolversTypes['Post']>>>, ParentType, ContextType, RequireFields<QueryPostsByOrganizationArgs, 'id'>>;
  postsByOrganizationConnection?: Resolver<Maybe<ResolversTypes['PostConnection']>, ParentType, ContextType, RequireFields<QueryPostsByOrganizationConnectionArgs, 'id'>>;
  registeredEventsByUser?: Resolver<Maybe<Array<Maybe<ResolversTypes['Event']>>>, ParentType, ContextType, Partial<QueryRegisteredEventsByUserArgs>>;
  registrantsByEvent?: Resolver<Maybe<Array<Maybe<ResolversTypes['User']>>>, ParentType, ContextType, RequireFields<QueryRegistrantsByEventArgs, 'id'>>;
  tasksByEvent?: Resolver<Maybe<Array<Maybe<ResolversTypes['Task']>>>, ParentType, ContextType, RequireFields<QueryTasksByEventArgs, 'id'>>;
  tasksByUser?: Resolver<Maybe<Array<Maybe<ResolversTypes['Task']>>>, ParentType, ContextType, RequireFields<QueryTasksByUserArgs, 'id'>>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType, RequireFields<QueryUserArgs, 'id'>>;
  userLanguage?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType, RequireFields<QueryUserLanguageArgs, 'userId'>>;
  users?: Resolver<Maybe<Array<Maybe<ResolversTypes['User']>>>, ParentType, ContextType, Partial<QueryUsersArgs>>;
  usersConnection?: Resolver<Array<Maybe<ResolversTypes['User']>>, ParentType, ContextType, Partial<QueryUsersConnectionArgs>>;
};

export type SubscriptionResolvers<ContextType = any, ParentType extends ResolversParentTypes['Subscription'] = ResolversParentTypes['Subscription']> = {
  directMessageChat?: SubscriptionResolver<Maybe<ResolversTypes['MessageChat']>, "directMessageChat", ParentType, ContextType>;
  messageSentToDirectChat?: SubscriptionResolver<Maybe<ResolversTypes['DirectChatMessage']>, "messageSentToDirectChat", ParentType, ContextType>;
  messageSentToGroupChat?: SubscriptionResolver<Maybe<ResolversTypes['GroupChatMessage']>, "messageSentToGroupChat", ParentType, ContextType>;
};

export type TaskResolvers<ContextType = any, ParentType extends ResolversParentTypes['Task'] = ResolversParentTypes['Task']> = {
  _id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  createdAt?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  creator?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  deadline?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  description?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  event?: Resolver<ResolversTypes['Event'], ParentType, ContextType>;
  title?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type TranslationResolvers<ContextType = any, ParentType extends ResolversParentTypes['Translation'] = ResolversParentTypes['Translation']> = {
  en_value?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  lang_code?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  translation?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  verified?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export interface UploadScalarConfig extends GraphQLScalarTypeConfig<ResolversTypes['Upload'], any> {
  name: 'Upload';
}

export type UserResolvers<ContextType = any, ParentType extends ResolversParentTypes['User'] = ResolversParentTypes['User']> = {
  _id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  adminApproved?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  adminFor?: Resolver<Maybe<Array<Maybe<ResolversTypes['Organization']>>>, ParentType, ContextType>;
  appLanguageCode?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  createdAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  createdEvents?: Resolver<Maybe<Array<Maybe<ResolversTypes['Event']>>>, ParentType, ContextType>;
  createdOrganizations?: Resolver<Maybe<Array<Maybe<ResolversTypes['Organization']>>>, ParentType, ContextType>;
  email?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  eventAdmin?: Resolver<Maybe<Array<Maybe<ResolversTypes['Event']>>>, ParentType, ContextType>;
  firstName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  image?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  joinedOrganizations?: Resolver<Maybe<Array<Maybe<ResolversTypes['Organization']>>>, ParentType, ContextType>;
  lastName?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  membershipRequests?: Resolver<Maybe<Array<Maybe<ResolversTypes['MembershipRequest']>>>, ParentType, ContextType>;
  organizationUserBelongsTo?: Resolver<Maybe<ResolversTypes['Organization']>, ParentType, ContextType>;
  organizationsBlockedBy?: Resolver<Maybe<Array<Maybe<ResolversTypes['Organization']>>>, ParentType, ContextType>;
  pluginCreationAllowed?: Resolver<Maybe<ResolversTypes['Boolean']>, ParentType, ContextType>;
  registeredEvents?: Resolver<Maybe<Array<Maybe<ResolversTypes['Event']>>>, ParentType, ContextType>;
  tokenVersion?: Resolver<ResolversTypes['Int'], ParentType, ContextType>;
  userType?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UserAttendeResolvers<ContextType = any, ParentType extends ResolversParentTypes['UserAttende'] = ResolversParentTypes['UserAttende']> = {
  _id?: Resolver<ResolversTypes['ID'], ParentType, ContextType>;
  createdAt?: Resolver<Maybe<ResolversTypes['String']>, ParentType, ContextType>;
  status?: Resolver<ResolversTypes['Status'], ParentType, ContextType>;
  user?: Resolver<ResolversTypes['User'], ParentType, ContextType>;
  userId?: Resolver<ResolversTypes['String'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type UserConnectionResolvers<ContextType = any, ParentType extends ResolversParentTypes['UserConnection'] = ResolversParentTypes['UserConnection']> = {
  aggregate?: Resolver<ResolversTypes['AggregateUser'], ParentType, ContextType>;
  edges?: Resolver<Array<Maybe<ResolversTypes['User']>>, ParentType, ContextType>;
  pageInfo?: Resolver<ResolversTypes['PageInfo'], ParentType, ContextType>;
  __isTypeOf?: IsTypeOfResolverFn<ParentType, ContextType>;
};

export type Resolvers<ContextType = any> = {
  AggregatePost?: AggregatePostResolvers<ContextType>;
  AggregateUser?: AggregateUserResolvers<ContextType>;
  AndroidFirebaseOptions?: AndroidFirebaseOptionsResolvers<ContextType>;
  AuthData?: AuthDataResolvers<ContextType>;
  Comment?: CommentResolvers<ContextType>;
  DeletePayload?: DeletePayloadResolvers<ContextType>;
  DirectChat?: DirectChatResolvers<ContextType>;
  DirectChatMessage?: DirectChatMessageResolvers<ContextType>;
  Donation?: DonationResolvers<ContextType>;
  Event?: EventResolvers<ContextType>;
  EventRegistrants?: EventRegistrantsResolvers<ContextType>;
  ExtendSession?: ExtendSessionResolvers<ContextType>;
  Group?: GroupResolvers<ContextType>;
  GroupChat?: GroupChatResolvers<ContextType>;
  GroupChatMessage?: GroupChatMessageResolvers<ContextType>;
  IOSFirebaseOptions?: IosFirebaseOptionsResolvers<ContextType>;
  Language?: LanguageResolvers<ContextType>;
  LanguageModel?: LanguageModelResolvers<ContextType>;
  MembershipRequest?: MembershipRequestResolvers<ContextType>;
  Message?: MessageResolvers<ContextType>;
  MessageChat?: MessageChatResolvers<ContextType>;
  Mutation?: MutationResolvers<ContextType>;
  Organization?: OrganizationResolvers<ContextType>;
  OrganizationInfoNode?: OrganizationInfoNodeResolvers<ContextType>;
  OtpData?: OtpDataResolvers<ContextType>;
  PageInfo?: PageInfoResolvers<ContextType>;
  Plugin?: PluginResolvers<ContextType>;
  PluginField?: PluginFieldResolvers<ContextType>;
  Post?: PostResolvers<ContextType>;
  PostConnection?: PostConnectionResolvers<ContextType>;
  Query?: QueryResolvers<ContextType>;
  Subscription?: SubscriptionResolvers<ContextType>;
  Task?: TaskResolvers<ContextType>;
  Translation?: TranslationResolvers<ContextType>;
  Upload?: GraphQLScalarType;
  User?: UserResolvers<ContextType>;
  UserAttende?: UserAttendeResolvers<ContextType>;
  UserConnection?: UserConnectionResolvers<ContextType>;
};

export type DirectiveResolvers<ContextType = any> = {
  auth?: AuthDirectiveResolver<any, any, ContextType>;
  role?: RoleDirectiveResolver<any, any, ContextType>;
};
