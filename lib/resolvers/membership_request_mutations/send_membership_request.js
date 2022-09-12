const User = require('../../models/User');
const Organization = require('../../models/Organization');
const MembershipRequest = require('../../models/MembershipRequest');
const { NotFoundError, ConflictError } = require('errors');
const requestContext = require('talawa-request-context');
var admin = require('firebase-admin');
var { applicationDefault } = require('firebase-admin').credential;

module.exports = async (parent, args, context) => {
  admin.initializeApp({ credential: applicationDefault() });
  // ensure user exists
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFoundError(
      requestContext.translate('user.notFound'),
      'user.notFound',
      'user'
    );
  }

  // ensure organization exists
  const org = await Organization.findOne({ _id: args.organizationId });
  if (!org) {
    throw new NotFoundError(
      requestContext.translate('organization.notFound'),
      'organization.notFound',
      'organization'
    );
  }

  // create membership request
  const exists = await MembershipRequest.find({
    user: user.id,
    organization: org.id,
  });
  console.log(exists);
  if (exists.length > 0) {
    throw new ConflictError(
      requestContext.translate('membershipRequest.alreadyExists'),
      'membershipRequest.alreadyExists',
      'membershipRequest'
    );
  }

  let newMembershipRequest = new MembershipRequest({
    user,
    organization: org,
  });
  newMembershipRequest = await newMembershipRequest.save();

  // add membership request to organization
  await Organization.findOneAndUpdate(
    { _id: org._doc._id },
    {
      $set: {
        membershipRequests: [
          ...org._doc.membershipRequests,
          newMembershipRequest,
        ],
      },
    }
  );

  // add membership request to user
  await User.findOneAndUpdate(
    { _id: user._doc._id },
    {
      $set: {
        membershipRequests: [
          ...user._doc.membershipRequests,
          newMembershipRequest,
        ],
      },
    }
  );

  const admins = org.admins;
  for (let i = 0; i < admins.length; i++) {
    const admin = admins[i];
    const adminUser = await User.findOne({ _id: admin });
    if (adminUser && adminUser.token) {
      await admin.messaging().send({
        token: adminUser.token,
        notification: {
          title: 'New Membership Request',
          body: `${user.firstName} has created a membership request in ${org.name}`,
        },
      });
    }
  }

  return newMembershipRequest._doc;
};
