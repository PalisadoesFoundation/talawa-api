
const authCheck = require("../functions/authCheck");
const Organization = require("../../models/Organization");
const User = require("../../models/User");
const { unlink } = require("fs");
const adminCheck = require("../functions/adminCheck");
const deleteImage = require("../../helper_functions/deleteImage")

module.exports = async (parent, args, context, info) => {
    authCheck(context);

    const user = await User.findById(context.userId);
    if (!user) throw new Error("User not found")

    const org = await Organization.findById(args.organizationId);
    if (!org) throw new Error("Organization not found");

    adminCheck(context, org) // Ensures user is an administrator of the organization

    if (!org.image) throw new Error("Organization does not have a profile image")

    deleteImage(org.image)

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

}