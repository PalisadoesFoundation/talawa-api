const User = require("../../models/User");
const authCheck = require("../functions/authCheck");
const shortid = require("shortid");
const { createWriteStream, unlink } = require("fs");
const path = require("path")

const addUserImage = async (parent, args, context, info) => {
    authCheck(context);

    try {
        const user = await User.findById(context.userId);
        if (!user) throw new Error("User not found")

        let userImage;
        if (args.file) {

            if(user.image) { // If user already has a profile picture delete it from the API
                unlink(user.image, function (err) {
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

            userImage = `images/${id}-${filename}`
        }

        const newUser = await User.findOneAndUpdate(
            {_id: user.id},
            {$set: {
                image: userImage
            }}, 
            {
                new:true
            })

        return newUser;

    } catch (e) {
        throw e;
    }
};

module.exports = addUserImage;
