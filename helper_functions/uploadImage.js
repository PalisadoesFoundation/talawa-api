
const shortid = require("shortid");
const { createWriteStream} = require("fs");
const path = require("path")



module.exports = async (file) => {
    const id = shortid.generate();
    const { createReadStream, filename } = await file;
    
    // upload new image
    await new Promise((res) =>
        createReadStream().pipe(
            createWriteStream(
                path.join(__dirname, "../images", `/${id}-${filename}`)
            )
        )
            .on("close", res)
    );
    let imagePath = `images/${id}-${filename}`;

    return imagePath;
}


