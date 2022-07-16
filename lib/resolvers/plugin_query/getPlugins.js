const Plugin = require("../../models/Plugin");

module.exports = async () => {
    return await Plugin.find();
};
