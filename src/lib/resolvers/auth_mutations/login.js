const bcrypt = require('bcryptjs');
const { User } = require('../../models');
const {
  createAccessToken,
  createRefreshToken,
} = require('../../utilities/auth');
const { NotFoundError, ValidationError } = require('../../libraries/errors');
const requestContext = require('../../libraries/request-context');
const { copyToClipboard } = require('../../utilities');
const { androidFirebaseOptions, iosFirebaseOptions } = require('../../config');

module.exports = async (parent, args) => {
  const user = await User.findOne({ email: args.data.email.toLowerCase() })
    .populate('joinedOrganizations')
    .populate('createdOrganizations')
    .populate('createdEvents')
    .populate('registeredEvents')
    .populate('eventAdmin')
    .populate('adminFor')
    .populate('membershipRequests')
    .populate('organizationsBlockedBy')
    .populate('organizationUserBelongsTo');

  if (!user) {
    throw new NotFoundError(
      requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }

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
