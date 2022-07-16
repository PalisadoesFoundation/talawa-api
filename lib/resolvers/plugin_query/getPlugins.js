const PluginTemp = require("../../../models/temp/Plugin");

module.exports = async () => {
    return await PluginTemp.find();
};
