
const authCheck = require("../functions/authCheck");
const Organization = require("../../models/Organization");
const User = require("../../models/User");
const adminCheck = require("../functions/adminCheck");
const deleteImage = require("../../helper_functions/deleteImage")

module.exports = async (parent, args, context, info) => {
    authCheck(context);
    try{
    const user = await User.findById(context.userId);
    if (!user) throw Apperror("User not found")

    const org = await Organization.findById(args.organizationId);
    if (!org) throw Apperror("Organization not found");

    adminCheck(context, org) // Ensures user is an administrator of the organization

    if (!org.image) throw Apperror("Organization does not have a profile image")

    await deleteImage(org.image)

    const newOrganization = await Organization.findOneAndUpdate({
        _id: org.id
    }, {
        $set: {
            image: null
        }
    }, {
        new: true
    })
    return newOrganization;
    }catch(e){
        throw Apperror("Server error" + e, 500);
    }

}