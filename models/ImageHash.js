const mongoose = require("mongoose");

const Schema = mongoose.Schema;


const imageHashSchema = new Schema({
    hashValue: {
        type: String,
        required: true
    },
    fileName: {
        type: String,
        required: true
    }
})

module.exports = mongoose.model("ImageHash", imageHashSchema);