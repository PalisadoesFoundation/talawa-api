const mongoose = require("mongoose");
const { isEmail } = require('validator');
const Schema = mongoose.Schema;


const userSchema = new Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    email: {
        type: String,
        validate: [ isEmail, 'invalid email' ],
        required: true
    },
    password: {
        type: String,
        required: true
    },
    createdOrganizations: [
        {
            type: Schema.Types.ObjectId,
            ref: "Organization"
        }
    ],
    joinedOrganizations: [
        {
            type: Schema.Types.ObjectId,
            ref: "Organization"
        }
    ],
    adminFor: [
        {
            type: Schema.Types.ObjectId,
            ref: "Organization"
        }
    ]
})

module.exports = mongoose.model("User", userSchema);

