const Organization = require("../../models/Organization");
const User = require("../../models/User");

const authCheck = require("../functions/authCheck");
const shortid = require("shortid");
const { createWriteStream, unlink } = require("fs");
const path = require("path")
const adminCheck = require("../functions/adminCheck");
const imageAlreadyInDbCheck = require("../../helper_functions/imageAlreadyInDbCheck")

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


        let orgImageAlreadyInDb = await imageAlreadyInDbCheck(organizationImage, org.image); 


        const newOrganization = await Organization.findOneAndUpdate(
            { _id: org.id },
            {
                $set: {
                    image: orgImageAlreadyInDb ? orgImageAlreadyInDb : organizationImage
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
