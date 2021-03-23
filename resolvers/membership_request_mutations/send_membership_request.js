const User = require("../../models/User");
const Organization = require("../../models/Organization");
const MembershipRequest = require("../../models/MembershipRequest");
const authCheck = require("../functions/authCheck");

module.exports = async (parent, args, context, info) => {
  authCheck(context);
  try {
    //ensure user exists
    const user = await User.findOne({ _id: context.userId });
    if (!user) throw Apperror("User does not exist");

    //ensure organization exists
    let org = await Organization.findOne({ _id: args.organizationId });
    if (!org) throw Apperror("Organization not found");

    //create membership request
    let exists = await MembershipRequest.find(
      {
        user: user.id,
        organization: org.id
      }
    )
    console.log(exists)
    if(exists.length>0)throw Apperror("This user has already sent a membership request to this organization") 

    let newMembershipRequest = new MembershipRequest({
      user,
      organization: org,
    })
    newMembershipRequest = await newMembershipRequest.save();

    //add membership request to organization
    await Organization.findOneAndUpdate(
      {_id: org._doc._id},
      {
        $set: {
          membershipRequests: [...org._doc.membershipRequests, newMembershipRequest]
        }
      }
    )

    //add membership request to user
    await User.findOneAndUpdate(
      {_id: user._doc._id},
      {
        $set: {
          membershipRequests: [...user._doc.membershipRequests, newMembershipRequest]
        }
      }
    )

    return newMembershipRequest._doc;

  } catch (e) {
    throw e;
  }
};
