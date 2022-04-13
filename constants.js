let URL = 'http://calico.palisadoes.org/talawa/graphql';

if (process.env.NODE_ENV === 'test') {
  URL = 'http://localhost:4000/graphql';
}

///////////////////// not found errors //////////////////

// event
const NOT_FOUND_EVENT_MESSAGE = 'event.notFound';
const NOT_FOUND_EVENT_CODE = 'event.notFound';
const NOT_FOUND_EVENT_PARAM = 'event';
const NOT_FOUND_EVENT_TEST = 'Event not found';

// organization
const NOT_FOUND_ORGANIZATION_MESSAGE = 'organization.notFound';
const NOT_FOUND_ORGANIZATION_CODE = 'organization.notFound';
const NOT_FOUND_ORGANIZATION_PARAM = 'organization';
const NOT_FOUND_ORGANIZATION_TEST = 'Organization not found';

// organization profile
const NOT_FOUND_ORGANIZATION_PROFILE_MESSAGE =
  'organization.profileImage.notFound';
const NOT_FOUND_ORGANIZATION_PROFILE_CODE =
  'organization.profileImage.notFound';
const NOT_FOUND_ORGANIZATION_PROFILE_PARAM = 'organization';
const NOT_FOUND_ORGANIZATION_PROFILE_TEST = 'Organization profile not found';

// comment
const NOT_FOUND_COMMENT_MESSAGE = 'comment.notFound';
const NOT_FOUND_COMMENT_CODE = 'comment.notFound';
const NOT_FOUND_COMMENT_PARAM = 'comment';
const NOT_FOUND_COMMENT_TEST = 'Comment not found';

// organization memebr
const NOT_FOUND_ORGANIZATION_MEMBER_MESSAGE = 'organization.member.notFound';
const NOT_FOUND_ORGANIZATION_MEMBER_CODE = 'organization.member.notFound';
const NOT_FOUND_ORGANIZATION_MEMBER_PARAM = 'organizationMember';
const NOT_FOUND_ORGANIZATION_MEMBER_TEST = 'Organization member not found';

// group
const NOT_FOUND_GROUP_MESSAGE = 'group.notFound';
const NOT_FOUND_GROUP_CODE = 'group.notFound';
const NOT_FOUND_GROUP_PARAM = 'group';
const NOT_FOUND_GROUP_TEST = 'Group not found';

// user
const NOT_FOUND_USER_MESSAGE = 'user.notFound';
const NOT_FOUND_USER_CODE = 'user.notFound';
const NOT_FOUND_USER_PARAM = 'user';
const NOT_FOUND_USER_TEST = 'User not found';

// user profile image
const NOT_FOUND_USER_PROFILE_MESSAGE = 'user.profileImage.notFound';
const NOT_FOUND_USER_PROFILE_CODE = 'user.profileImage.notFound';
const NOT_FOUND_USER_PROFILE_PARAM = 'userProfileImage';
const NOT_FOUND_USER_PROFILE_TEST = 'User profile image not found';

// post
const NOT_FOUND_POST_MESSAGE = 'post.notFound';
const NOT_FOUND_POST_CODE = 'post.notFound';
const NOT_FOUND_POST_PARAM = 'post';
const NOT_FOUND_POST_TEST = 'Post not found';

//chat
const NOT_FOUND_CHAT_MESSAGE = 'chat.notFound';
const NOT_FOUND_CHAT_CODE = 'chat.notFound';
const NOT_FOUND_CHAT_PARAM = 'chat';
const NOT_FOUND_CHAT_TEST = 'Chat not found';

//direct chats
const NOT_FOUND_DIRECT_CHATS_MESSAGE = 'directChats.notFound';
const NOT_FOUND_DIRECT_CHATS_CODE = 'directChats.notFound';
const NOT_FOUND_DIRECT_CHATS_PARAM = 'directChats';
const NOT_FOUND_DIRECT_CHATS_TEST = 'DirectChats not found';

//event project
const NOT_FOUND_EVENT_PROJECT_MESSAGE = 'eventProject.notFound';
const NOT_FOUND_EVENT_PROJECT_CODE = 'eventProject.notFound';
const NOT_FOUND_EVENT_PROJECT_PARAM = 'eventProject';
const NOT_FOUND_EVENT_PROJECT_TEST = 'EventProject not found';

