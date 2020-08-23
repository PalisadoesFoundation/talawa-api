const Organization = require("../../models/Organization");
const User = require("../../models/User");

const authCheck = require("../functions/authCheck");
const shortid = require("shortid");
const { createWriteStream, unlink } = require("fs");
const path = require("path")
const adminCheck = require("../functions/adminCheck");

module.exports = async (parent, args, context, info) => {
    authCheck(context);

    try {
        const user = await User.findById(context.userId);
        if (!user) throw new Error("User not found")

        const org = await Organization.findById(args.organizationId);
        if (!org) throw new Error("Organization not found");

        adminCheck(context, org) // Ensures user is an administrator of the organization


        let organizationImage;
        if (args.file) {

            if (org.image) { // If user already has a profile picture delete it from the API
                unlink(org.image, function (err) {
                    if (err) throw err;
                    // if no error, file has been deleted successfully
                    console.log("File deleted!");
                });
            }

            const id = shortid.generate();

            const { createReadStream, filename } = await args.file;

            const upload = await new Promise((res) =>
                createReadStream().pipe(
                    createWriteStream(
                        path.join(__dirname, "../../images", `/${id}-${filename}`)
                    )
                )
                    .on("close", res)
            );

            organizationImage = `images/${id}-${filename}`
        }

        const newOrganization = await Organization.findOneAndUpdate(
            { _id: org.id },
            {
                $set: {
                    image: organizationImage
                }
            },
            {
                new: true
            })

        return newOrganization;

    } catch (e) {
        throw e;
    }
};
