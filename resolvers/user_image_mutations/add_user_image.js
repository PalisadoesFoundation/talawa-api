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


        let userImageAlreadyInDb = await imageAlreadyInDbCheck(userImage, user); 
        

        return await User.findOneAndUpdate(
            { _id: user.id },
            {
                $set: {
                    image: userImageAlreadyInDb ? userImageAlreadyInDb : userImage // if the image already exists use that image other wise use the image just uploaded
                }
            },
            {
                new: true
            }
        );


    } catch (e) {
        throw e;
    }
};

module.exports = addUserImage;