//member
const NOT_FOUND_MEMBER_MESSAGE = 'member.notFound';
const NOT_FOUND_MEMBER_CODE = 'member.notFound';
const NOT_FOUND_MEMBER_PARAM = 'member';
const NOT_FOUND_MEMBER_TEST = 'Member not found';

//task
const NOT_FOUND_TASK_MESSAGE = 'task.notFound';
const NOT_FOUND_TASK_CODE = 'task.notFound';
const NOT_FOUND_TASK_PARAM = 'task';
const NOT_FOUND_TASK_TEST = 'Task not found';

//member ship request
const NOT_FOUND_MEMBERSHIP_REQUEST_MESSAGE = 'memebrshipRequest.notFound';
const NOT_FOUND_MEMBERSHIP_REQUEST_CODE = 'memebrshipRequest.notFound';
const NOT_FOUND_MEMBERSHIP_REQUEST_PARAM = 'membershipRequest';
const NOT_FOUND_MEMBERSHIP_REQUEST_TEST = 'Membership request not found';

///////////////////// validation errors //////////////////

//invalid file type
const INVALID_FILE_TYPE_MESSAGE = 'invalid.fileType';
const INVALID_FILE_TYPE_CODE = 'invalid.fileType';
const INVALID_FILE_TYPE_PARAM = 'fileType';
const INVALID_FILE_TYPE_TEST = 'Invalid file type';

//missing parameters
const INVALID_MISSING_PARAMETER_MESSAGE = 'parameter.missing';
const INVALID_MISSING_PARAMETER_CODE = 'parameter.missing';
const INVALID_MISSING_PARAMETER_PARAM = 'parameter';
const INVALID_MISSING_PARAMETER_TEST = 'Parameter is missing';

//credentials
const INVALID_CREDENTIALS_MESSAGE = 'invalid.credentials';
const INVALID_CREDENTIALS_CODE = 'invalid.credentials';
const INVALID_CREDENTIALS_PARAM = 'credentials';
const INVALID_CREDENTIALS_TEST = 'Invalid credentials';

// refresh token
const INVALID_REFRESH_TOKEN_MESSAGE = 'invalid.refreshToken';
const INVALID_REFRESH_TOKEN_CODE = 'invalid.refreshToken';
const INVALID_REFRESH_TOKEN_PARAM = 'refreshToken';
const INVALID_REFRESH_TOKEN_TEST = 'Invalid refreshToken';

///////////////////// conflict errors //////////////////

// email
const CONFLICT_EMAIL_MESSAGE = 'email.alreadyExist';
const CONFLICT_EMAIL_CODE = 'email.alreadyExist';
const CONFLICT_EMAIL_PARAM = 'email';
const CONFLICT_EMAIL_TEST = 'Email already exist';

// membership request already exists
const CONFLICT_MEMBERSHIP_EXISTS_MESSAGE = 'membershipRequest.alreadyExists';
const CONFLICT_MEMBERSHIP_EXISTS_CODE = 'membershipRequest.alreadyExists';
const CONFLICT_MEMBERSHIP_EXISTS_PARAM = 'memebrshipRequest';
const CONFLICT_MEMBERSHIP_EXISTS_TEST = 'Membership request already exists';

// user already is a member
const CONFLICT_ALREADY_MEMBER_MESSAGE = 'user.alreadyMember';
const CONFLICT_ALREADY_MEMBER_CODE = 'user.alreadyMember';
const CONFLICT_ALREADY_MEMBER_PARAM = 'userAlreadyMember';
const CONFLICT_ALREADY_MEMBER_TEST = 'User is already a member';

// translation is already present
const CONFLICT_ALREADY_PRESENT_MESSAGE = 'translation.alreadyPresent';
const CONFLICT_ALREADY_PRESENT_CODE = 'translation.alreadyPresent';
const CONFLICT_ALREADY_PRESENT_PARAM = 'translationAlreadyPresent';
const CONFLICT_ALREADY_PRESENT_TEST = 'Already Present';

// register
const CONFLICT_REGISTER_MESSAGE = 'registrant.alreadyExist';
const CONFLICT_REGISTER_CODE = 'registrant.alreadyExist';
const CONFLICT_REGISTER_PARAM = 'registrant';
const CONFLICT_REGISTER_TEST = 'Registrant already exist';

