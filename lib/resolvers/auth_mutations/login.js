const bcrypt = require('bcryptjs');
const { customArrayPopulate } = require('../user_query/users');
const User = require('../../models/User');
const {
  createAccessToken,
  createRefreshToken,
} = require('../../helper_functions/auth');
const { NotFoundError, ValidationError } = require('errors');
const requestContext = require('talawa-request-context');
const copyToClipboard = require('../functions/copyToClipboard');
const {
  androidFirebaseOptions,
  iosFirebaseOptions,
} = require('../../../firebaseOptions');

module.exports = async (parent, args) => {
  const user = await User.findOne({ email: args.data.email.toLowerCase() })
    .populate('joinedOrganizations')
    .populate('createdOrganizations')
    .populate('adminFor')
    .populate('organizationsBlockedBy')
    .populate('organizationUserBelongsTo')
    .populate('membershipRequests');

  if (!user) {
    throw new NotFoundError(
      requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }

  await customArrayPopulate(user, 'eventAdmin', 'Event');
  await customArrayPopulate(user, 'createdEvents', 'Event');
  await customArrayPopulate(user, 'registeredEvents', 'Event');

  const isEqual = await bcrypt.compare(args.data.password, user._doc.password);

  if (!isEqual) {
    throw new ValidationError(
      [
        {
          message: requestContext.translate('invalid.credentials'),
          code: 'invalid.credentials',
          param: 'credentials',
        },
      ],
      requestContext.translate('invalid.credentials')
    );
  }

  const accessToken = await createAccessToken(user);
  const refreshToken = await createRefreshToken(user);

  copyToClipboard(`{
  "Authorization": "Bearer ${accessToken}"
}`);

  return {
    user: {
      ...user._doc,
      password: null,
    },
    accessToken,
    refreshToken,
    androidFirebaseOptions,
    iosFirebaseOptions,
  };
};
