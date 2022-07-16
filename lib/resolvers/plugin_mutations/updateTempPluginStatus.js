const PluginTemp = require('../../models/temp/Plugin');

module.exports = async (parent, args, context) => {
    console.log("Argment s ", args)
    const result = await PluginTemp.findByIdAndUpdate(args.id, { pluginInstallStatus: args.status }, { new: true },
        (err, res) => {
            if (err) {
                console.log(err)
            }
            else {
                console.log("Updated Plugin : ", res);
            };
        });
    const plug = await PluginTemp.findById(args.id)
    return plug;
}