// unregister
const CONFLICT_UNREGISTER_MESSAGE = 'registrant.alreadyUnregistered';
const CONFLICT_UNREGISTER_CODE = 'registrant.alreadyUnregistered';
const CONFLICT_UNREGISTER_PARAM = 'registrant.alreadyUnregistered';
const CONFLICT_UNREGISTER_TEST = 'Registrant already unregistered';

///////////////////// authorization errors //////////////////

// user
const NOT_AUTHORIZED_USER_MESSAGE = 'user.notAuthorized';
const NOT_AUTHORIZED_USER_CODE = 'user.notAuthorized';
const NOT_AUTHORIZED_USER_PARAM = 'userAuthorization';
const NOT_AUTHORIZED_USER_TEST = 'User not authorized';

// organization
const NOT_AUTHORIZED_ORGANIZATION_MESSAGE = 'organization.notAuthorized';
const NOT_AUTHORIZED_ORGANIZATION_CODE = 'organization.notAuthorized';
const NOT_AUTHORIZED_ORGANIZATION_PARAM = 'organization';
const NOT_AUTHORIZED_ORGANIZATION_TEST = 'Organization not authorized';
///////////////////// authentication errors //////////////////

// user
const NOT_AUTHENTICATED_USER_MESSAGE = 'user.notAuthenticated';
const NOT_AUTHENTICATED_USER_CODE = 'user.notAuthenticated';
const NOT_AUTHENTICATED_USER_PARAM = 'userAuthentication';
const NOT_AUTHENTICATED_USER_TEST = 'User not authenticated';

