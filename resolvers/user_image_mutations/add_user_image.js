const User = require("../../models/User");
const authCheck = require("../functions/authCheck");
const shortid = require("shortid");
const { createWriteStream, unlink } = require("fs");
const path = require("path")
const imageAlreadyInDbCheck = require("../../helper_functions/imageAlreadyInDbCheck")



const addUserImage = async (parent, args, context, info) => {
    authCheck(context);

    try {
        const user = await User.findById(context.userId);
        if (!user) throw new Error("User not found")

        let userImage;
        let userImageAlreadyInDb;


        // Upload New Image
        const id = shortid.generate();
        const { createReadStream, filename } = await args.file;

        // upload new image
        const upload = await new Promise((res) =>
            createReadStream().pipe(
                createWriteStream(
                    path.join(__dirname, "../../images", `/${id}-${filename}`)
                )
            )
                .on("close", res)
        );

        userImage = `images/${id}-${filename}`


        imageAlreadyInDbCheck(userImage, userImageAlreadyInDb, user);

        return await User.findOne({ _id: user.id })


    } catch (e) {
        throw e;
    }
};

module.exports = addUserImage;