module.exports = {
  URL,

  ///////////// not found errors ////////////////
  //chat
  NOT_FOUND_CHAT_CODE,
  NOT_FOUND_CHAT_MESSAGE,
  NOT_FOUND_CHAT_PARAM,
  NOT_FOUND_CHAT_TEST,
  //direct chats
  NOT_FOUND_DIRECT_CHATS_CODE,
  NOT_FOUND_DIRECT_CHATS_MESSAGE,
  NOT_FOUND_DIRECT_CHATS_PARAM,
  NOT_FOUND_DIRECT_CHATS_TEST,
  // user
  NOT_FOUND_USER_CODE,
  NOT_FOUND_USER_MESSAGE,
  NOT_FOUND_USER_PARAM,
  NOT_FOUND_USER_TEST,
  // user profile image
  NOT_FOUND_USER_PROFILE_CODE,
  NOT_FOUND_USER_PROFILE_MESSAGE,
  NOT_FOUND_USER_PROFILE_PARAM,
  NOT_FOUND_USER_PROFILE_TEST,
  //organization
  NOT_FOUND_ORGANIZATION_CODE,
  NOT_FOUND_ORGANIZATION_MESSAGE,
  NOT_FOUND_ORGANIZATION_PARAM,
  NOT_FOUND_ORGANIZATION_TEST,
  //organization profile
  NOT_FOUND_ORGANIZATION_PROFILE_CODE,
  NOT_FOUND_ORGANIZATION_PROFILE_MESSAGE,
  NOT_FOUND_ORGANIZATION_PROFILE_PARAM,
  NOT_FOUND_ORGANIZATION_PROFILE_TEST,
  //organization member
  NOT_FOUND_ORGANIZATION_MEMBER_CODE,
  NOT_FOUND_ORGANIZATION_MEMBER_MESSAGE,
  NOT_FOUND_ORGANIZATION_MEMBER_PARAM,
  NOT_FOUND_ORGANIZATION_MEMBER_TEST,
  // member
  NOT_FOUND_MEMBER_CODE,
  NOT_FOUND_MEMBER_MESSAGE,
  NOT_FOUND_MEMBER_PARAM,
  NOT_FOUND_MEMBER_TEST,
  //task
  NOT_FOUND_TASK_CODE,
  NOT_FOUND_TASK_MESSAGE,
  NOT_FOUND_TASK_PARAM,
  NOT_FOUND_TASK_TEST,
  //member ship request
  NOT_FOUND_MEMBERSHIP_REQUEST_CODE,
  NOT_FOUND_MEMBERSHIP_REQUEST_MESSAGE,
  NOT_FOUND_MEMBERSHIP_REQUEST_PARAM,
  NOT_FOUND_MEMBERSHIP_REQUEST_TEST,
  //group
  NOT_FOUND_GROUP_CODE,
  NOT_FOUND_GROUP_MESSAGE,
  NOT_FOUND_GROUP_PARAM,
  NOT_FOUND_GROUP_TEST,
  //comment
  NOT_FOUND_COMMENT_MESSAGE,
  NOT_FOUND_COMMENT_CODE,
  NOT_FOUND_COMMENT_PARAM,
  NOT_FOUND_COMMENT_TEST,
  //event
  NOT_FOUND_EVENT_CODE,
  NOT_FOUND_EVENT_MESSAGE,
  NOT_FOUND_EVENT_PARAM,
  NOT_FOUND_EVENT_TEST,
  //event project
  NOT_FOUND_EVENT_PROJECT_CODE,
  NOT_FOUND_EVENT_PROJECT_MESSAGE,
  NOT_FOUND_EVENT_PROJECT_PARAM,
  NOT_FOUND_EVENT_PROJECT_TEST,
  //post
  NOT_FOUND_POST_CODE,
  NOT_FOUND_POST_MESSAGE,
  NOT_FOUND_POST_PARAM,
  NOT_FOUND_POST_TEST,
  ////////////// validation errors /////////////
  //invalid file type
  INVALID_FILE_TYPE_CODE,
  INVALID_FILE_TYPE_MESSAGE,
  INVALID_FILE_TYPE_PARAM,
  INVALID_FILE_TYPE_TEST,
  //missing parameters
  INVALID_MISSING_PARAMETER_CODE,
  INVALID_MISSING_PARAMETER_MESSAGE,
  INVALID_MISSING_PARAMETER_PARAM,
  INVALID_MISSING_PARAMETER_TEST,
  //credentials
  INVALID_CREDENTIALS_CODE,
  INVALID_CREDENTIALS_MESSAGE,
  INVALID_CREDENTIALS_PARAM,
  INVALID_CREDENTIALS_TEST,
  //refresh token
  INVALID_REFRESH_TOKEN_CODE,
  INVALID_REFRESH_TOKEN_MESSAGE,
  INVALID_REFRESH_TOKEN_PARAM,
  INVALID_REFRESH_TOKEN_TEST,
  ///////////////// conflict errors ////////////
  //email exists
  CONFLICT_EMAIL_CODE,
  CONFLICT_EMAIL_PARAM,
  CONFLICT_EMAIL_MESSAGE,
  CONFLICT_EMAIL_TEST,
  // membership request already exists
  CONFLICT_MEMBERSHIP_EXISTS_CODE,
  CONFLICT_MEMBERSHIP_EXISTS_MESSAGE,
  CONFLICT_MEMBERSHIP_EXISTS_PARAM,
  CONFLICT_MEMBERSHIP_EXISTS_TEST,
  // user already is a member
  CONFLICT_ALREADY_MEMBER_CODE,
  CONFLICT_ALREADY_MEMBER_MESSAGE,
  CONFLICT_ALREADY_MEMBER_PARAM,
  CONFLICT_ALREADY_MEMBER_TEST,
  // translation is already present
  CONFLICT_ALREADY_PRESENT_CODE,
  CONFLICT_ALREADY_PRESENT_MESSAGE,
  CONFLICT_ALREADY_PRESENT_PARAM,
  CONFLICT_ALREADY_PRESENT_TEST,
  // register
  CONFLICT_REGISTER_CODE,
  CONFLICT_REGISTER_MESSAGE,
  CONFLICT_REGISTER_PARAM,
  CONFLICT_REGISTER_TEST,
  // unregister
  CONFLICT_UNREGISTER_CODE,
  CONFLICT_UNREGISTER_MESSAGE,
  CONFLICT_UNREGISTER_PARAM,
  CONFLICT_UNREGISTER_TEST,
  //////////////////// authorization errors /////////
  //user
  NOT_AUTHORIZED_USER_CODE,
  NOT_AUTHORIZED_USER_MESSAGE,
  NOT_AUTHORIZED_USER_PARAM,
  NOT_AUTHORIZED_USER_TEST,
  //organization
  NOT_AUTHORIZED_ORGANIZATION_CODE,
  NOT_AUTHORIZED_ORGANIZATION_MESSAGE,
  NOT_AUTHORIZED_ORGANIZATION_PARAM,
  NOT_AUTHORIZED_ORGANIZATION_TEST,
  //////////////////// authentication errors /////////
  //user
  NOT_AUTHENTICATED_USER_CODE,
  NOT_AUTHENTICATED_USER_MESSAGE,
  NOT_AUTHENTICATED_USER_PARAM,
  NOT_AUTHENTICATED_USER_TEST,
};
